import asyncio
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.models.product import ProductDocument
from datetime import datetime

async def seed_products():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]
    
    products_data = [
        {
            "name": "Beyond Meat Plant-Based Burger",
            "description": "Delicious plant-based burger that looks, cooks, and satisfies like beef.",
            "category": "Food & Beverages",
            "carbon_rating": 1.5,
            "eco_certifications": ["Vegan", "Carbon Neutral"],
            "price": 12.99,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
            "is_featured": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Organic Cotton T-Shirt",
            "description": "100% organic cotton t-shirt with a soft, durable finish.",
            "category": "Fashion & Apparel",
            "carbon_rating": 2.3,
            "eco_certifications": ["Organic", "Fair Trade"],
            "price": 45.00,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
            "is_featured": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Bamboo Utensil Set",
            "description": "Reusable bamboo utensil set with a convenient travel pouch.",
            "category": "Home & Living",
            "carbon_rating": 0.4,
            "eco_certifications": ["Plastic-Free"],
            "price": 15.99,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80",
            "is_featured": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Reusable Water Bottle",
            "description": "Insulated stainless steel water bottle, keeps drinks cold for 24 hours.",
            "category": "Accessories",
            "carbon_rating": 0.8,
            "eco_certifications": ["Zero Waste", "Plastic-Free"],
            "price": 34.99,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
            "is_featured": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Organic Oat Milk",
            "description": "Creamy oat milk made from organically grown oats.",
            "category": "Food & Beverages",
            "carbon_rating": 0.9,
            "eco_certifications": ["Organic", "Vegan"],
            "price": 4.99,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=600&q=80",
            "is_featured": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Recycled Yoga Mat",
            "description": "Eco-friendly yoga mat made from 100% recycled materials.",
            "category": "Outdoor & Sports",
            "carbon_rating": 1.2,
            "eco_certifications": ["Recycled"],
            "price": 78.00,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=600&q=80",
            "is_featured": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Natural Shampoo Bar",
            "description": "Solid shampoo bar packed with natural ingredients, no plastic packaging.",
            "category": "Personal Care",
            "carbon_rating": 0.2,
            "eco_certifications": ["Plastic-Free", "Vegan"],
            "price": 16.00,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
            "is_featured": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Solar Phone Charger",
            "description": "Portable power bank with powerful solar panels for off-grid charging.",
            "category": "Electronics",
            "carbon_rating": 3.5,
            "eco_certifications": ["Energy Efficient"],
            "price": 49.99,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1620891594592-c7f3da47d2cb?w=600&q=80",
            "is_featured": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Beeswax Food Wraps",
            "description": "Sustainable alternative to plastic wrap, made from organic cotton and beeswax.",
            "category": "Home & Living",
            "carbon_rating": 0.3,
            "eco_certifications": ["Zero Waste", "Organic"],
            "price": 18.00,
            "currency": "USD",
            "image_url": "https://images.unsplash.com/photo-1602142946018-34606aa83259?w=600&q=80",
            "is_featured": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Convert through Pydantic model to ensure default fields exist
    processed_data = []
    for pd in products_data:
        pd["affiliate_link"] = f"https://www.amazon.com/s?k={urllib.parse.quote(pd['name'])}"
        doc = ProductDocument(**pd).model_dump(by_alias=True, exclude_none=True)
        processed_data.append(doc)
    
    # Check if products already exist to avoid duplicates if run multiple times
    count = await db.products.count_documents({})
    if count == 0:
        result = await db.products.insert_many(processed_data)
        print(f"Successfully seeded {len(result.inserted_ids)} products into the database.")
    else:
        # clear and reseed
        await db.products.delete_many({})
        result = await db.products.insert_many(processed_data)
        print(f"Cleared existing data and seeded {len(result.inserted_ids)} new products into the database.")

if __name__ == "__main__":
    asyncio.run(seed_products())
