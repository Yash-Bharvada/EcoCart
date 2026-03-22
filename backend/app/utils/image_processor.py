"""
Image Processor
---------------
Validates, resizes, and optimizes receipt images before sending to Gemini AI.
Also generates compressed thumbnails for storage.
"""

import io
import logging
import struct
from typing import Optional, Tuple

from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
MAX_DIMENSION = 2048          # Max width/height after resize
MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024  # 4 MB limit sent to Gemini
THUMBNAIL_SIZE = (400, 400)
JPEG_QUALITY = 85             # Compression quality (85% is a good balance)
THUMBNAIL_QUALITY = 75

# File magic bytes for supported image formats
_MAGIC_BYTES = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG": "png",
    b"GIF8": "gif",
    b"RIFF": "webp",   # Partial check — also verify bytes 8-11 = "WEBP"
    b"BM": "bmp",
}

ALLOWED_FORMATS = {"jpeg", "png", "webp", "gif", "bmp"}


def detect_image_format(data: bytes) -> Optional[str]:
    """
    Detect image format from magic bytes (more reliable than MIME types).

    Args:
        data: Raw image bytes.

    Returns:
        Format string ("jpeg", "png", etc.) or None if unrecognized.
    """
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    for magic, fmt in _MAGIC_BYTES.items():
        if data[:len(magic)] == magic:
            return fmt
    return None


def validate_image(data: bytes) -> Tuple[bool, str]:
    """
    Validate image data for format and integrity.

    Args:
        data: Raw image bytes.

    Returns:
        (is_valid, error_message) tuple.
    """
    if not data:
        return False, "No image data provided"

    if len(data) > 20 * 1024 * 1024:  # 20 MB hard limit
        return False, "File size exceeds maximum limit of 20MB"

    fmt = detect_image_format(data)
    if fmt is None:
        return False, "Unsupported image format. Please upload JPEG, PNG, WebP, or GIF."

    try:
        img = Image.open(io.BytesIO(data))
        img.verify()  # Check for corrupt data
    except Exception as e:
        return False, f"Image appears to be corrupt or invalid: {str(e)}"

    return True, ""


def optimize_for_gemini(image_bytes: bytes) -> bytes:
    """
    Optimize an image for Gemini API submission:
    1. Convert RGBA → RGB
    2. Resize if larger than MAX_DIMENSION
    3. Enhance contrast and sharpness for better OCR
    4. Compress to JPEG at JPEG_QUALITY

    Args:
        image_bytes: Raw input image bytes.

    Returns:
        Optimized JPEG bytes ready for Gemini.
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Convert color modes
    if img.mode in ("RGBA", "LA", "P"):
        # Composite on white background to handle transparency
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Resize if too large (maintain aspect ratio)
    if img.width > MAX_DIMENSION or img.height > MAX_DIMENSION:
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
        logger.debug(f"Image resized to {img.width}x{img.height}")

    # Enhance image for better OCR accuracy
    # Improve contrast (easier for Gemini to read text)
    img = ImageEnhance.Contrast(img).enhance(1.2)
    # Improve sharpness slightly
    img = ImageEnhance.Sharpness(img).enhance(1.3)

    # Encode to JPEG bytes
    output = io.BytesIO()
    img.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    optimized = output.getvalue()

    # If still over MAX_FILE_SIZE_BYTES, compress further
    if len(optimized) > MAX_FILE_SIZE_BYTES:
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=70, optimize=True)
        optimized = output.getvalue()
        logger.debug("Applied additional compression to reduce file size")

    logger.debug(
        f"Image optimized: {len(image_bytes):,} → {len(optimized):,} bytes "
        f"({100 * len(optimized) / len(image_bytes):.1f}%)"
    )
    return optimized


def generate_thumbnail(image_bytes: bytes) -> bytes:
    """
    Generate a small thumbnail for storage and list views.

    Args:
        image_bytes: Raw or optimized image bytes.

    Returns:
        Thumbnail JPEG bytes.
    """
    img = Image.open(io.BytesIO(image_bytes))

    if img.mode != "RGB":
        img = img.convert("RGB")

    img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=THUMBNAIL_QUALITY, optimize=True)
    return output.getvalue()


def get_image_dimensions(image_bytes: bytes) -> Tuple[int, int]:
    """Return (width, height) of an image."""
    img = Image.open(io.BytesIO(image_bytes))
    return img.width, img.height
