"""
Product Service
---------------
Product search, recommendation engine, and affiliate link management.
"""

import logging
from typing import Dict, List, Optional

from bson import ObjectId

from app.database.mongodb import (
    products_collection, analyses_collection, redirect_links_collection
)
from app.utils.affiliate_links import create_redirect_document, build_redirect_url, generate_redirect_code
from app.utils.helpers import serialize_doc, build_pagination_meta, paginate, utcnow
from app.config import settings

logger = logging.getLogger(__name__)


async def search_products(
    query: Optional[str] = None,
    category: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    carbon_rating_max: Optional[float] = None,
    certifications: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    is_featured: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "carbon_rating",
    sort_order: str = "asc",
) -> Dict:
    """
    Search and filter products with pagination.

    Returns:
        Dict with `products`, `pagination`, `available_categories`, `available_certifications`.
    """
    filter_query: Dict = {"is_active": True}

    if category:
        filter_query["category"] = {"$regex": category, "$options": "i"}
    if price_min is not None:
        filter_query.setdefault("price", {})["$gte"] = price_min
    if price_max is not None:
        filter_query.setdefault("price", {})["$lte"] = price_max
    if carbon_rating_max is not None:
        filter_query["carbon_rating"] = {"$lte": carbon_rating_max}
    if certifications:
        filter_query["eco_certifications"] = {"$in": certifications}
    if tags:
        filter_query["tags"] = {"$in": tags}
    if is_featured is not None:
        filter_query["is_featured"] = is_featured

    # Text search
    if query:
        filter_query["$or"] = [
            {"name": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"tags": {"$regex": query, "$options": "i"}},
        ]

    sort_direction = 1 if sort_order == "asc" else -1
    skip, lim = paginate(page, limit)

    total = await products_collection().count_documents(filter_query)
    cursor = products_collection().find(filter_query).sort(sort_by, sort_direction).skip(skip).limit(lim)
    docs = await cursor.to_list(lim)

    # Add redirect URLs
    products = []
    for doc in docs:
        p = serialize_doc(doc)
        if p:
            redirect_code = generate_redirect_code(p["id"])
            p["redirect_link"] = f"{settings.frontend_url.rstrip('/')}/r/{redirect_code}"
            products.append(p)

    # Available facets for filtering
    categories = await products_collection().distinct("category", {"is_active": True})
    all_certs = await products_collection().distinct("eco_certifications", {"is_active": True})

    return {
        "products": products,
        "pagination": build_pagination_meta(page, limit, total),
        "available_categories": sorted(categories),
        "available_certifications": sorted(all_certs),
    }


async def get_product_by_id(product_id: str) -> Optional[Dict]:
    """Fetch a single product by ID, including redirect link."""
    try:
        doc = await products_collection().find_one(
            {"_id": ObjectId(product_id), "is_active": True}
        )
        if not doc:
            return None
        p = serialize_doc(doc)
        # Track view
        await products_collection().update_one(
            {"_id": ObjectId(product_id)},
            {"$inc": {"view_count": 1}},
        )
        redirect_code = generate_redirect_code(product_id)
        p["redirect_link"] = f"/r/{redirect_code}"
        return p
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        return None


async def get_alternatives_for_analysis(analysis_id: str, user_id: str) -> List[Dict]:
    """
    Find sustainable product alternatives for each item in a given analysis.
    Groups results by the original high-carbon product.
    """
    try:
        analysis = await analyses_collection().find_one(
            {"_id": ObjectId(analysis_id), "user_id": user_id}
        )
        if not analysis:
            return []

        groups = []
        products_list = analysis.get("products", [])

        # Focus on medium/high-carbon items
        high_carbon_products = [
            p for p in products_list
            if p.get("carbon_intensity") in ("high", "medium") or p.get("estimated_carbon_kg", 0) > 1.0
        ]

        for product in high_carbon_products[:5]:  # Limit to 5 groups
            category = product.get("category", "")
            original_carbon = product.get("estimated_carbon_kg", 0)

            # Find alternatives with lower carbon rating in same category
            alt_docs = await products_collection().find(
                {
                    "is_active": True,
                    "$or": [
                        {"category": {"$regex": category, "$options": "i"}},
                        {"tags": {"$regex": category.split()[0] if category else "", "$options": "i"}},
                    ],
                    "carbon_rating": {"$lt": original_carbon},
                }
            ).sort("carbon_rating", 1).limit(3).to_list(3)

            if alt_docs:
                alts = []
                for doc in alt_docs:
                    p = serialize_doc(doc)
                    if p:
                        redirect_code = generate_redirect_code(p["id"], user_id)
                        p["redirect_link"] = f"/r/{redirect_code}"
                        alts.append(p)

                max_savings = max(
                    original_carbon - a.get("carbon_rating", 0) for a in alts
                ) if alts else 0

                groups.append({
                    "original_product_name": product.get("name", "Unknown"),
                    "original_carbon_kg": original_carbon,
                    "alternatives": alts,
                    "max_savings_kg": round(max_savings, 3),
                })

        return groups
    except Exception as e:
        logger.error(f"Error getting alternatives for analysis {analysis_id}: {e}")
        return []


async def get_personalized_recommendations(user_id: str, limit: int = 20) -> List[Dict]:
    """
    Return personalized product recommendations based on user's analysis history.
    Finds categories the user shops in and returns the most eco-friendly options.
    """
    # Get user's most common product categories from analysis history
    pipeline = [
        {"$match": {"user_id": user_id, "is_deleted": {"$ne": True}}},
        {"$unwind": "$products"},
        {"$group": {
            "_id": "$products.category",
            "total_carbon": {"$sum": "$products.estimated_carbon_kg"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"total_carbon": -1}},
        {"$limit": 5},
    ]
    cat_docs = await analyses_collection().aggregate(pipeline).to_list(5)
    categories = [d["_id"] for d in cat_docs if d.get("_id")]

    if not categories:
        # Cold start — return featured products
        return await _get_featured_products(limit)

    # Find top eco products in those categories
    docs = await products_collection().find(
        {
            "is_active": True,
            "category": {"$in": categories},
        }
    ).sort("carbon_rating", 1).limit(limit).to_list(limit)

    products = []
    for doc in docs:
        p = serialize_doc(doc)
        if p:
            p["redirect_link"] = f"/r/{generate_redirect_code(p['id'], user_id)}"
            products.append(p)
    return products


async def _get_featured_products(limit: int = 20) -> List[Dict]:
    """Fallback — return featured products sorted by carbon rating."""
    docs = await products_collection().find(
        {"is_active": True, "is_featured": True}
    ).sort("carbon_rating", 1).limit(limit).to_list(limit)
    return [serialize_doc(d) for d in docs if d]


async def track_product_click(product_id: str, user_id: Optional[str] = None) -> Optional[str]:
    """
    Record a product click and return the tracked affiliate redirect URL.

    Returns:
        The destination URL to redirect to, or None if product not found.
    """
    try:
        doc = await products_collection().find_one(
            {"_id": ObjectId(product_id), "is_active": True}
        )
        if not doc:
            return None

        # Increment click count
        await products_collection().update_one(
            {"_id": ObjectId(product_id)},
            {"$inc": {"click_count": 1}},
        )

        # Upsert redirect link document
        affiliate_link = doc.get("affiliate_link", "")
        affiliate_network = doc.get("affiliate_network")
        redirect_doc = create_redirect_document(
            product_id=product_id,
            original_url=affiliate_link,
            user_id=user_id,
            affiliate_network=affiliate_network,
        )
        await redirect_links_collection().update_one(
            {"code": redirect_doc["code"]},
            {"$set": redirect_doc},
            upsert=True,
        )

        return affiliate_link  # Return original affiliate URL
    except Exception as e:
        logger.error(f"Error tracking click for product {product_id}: {e}")
        return None


async def resolve_redirect_code(code: str) -> Optional[str]:
    """
    Resolve a short redirect code to the affiliate URL and increment click count.

    Args:
        code: Short redirect code from /r/{code}

    Returns:
        Destination URL or None if not found.
    """
    doc = await redirect_links_collection().find_one({"code": code})
    if not doc:
        return None

    # Increment click counter
    await redirect_links_collection().update_one(
        {"code": code},
        {"$inc": {"click_count": 1}},
    )
    return doc.get("tracked_url") or doc.get("original_url")
