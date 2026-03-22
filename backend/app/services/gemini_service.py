"""
Gemini AI Service
-----------------
Handles all interactions with the Google Gemini API for receipt analysis.
Features:
- Advanced LCA-backed carbon calculation prompt
- Image optimization before API call
- Retry with exponential backoff
- JSON response parsing and validation
- Cloud storage upload (S3)
- Processing time tracking
"""

import asyncio
import json
import logging
import time
from typing import Optional

import google.generativeai as genai
from bson import ObjectId

from app.config import settings
from app.database.mongodb import analyses_collection
from app.utils.image_processor import optimize_for_gemini, generate_thumbnail, validate_image
from app.utils.helpers import utcnow

logger = logging.getLogger(__name__)

# ── Initialize Gemini ──────────────────────────────────────────────────────────
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


# ── Gemini Prompt ──────────────────────────────────────────────────────────────
ANALYSIS_PROMPT = """
You are an elite environmental data scientist and carbon footprint analyst with expertise in:
- Life Cycle Assessment (LCA) methodology
- Supply chain emissions calculation
- Consumer product carbon databases
- Sustainable alternatives research

MISSION: Analyze this extracted OCR text from a shopping receipt/bill/invoice with scientific precision.

CRITICAL VALIDATION:
First, determine if this is a valid receipt, bill, invoice, grocery list, or shopping screenshot.
Invalid examples: landscapes, selfies, memes, random documents, blank images, text documents unrelated to shopping.
If invalid, return ONLY: {"is_valid_receipt": false, "error": "specific reason"}

If VALID, perform deep analysis:

1. PRODUCT EXTRACTION:
   - Extract ALL items with quantities
   - Identify product categories (use standardized taxonomy)
   - Handle abbreviations, brand names, variants

2. CARBON CALCULATION (use these research-backed estimates):
   
   FOOD CATEGORIES (kg CO2e per kg of product):
   - Beef: 27 | Lamb: 39 | Pork: 12 | Chicken: 6.9
   - Fish (farmed): 5-13 | Cheese: 13.5 | Milk: 1.9/liter
   - Eggs: 4.8 | Rice: 2.7
   - Vegetables (local): 0.2-0.4 | Vegetables (imported): 0.5-2
   - Fruits (local): 0.3-0.5 | Fruits (imported): 0.5-3
   - Processed foods: add 20-40% for packaging/processing
   - Organic vs conventional: -10-20% typically

   NON-FOOD CATEGORIES:
   - Clothing (fast fashion): 8-20 kg/item | Clothing (sustainable): 3-8 kg/item
   - Electronics (smartphone): 85 kg | Electronics (laptop): 200-400 kg
   - Cosmetics: 1-3 kg/product | Cleaning products: 0.5-2 kg/item
   - Books (paper): 1.3 kg | Toys (plastic): 2-5 kg/item

   PACKAGING addon:
   - Plastic packaging: +6 kg CO2e/kg plastic
   - Cardboard: +1 kg CO2e/kg

3. ECO SCORE CALCULATION (0-100, be realistic and critical):
   Factors:
   - Food choices (40%): Plant-based=high, Red meat=very low
   - Product origin (20%): Local=high, Air-freighted=low
   - Packaging (15%): None/glass/cardboard=high, Single-use plastic=low
   - Product type (15%): Sustainable brands=high, Fast fashion=low
   - Overall carbon (10%): <5kg total=high, >50kg total=low

   Score bands:
   90-100: Exceptional | 80-89: Excellent | 70-79: Very Good
   60-69: Good | 50-59: Fair | 40-49: Below Average
   30-39: Poor | 0-29: Critical

4. SUSTAINABLE ALTERNATIVES (5-8 specific, purchasable alternatives):
   For each high-impact item:
   - Specific product name (real, available alternative)
   - Why it's better (carbon savings, certifications)
   - Estimated CO2 reduction in kg
   - Priority: high/medium/low

5. SUMMARY (2-3 sentences):
   - Overall carbon impact assessment
   - Top carbon contributor
   - One impactful change they can make
   - Honest but encouraging tone

RETURN VALID JSON ONLY (no markdown, no code blocks, no extra text):
{
  "is_valid_receipt": true,
  "products": [
    {
      "name": "string",
      "category": "string",
      "quantity": "string or null",
      "estimated_carbon_kg": 0.00,
      "carbon_intensity": "low|medium|high",
      "notes": "string or null"
    }
  ],
  "total_carbon_kg": 0.00,
  "eco_score": 0,
  "score_breakdown": {
    "food_choices": 0,
    "packaging": 0,
    "origin": 0,
    "product_type": 0
  },
  "suggestions": [
    {
      "text": "string",
      "alternative_name": "string",
      "estimated_savings_kg": 0.00,
      "priority": "high|medium|low"
    }
  ],
  "summary": "string",
  "top_contributors": ["string"],
  "comparison": "string"
}
"""

STRICT_JSON_REMINDER = "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no code fences, no extra text before or after the JSON object."


async def analyze_receipt(
    image_bytes: bytes,
    user_id: str,
    is_premium: bool = False,
) -> dict:
    """
    Analyze a receipt image using Gemini AI.

    Args:
        image_bytes: Raw image bytes.
        user_id: MongoDB user ObjectId string.
        is_premium: Whether the user has a premium/pro subscription (uses Pro model).

    Returns:
        Dict with full analysis result — matches AnalysisDocument structure.

    Raises:
        ValueError: If the image fails validation.
        RuntimeError: If Gemini API fails after retries.
    """
    # 1. Validate image
    is_valid, err = validate_image(image_bytes)
    if not is_valid:
        raise ValueError(err)

    # 2. Select model based on tier
    model_name = settings.gemini_model_premium if is_premium else settings.gemini_model_free

    # 3. Optimize image
    logger.info(f"Optimizing image for Gemini (user={user_id}, model={model_name})")
    optimized_bytes = optimize_for_gemini(image_bytes)

    # 4. Call Gemini with retry
    result = await _call_gemini_with_retry(
        image_bytes=optimized_bytes,
        model_name=model_name,
        max_retries=3,
    )

    # 5. Generate thumbnail
    thumbnail_bytes = generate_thumbnail(image_bytes)

    # 6. Upload to S3 (if configured) — runs in background, non-blocking
    image_url = None
    thumbnail_url = None
    if settings.aws_access_key_id:
        image_url, thumbnail_url = await _upload_images_to_s3(
            image_bytes=optimized_bytes,
            thumbnail_bytes=thumbnail_bytes,
            user_id=user_id,
        )

    # 7. Enrich result with metadata
    result["user_id"] = user_id
    result["receipt_image_url"] = image_url
    result["receipt_image_thumbnail"] = thumbnail_url

    return result


async def _call_gemini_with_retry(
    image_bytes: bytes,
    model_name: str,
    max_retries: int = 3,
) -> dict:
    """
    Call Gemini API with exponential backoff retry.

    Returns:
        Parsed analysis result dict.
    """
    import google.generativeai as genai
    import PIL.Image
    import io
    import pytesseract
    import platform
    import os

    model = genai.GenerativeModel(
        model_name=model_name,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            top_p=0.95,
            max_output_tokens=4096,
        ),
    )

    pil_image = PIL.Image.open(io.BytesIO(image_bytes))

    # Fallback to standard Windows location if tesseract is not in PATH
    if platform.system() == "Windows":
        tess_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(tess_path):
            pytesseract.pytesseract.tesseract_cmd = tess_path
            
    ocr_text = None
    try:
        # Check if tesseract is available
        pytesseract.get_tesseract_version()
        logger.info("Extracting text from image using local Tesseract OCR...")
        ocr_text = pytesseract.image_to_string(pil_image)
        if not ocr_text.strip():
            logger.warning("Local OCR extracted no text. Analysis might fail.")
    except Exception as e:
        logger.error(f"Local OCR failed/not installed: {e}. Falling back to Gemini Vision API.")
        ocr_text = None

    for attempt in range(1, max_retries + 1):
        start_ms = time.perf_counter() * 1000
        try:
            prompt = ANALYSIS_PROMPT if attempt == 1 else ANALYSIS_PROMPT + STRICT_JSON_REMINDER
            
            if ocr_text is not None:
                full_prompt = f"{prompt}\n\n[EXTRACTED OCR TEXT FROM RECEIPT]\n{ocr_text}"
                response = model.generate_content(full_prompt)
            else:
                fallback_prompt = prompt.replace(
                    "Analyze this extracted OCR text from a shopping receipt/bill/invoice", 
                    "Analyze this shopping receipt/bill/invoice"
                )
                response = model.generate_content([fallback_prompt, pil_image])
            elapsed_ms = int(time.perf_counter() * 1000 - start_ms)

            result = _parse_gemini_response(response.text)
            result["processing_time_ms"] = elapsed_ms
            result["gemini_model_version"] = model_name
            logger.info(
                f"Gemini analysis completed | attempt={attempt} | "
                f"time={elapsed_ms}ms | valid={result.get('is_valid_receipt')}"
            )
            return result

        except json.JSONDecodeError as e:
            logger.warning(f"Gemini JSON parse error (attempt {attempt}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(2 ** attempt)
        except Exception as e:
            logger.warning(f"Gemini API error (attempt {attempt}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(2 ** attempt)
            elif attempt == max_retries:
                raise RuntimeError(
                    f"Gemini API failed after {max_retries} attempts: {str(e)}"
                )

    raise RuntimeError("Gemini analysis failed after all retries")


def _parse_gemini_response(raw_text: str) -> dict:
    """
    Parse and validate Gemini's JSON response.
    Handles cases where the model wraps JSON in markdown fences.
    """
    text = raw_text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last fence lines
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    # Find JSON object boundaries
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", text, 0)

    data = json.loads(text[start:end])

    # Validate required fields
    if "is_valid_receipt" not in data:
        data["is_valid_receipt"] = True

    if not data.get("is_valid_receipt"):
        return {
            "is_valid_receipt": False,
            "error_message": data.get("error", "Not a valid shopping receipt"),
            "products": [],
            "total_carbon_kg": 0.0,
            "eco_score": 0,
            "score_breakdown": {"food_choices": 0, "packaging": 0, "origin": 0, "product_type": 0},
            "suggestions": [],
            "summary": "",
            "top_contributors": [],
            "comparison": None,
        }

    # Ensure numeric types
    data["total_carbon_kg"] = float(data.get("total_carbon_kg", 0))
    data["eco_score"] = int(data.get("eco_score", 50))
    data["eco_score"] = max(0, min(100, data["eco_score"]))  # Clamp to [0, 100]

    return data


async def _upload_images_to_s3(
    image_bytes: bytes,
    thumbnail_bytes: bytes,
    user_id: str,
) -> tuple[Optional[str], Optional[str]]:
    """Upload receipt image and thumbnail to S3. Returns (image_url, thumbnail_url)."""
    try:
        import boto3
        from botocore.exceptions import BotoCoreError, ClientError

        s3 = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

        timestamp = int(time.time())
        image_key = f"{settings.s3_receipt_prefix}{user_id}/{timestamp}.jpg"
        thumb_key = f"{settings.s3_thumbnail_prefix}{user_id}/{timestamp}_thumb.jpg"

        s3.put_object(
            Bucket=settings.aws_s3_bucket,
            Key=image_key,
            Body=image_bytes,
            ContentType="image/jpeg",
        )
        s3.put_object(
            Bucket=settings.aws_s3_bucket,
            Key=thumb_key,
            Body=thumbnail_bytes,
            ContentType="image/jpeg",
        )

        base = f"https://{settings.aws_s3_bucket}.s3.{settings.aws_region}.amazonaws.com/"
        return base + image_key, base + thumb_key

    except Exception as e:
        logger.warning(f"S3 upload failed: {e}")
        return None, None
