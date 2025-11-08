from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import cm
import jwt
from passlib.context import CryptContext


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    restaurant_id = payload.get("restaurant_id")
    
    if not user_id or not restaurant_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {"user_id": user_id, "restaurant_id": restaurant_id, "email": user["email"]}


# Define Models
class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str = ""
    responsible_person: str = ""
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    restaurant_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    restaurant_name: str
    restaurant_address: str = ""
    responsible_person: str = ""

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    responsible_person: Optional[str] = None
    email: Optional[EmailStr] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CleaningItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
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
    restaurant_id: str
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


# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create restaurant
    restaurant = Restaurant(
        name=user_data.restaurant_name,
        address=user_data.restaurant_address,
        responsible_person=user_data.responsible_person,
        email=user_data.email
    )
    restaurant_doc = restaurant.model_dump()
    restaurant_doc['created_at'] = restaurant_doc['created_at'].isoformat()
    await db.restaurants.insert_one(restaurant_doc)
    
    # Create user
    user = User(email=user_data.email, restaurant_id=restaurant.id)
    user_doc = user.model_dump()
    user_doc['password_hash'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"user_id": user.id, "restaurant_id": restaurant.id})
    
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email},
        "restaurant": {"id": restaurant.id, "name": restaurant.name}
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Get restaurant
    restaurant = await db.restaurants.find_one({"id": user['restaurant_id']}, {"_id": 0})
    
    # Create token
    token = create_access_token({"user_id": user['id'], "restaurant_id": user['restaurant_id']})
    
    return {
        "token": token,
        "user": {"id": user['id'], "email": user['email']},
        "restaurant": {"id": restaurant['id'], "name": restaurant['name']}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    restaurant = await db.restaurants.find_one({"id": current_user['restaurant_id']}, {"_id": 0})
    return {
        "user": {"id": current_user['user_id'], "email": current_user['email']},
        "restaurant": {"id": restaurant['id'], "name": restaurant['name']}
    }


# Cleaning Items Routes
@api_router.post("/items", response_model=CleaningItem)
async def create_item(input: CleaningItemCreate, current_user: dict = Depends(get_current_user)):
    item_dict = input.model_dump()
    item_dict['restaurant_id'] = current_user['restaurant_id']
    item_obj = CleaningItem(**item_dict)
    
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.cleaning_items.insert_one(doc)
    return item_obj

@api_router.get("/items", response_model=List[CleaningItem])
async def get_items(current_user: dict = Depends(get_current_user)):
    items = await db.cleaning_items.find(
        {"restaurant_id": current_user['restaurant_id']}, 
        {"_id": 0}
    ).to_list(1000)
    
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return items

@api_router.put("/items/{item_id}", response_model=CleaningItem)
async def update_item(item_id: str, input: CleaningItemUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.cleaning_items.find_one(
        {"id": item_id, "restaurant_id": current_user['restaurant_id']}, 
        {"_id": 0}
    )
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
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cleaning_items.delete_one(
        {"id": item_id, "restaurant_id": current_user['restaurant_id']}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}


# Cleaning Checks Routes
@api_router.post("/checks", response_model=CleaningCheck)
async def create_check(input: CleaningCheckCreate, current_user: dict = Depends(get_current_user)):
    check_dict = input.model_dump()
    check_dict['restaurant_id'] = current_user['restaurant_id']
    check_obj = CleaningCheck(**check_dict)
    
    doc = check_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.cleaning_checks.insert_one(doc)
    return check_obj

@api_router.get("/checks", response_model=List[CleaningCheck])
async def get_checks(limit: int = 100, current_user: dict = Depends(get_current_user)):
    checks = await db.cleaning_checks.find(
        {"restaurant_id": current_user['restaurant_id']}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    
    for check in checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return checks


# Dashboard Stats
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_items = await db.cleaning_items.count_documents({"restaurant_id": current_user['restaurant_id']})
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    from datetime import timedelta
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)
    
    checks_today = await db.cleaning_checks.count_documents({
        "restaurant_id": current_user['restaurant_id'],
        "timestamp": {"$gte": today_start.isoformat()}
    })
    
    checks_this_week = await db.cleaning_checks.count_documents({
        "restaurant_id": current_user['restaurant_id'],
        "timestamp": {"$gte": week_start.isoformat()}
    })
    
    checks_this_month = await db.cleaning_checks.count_documents({
        "restaurant_id": current_user['restaurant_id'],
        "timestamp": {"$gte": month_start.isoformat()}
    })
    
    recent_checks = await db.cleaning_checks.find(
        {"restaurant_id": current_user['restaurant_id']}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(5)
    
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


# PDF Export
@api_router.get("/export/pdf")
async def export_pdf(current_user: dict = Depends(get_current_user)):
    # Fetch all checks for this restaurant
    checks = await db.cleaning_checks.find(
        {"restaurant_id": current_user['restaurant_id']}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
    # Get restaurant info
    restaurant = await db.restaurants.find_one({"id": current_user['restaurant_id']}, {"_id": 0})
    
    # Create PDF in memory
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph(f"<b>HACCP Reinigungskontrolle - {restaurant['name']}</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 0.5*cm))
    
    # Export info
    export_date = Paragraph(f"Export-Datum: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M')} Uhr", styles['Normal'])
    elements.append(export_date)
    elements.append(Spacer(1, 1*cm))
    
    # Table data
    if checks:
        data = [['Datum & Uhrzeit', 'Gerät/Bereich', 'Mitarbeiter']]
        
        for check in checks:
            timestamp = check['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp)
            date_str = timestamp.strftime('%d.%m.%Y %H:%M')
            data.append([
                date_str,
                check['item_name'],
                check['employee_initials']
            ])
        
        # Create table
        table = Table(data, colWidths=[5*cm, 8*cm, 3*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e7d32')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ]))
        
        elements.append(table)
    else:
        no_data = Paragraph("Keine Kontrollen vorhanden", styles['Normal'])
        elements.append(no_data)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=haccp_{restaurant['name']}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"}
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