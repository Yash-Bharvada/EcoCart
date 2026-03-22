"""
Carbon Calculator Service
--------------------------
Rule-based carbon estimation as a fallback/supplement to Gemini AI.
Provides eco score calculation and user comparison metrics.
"""

from typing import Dict, List, Optional


# ── Carbon Lookup Tables ───────────────────────────────────────────────────────
# All values are kg CO2e per kg of product (unless otherwise noted)

FOOD_CARBON = {
    # Meat & Animal Products
    "beef": 27.0,
    "lamb": 39.0,
    "pork": 12.0,
    "chicken": 6.9,
    "turkey": 10.9,
    "fish_farmed": 5.0,
    "fish_wild": 3.0,
    "shrimp": 12.0,
    "cheese": 13.5,
    "milk": 1.9,
    "butter": 9.0,
    "yogurt": 2.2,
    "eggs": 4.8,
    # Grains
    "rice": 2.7,
    "wheat": 0.5,
    "oats": 0.5,
    "corn": 0.3,
    "bread": 0.7,
    "pasta": 0.9,
    # Legumes & Alternatives
    "tofu": 2.0,
    "lentils": 0.9,
    "beans": 1.0,
    "chickpeas": 0.8,
    "nuts": 0.3,
    # Vegetables (local/seasonal)
    "vegetables_local": 0.3,
    "vegetables_imported": 1.0,
    "tomatoes_greenhouse": 1.1,
    "tomatoes_field": 0.4,
    "potatoes": 0.2,
    # Fruits
    "fruits_local": 0.4,
    "fruits_imported": 1.0,
    "avocado": 2.5,
    "berries": 1.2,
    # Beverages
    "coffee": 6.0,
    "tea": 2.0,
    "orange_juice": 1.6,
    "wine": 1.8,
    "beer": 0.8,
    "water_bottled": 0.3,  # per bottle (500ml)
}

NON_FOOD_CARBON = {
    # Clothing
    "clothing_fast_fashion": 14.0,   # per item
    "clothing_sustainable": 5.0,     # per item
    "shoes": 8.5,                    # per pair (average)
    # Electronics
    "smartphone": 85.0,              # full lifecycle
    "laptop": 300.0,
    "tablet": 100.0,
    "headphones": 14.0,
    # Personal Care
    "cosmetics": 2.0,                # per product
    "shampoo": 0.8,
    "soap": 0.4,
    # Cleaning
    "cleaning_product": 1.0,
    "detergent": 1.3,
    # Paper Products
    "book": 1.3,
    "notebook": 0.5,
    # Toys
    "toy_plastic": 3.5,
    "toy_wooden": 0.5,
    # Packaging adjustment (per kg of plastic/cardboard)
    "plastic_packaging_per_kg": 6.0,
    "cardboard_per_kg": 1.0,
}

# Average consumer monthly carbon footprint (kg CO2e)
AVERAGE_MONTHLY_CARBON_KG = 45.0

# Eco score scoring weights
ECO_SCORE_WEIGHTS = {
    "food_choices": 0.40,
    "product_origin": 0.20,
    "packaging": 0.15,
    "product_type": 0.15,
    "overall_carbon": 0.10,
}


def estimate_carbon_for_category(category: str, quantity_kg: float = 1.0) -> float:
    """
    Estimate carbon footprint for a product category.

    Args:
        category: Standardized category name (matched to FOOD_CARBON or NON_FOOD_CARBON).
        quantity_kg: Quantity in kg (or units for non-food).

    Returns:
        Estimated CO2e in kg.
    """
    category_normalized = category.lower().replace(" ", "_").replace("-", "_")

    # Check food lookup
    for key, value in FOOD_CARBON.items():
        if key in category_normalized or category_normalized in key:
            return value * quantity_kg

    # Check non-food lookup
    for key, value in NON_FOOD_CARBON.items():
        if key in category_normalized or category_normalized in key:
            return value * quantity_kg

    # Default estimate for unknown categories
    return 1.5 * quantity_kg


def calculate_eco_score(products: List[Dict]) -> int:
    """
    Calculate an eco score (0-100) from a list of product items.

    Args:
        products: List of product dicts with `category` and `estimated_carbon_kg` fields.

    Returns:
        Eco score 0-100.
    """
    if not products:
        return 50  # neutral default

    total_carbon = sum(p.get("estimated_carbon_kg", 0) for p in products)
    total_items = len(products)

    # Component scores
    high_carbon_count = sum(
        1 for p in products if p.get("carbon_intensity") == "high" or p.get("estimated_carbon_kg", 0) > 5
    )
    meat_count = sum(
        1 for p in products
        if any(m in p.get("category", "").lower() for m in ["beef", "lamb", "pork", "meat", "red meat"])
    )

    # Food choices score (0-100)
    food_score = max(0, 100 - (meat_count / total_items * 80) - (high_carbon_count / total_items * 40))

    # Overall carbon score (0-100)
    if total_carbon < 2:
        carbon_score = 95
    elif total_carbon < 5:
        carbon_score = 85
    elif total_carbon < 15:
        carbon_score = 70
    elif total_carbon < 30:
        carbon_score = 55
    elif total_carbon < 60:
        carbon_score = 40
    else:
        carbon_score = 20

    # Weighted final score (simplified — Gemini provides detailed breakdown)
    final = (
        food_score * ECO_SCORE_WEIGHTS["food_choices"] +
        carbon_score * ECO_SCORE_WEIGHTS["overall_carbon"] +
        60 * (ECO_SCORE_WEIGHTS["product_origin"] + ECO_SCORE_WEIGHTS["packaging"] + ECO_SCORE_WEIGHTS["product_type"])
    )

    return max(0, min(100, int(final)))


def compare_to_average(total_carbon_kg: float) -> str:
    """
    Compare user's carbon footprint to the average consumer.

    Args:
        total_carbon_kg: Total carbon for the shopping trip in kg CO2e.

    Returns:
        Human-readable comparison string.
    """
    # The average single shopping trip is roughly 15-20% of monthly carbon
    avg_trip_carbon = AVERAGE_MONTHLY_CARBON_KG * 0.17  # ~7.65 kg

    if total_carbon_kg <= 0:
        return "No carbon footprint detected in this receipt."

    diff_pct = ((total_carbon_kg - avg_trip_carbon) / avg_trip_carbon) * 100

    if abs(diff_pct) < 5:
        return "Your shopping footprint is about average for a single trip."
    elif diff_pct < 0:
        return f"Your shopping footprint is {abs(diff_pct):.0f}% lower than the average shopper — great work! 🌱"
    else:
        return (
            f"Your shopping footprint is {diff_pct:.0f}% higher than the average shopper. "
            "Small swaps can make a big difference!"
        )


def get_carbon_offset_pricing(carbon_kg: float, project_type: str = "reforestation") -> Dict:
    """
    Calculate the cost to offset a given amount of carbon.

    Args:
        carbon_kg: Kilograms of CO2e to offset.
        project_type: Type of offset project.

    Returns:
        Dict with pricing details.
    """
    # Price per metric ton (1000 kg) by project type
    price_per_ton = {
        "reforestation": 12.0,
        "renewable_energy": 10.0,
        "ocean_cleanup": 20.0,
        "methane_capture": 15.0,
        "direct_air_capture": 30.0,
    }.get(project_type, 15.0)

    carbon_tons = carbon_kg / 1000
    total_cost = carbon_tons * price_per_ton

    return {
        "carbon_kg": carbon_kg,
        "carbon_tons": carbon_tons,
        "price_per_ton": price_per_ton,
        "total_cost": max(total_cost, 0.50),  # Minimum $0.50 charge
        "currency": "USD",
        "project_type": project_type,
    }
