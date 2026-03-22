"""
Carbon Offsets Routes
---------------------
GET  /carbon-offsets           — List user's carbon offset purchases
GET  /carbon-offsets/projects  — Browse available offset projects
GET  /carbon-offsets/{id}      — Single offset record
"""

import logging

from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.middleware.auth_middleware import get_current_active_user
from app.database.mongodb import carbon_offsets_collection
from app.services.payment_service import OFFSET_PROJECTS
from app.utils.helpers import serialize_doc, build_pagination_meta, paginate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=dict, summary="List carbon offset purchases")
async def list_offsets(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    user: dict = Depends(get_current_active_user),
):
    """Return paginated list of the user's carbon offset purchases."""
    query = {"user_id": user["id"]}
    skip, lim = paginate(page, limit)
    total = await carbon_offsets_collection().count_documents(query)
    cursor = carbon_offsets_collection().find(query).sort("created_at", -1).skip(skip).limit(lim)
    docs = await cursor.to_list(lim)

    total_offset_kg = 0.0
    total_spent = 0.0
    offsets = []
    for doc in docs:
        s = serialize_doc(doc)
        if s:
            total_offset_kg += s.get("carbon_offset_kg", 0)
            total_spent += s.get("total_cost", 0)
            offsets.append({
                "id": s["id"],
                "carbon_offset_kg": s.get("carbon_offset_kg", 0),
                "cost_per_kg": s.get("cost_per_kg", 0),
                "total_cost": s.get("total_cost", 0),
                "currency": s.get("currency", "USD"),
                "project_name": s.get("offset_project", {}).get("name", ""),
                "project_type": s.get("offset_project", {}).get("project_type", ""),
                "verification_status": s.get("verification_status", "pending"),
                "certificate_url": s.get("certificate_url"),
                "created_at": s.get("created_at"),
            })

    return {
        "offsets": offsets,
        "pagination": build_pagination_meta(page, limit, total),
        "total_offset_kg": round(total_offset_kg, 3),
        "total_spent": round(total_spent, 2),
    }


@router.get("/projects", response_model=dict, summary="Browse available offset projects")
async def list_offset_projects():
    """
    Returns the catalog of verified carbon offset projects available for purchase.
    Each project includes type, location, certification, and pricing.
    """
    from app.services.carbon_calculator import get_carbon_offset_pricing

    project_list = []
    for project_type, project_info in OFFSET_PROJECTS.items():
        pricing = get_carbon_offset_pricing(1000, project_type)  # Price per ton (1000 kg)
        project_list.append({
            "project_id": project_type,
            "name": project_info["name"],
            "description": project_info["description"],
            "project_type": project_type,
            "location": project_info["location"],
            "certification": project_info["certification"],
            "project_url": project_info.get("project_url"),
            "price_per_kg": pricing["total_cost"] / 1000,  # Convert ton → kg
            "price_per_ton": pricing["price_per_ton"],
            "is_featured": project_type == "reforestation",
        })

    return {"projects": project_list, "total": len(project_list)}


@router.get("/{offset_id}", response_model=dict, summary="Get carbon offset details")
async def get_offset(
    offset_id: str,
    user: dict = Depends(get_current_active_user),
):
    """Return full details for a single carbon offset purchase."""
    from bson import ObjectId
    try:
        doc = await carbon_offsets_collection().find_one(
            {"_id": ObjectId(offset_id), "user_id": user["id"]}
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid offset ID.")

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carbon offset not found.")

    return serialize_doc(doc)
