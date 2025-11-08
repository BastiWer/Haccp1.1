from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class CleaningItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    interval: str  # daily, weekly, monthly
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CleaningItemCreate(BaseModel):
    name: str
    interval: str

class CleaningItemUpdate(BaseModel):
    name: Optional[str] = None
    interval: Optional[str] = None

class CleaningCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    item_name: str
    employee_initials: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed: bool = True

class CleaningCheckCreate(BaseModel):
    item_id: str
    item_name: str
    employee_initials: str

class DashboardStats(BaseModel):
    total_items: int
    checks_today: int
    checks_this_week: int
    checks_this_month: int
    recent_checks: List[CleaningCheck]


# Cleaning Items Routes
@api_router.post("/items", response_model=CleaningItem)
async def create_item(input: CleaningItemCreate):
    item_dict = input.model_dump()
    item_obj = CleaningItem(**item_dict)
    
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.cleaning_items.insert_one(doc)
    return item_obj

@api_router.get("/items", response_model=List[CleaningItem])
async def get_items():
    items = await db.cleaning_items.find({}, {"_id": 0}).to_list(1000)
    
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return items

@api_router.put("/items/{item_id}", response_model=CleaningItem)
async def update_item(item_id: str, input: CleaningItemUpdate):
    existing = await db.cleaning_items.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if update_data:
        await db.cleaning_items.update_one({"id": item_id}, {"$set": update_data})
    
    updated = await db.cleaning_items.find_one({"id": item_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return CleaningItem(**updated)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    result = await db.cleaning_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}


# Cleaning Checks Routes
@api_router.post("/checks", response_model=CleaningCheck)
async def create_check(input: CleaningCheckCreate):
    check_dict = input.model_dump()
    check_obj = CleaningCheck(**check_dict)
    
    doc = check_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.cleaning_checks.insert_one(doc)
    return check_obj

@api_router.get("/checks", response_model=List[CleaningCheck])
async def get_checks(limit: int = 100):
    checks = await db.cleaning_checks.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    for check in checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return checks


# Dashboard Stats
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    total_items = await db.cleaning_items.count_documents({})
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    from datetime import timedelta
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)
    
    checks_today = await db.cleaning_checks.count_documents({
        "timestamp": {"$gte": today_start.isoformat()}
    })
    
    checks_this_week = await db.cleaning_checks.count_documents({
        "timestamp": {"$gte": week_start.isoformat()}
    })
    
    checks_this_month = await db.cleaning_checks.count_documents({
        "timestamp": {"$gte": month_start.isoformat()}
    })
    
    recent_checks = await db.cleaning_checks.find({}, {"_id": 0}).sort("timestamp", -1).to_list(5)
    for check in recent_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return DashboardStats(
        total_items=total_items,
        checks_today=checks_today,
        checks_this_week=checks_this_week,
        checks_this_month=checks_this_month,
        recent_checks=[CleaningCheck(**check) for check in recent_checks]
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()