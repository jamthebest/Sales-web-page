from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random
import httpx
from google.cloud import storage
from google.oauth2 import service_account
from email_service import send_email

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Ensure uploads directory exists
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"  # "user" or "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ImageTransform(BaseModel):
    scale: float = 1.0  # Zoom level
    x: float = 50  # Position X (percentage)
    y: float = 50  # Position Y (percentage)

class ProductImage(BaseModel):
    url: str
    description: Optional[str] = None
    type: str = "image"  # "image" or "video"
    transform: Optional[ImageTransform] = ImageTransform()

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str] = None  # Mantener compatibilidad
    image_transform: Optional[ImageTransform] = ImageTransform()  # Transformación de imagen principal
    images: Optional[List[ProductImage]] = []  # Nueva galería de imágenes
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock: int
    image_url: Optional[str] = None
    image_transform: Optional[ImageTransform] = ImageTransform()
    images: Optional[List[ProductImage]] = []
    category: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    image_transform: Optional[ImageTransform] = None
    images: Optional[List[ProductImage]] = None
    category: Optional[str] = None

class PurchaseRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    user_name: str
    user_phone: str
    product_id: str
    product_name: str
    quantity: int
    total_price: float
    status: str = "pending"  # pending, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OutOfStockRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    phone: str
    quantity: int
    code: Optional[str] = None
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    description: str
    quantity: int
    code: Optional[str] = None
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VerifiedPhone(BaseModel):
    phone: str
    verified_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_used: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminConfig(BaseModel):
    email: str
    phone: str

class SessionData(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    session_token: str

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    session = await db.get_collection("user_sessions").find_one({"session_token": session_token})
    if not session:
        return None
    
    if datetime.fromisoformat(session["expires_at"]) < datetime.now(timezone.utc):
        await db.get_collection("user_sessions").delete_one({"session_token": session_token})
        return None
    
    user_doc = await db.get_collection("users").find_one({"id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

async def require_user(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return user

async def require_admin(request: Request) -> User:
    """Require admin user"""
    user = await require_user(request)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return user

# ==================== Custom Routes ====================
@api_router.post("/users/admin/{user_id}", response_model=User)
async def set_admin_user(user_id: str, request: Request) -> Optional[User]:
    """Set admin user from id"""
    await require_admin(request)
    
    existing = await db.get_collection("users").find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    await db.get_collection("users").update_one({"id": user_id}, {"$set": { "role": "admin" }})
    
    updated_user = await db.get_collection("users").find_one({"id": user_id}, {"_id": 0})
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Create session from session_id"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID requerido")
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Session ID inválido")
            
            data = resp.json()
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Error al validar sesión: {str(e)}")
    
    # Check if user exists
    existing_user = await db.get_collection("users").find_one({"email": data["email"]}, {"_id": 0})
    
    if not existing_user:
        # Create new user
        user = User(
            id=data["id"],
            email=data["email"],
            name=data["name"],
            picture=data.get("picture"),
            role="user"
        )
        user_doc = user.model_dump()
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        await db.get_collection("users").insert_one(user_doc)
    else:
        if isinstance(existing_user.get('created_at'), str):
            existing_user['created_at'] = datetime.fromisoformat(existing_user['created_at'])
        user = User(**existing_user)
    
    # Create session
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_doc = session.model_dump()
    session_doc['expires_at'] = session_doc['expires_at'].isoformat()
    session_doc['created_at'] = session_doc['created_at'].isoformat()
    
    await db.get_collection("user_sessions").insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60*60*24*7,
        path="/"
    )
    
    return {
        "user": user.model_dump(),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.get_collection("user_sessions").delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Sesión cerrada"}

@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Upload file (admin only)"""
    await require_admin(request)
    
    try:
        data = await request.form()
        product_name = data.get("product_name")
        if not product_name:
            raise HTTPException(status_code=400, detail="Nombre del producto es requerido")
        destination = f"{product_name}/{file.filename}"

        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        
        # GCS Configuration
        bucket_name = os.environ.get('GCS_BUCKET_NAME')
        project_id = os.environ.get('GOOGLE_PROJECT_ID')
        private_key_id = os.environ.get('GOOGLE_PRIVATE_KEY_ID')
        private_key = os.environ.get('GOOGLE_PRIVATE_KEY')
        client_email = os.environ.get('GOOGLE_CLIENT_EMAIL')
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        client_x509_cert_url = os.environ.get('GOOGLE_CLIENT_X509_CERT_URL')

        if not bucket_name or not project_id or not private_key or not client_email:
             raise HTTPException(status_code=500, detail="Configuración de Google Cloud incompleta en variables de entorno")

        # Construct credentials
        service_account_info = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": private_key_id,
            "private_key": private_key.replace('\\n', '\n'),
            "client_email": client_email,
            "client_id": client_id,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": client_x509_cert_url
        }

        # Initialize GCS client
        credentials = service_account.Credentials.from_service_account_info(service_account_info)
        storage_client = storage.Client(credentials=credentials, project=project_id)
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination)
        
        # Read and upload content
        content = await file.read()
        blob.upload_from_string(content, content_type=file.content_type)
        
        try:
            blob.make_public()
        except Exception:
            pass
            
        return {"url": blob.public_url, "type": file.content_type}
        
    except Exception as e:
        logger.error(f"Error uploading file to GCS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al subir archivo: {str(e)}")

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products():
    """Get all products"""
    products = await db.get_collection("products").find({}, {"_id": 0}).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get product by ID"""
    product = await db.get_collection("products").find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, request: Request):
    """Create product (admin only)"""
    await require_admin(request)
    
    product = Product(**product_data.model_dump())
    product_doc = product.model_dump()
    product_doc['created_at'] = product_doc['created_at'].isoformat()
    
    await db.get_collection("products").insert_one(product_doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, request: Request):
    """Update product (admin only)"""
    await require_admin(request)
    
    existing = await db.get_collection("products").find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if update_data:
        await db.get_collection("products").update_one({"id": product_id}, {"$set": update_data})
    
    updated_product = await db.get_collection("products").find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product.get('created_at'), str):
        updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])
    
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    """Delete product (admin only)"""
    await require_admin(request)
    
    result = await db.get_collection("products").delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"message": "Producto eliminado"}

# ==================== REQUEST ROUTES ====================

@api_router.post("/requests/purchase")
async def create_purchase_request(data: dict, background_tasks: BackgroundTasks):
    """Create purchase request"""
    # Get product
    product = await db.get_collection("products").find_one({"id": data["product_id"]}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if product["stock"] < data["quantity"]:
        raise HTTPException(status_code=400, detail="Stock insuficiente")
    
    # Create request
    purchase = PurchaseRequest(
        user_email=data["user_email"],
        user_name=data["user_name"],
        user_phone=data["user_phone"],
        product_id=data["product_id"],
        product_name=product["name"],
        quantity=data["quantity"],
        total_price=product["price"] * data["quantity"]
    )
    
    purchase_doc = purchase.model_dump()
    purchase_doc['created_at'] = purchase_doc['created_at'].isoformat()
    
    await db.get_collection("purchase_requests").insert_one(purchase_doc)
    
    # Update stock
    await db.get_collection("products").update_one(
        {"id": data["product_id"]},
        {"$inc": {"stock": -data["quantity"]}}
    )
    
    # Send email
    user = (data["user_name"] or "Anónimo") + " " + (data["user_email"] or "Anónimo")
    background_tasks.add_task(
        send_email,
        destinatary=os.environ['EMAIL_DESTINATARY'],
        subject=f"Solicitud de compra #{purchase.id}",
        message=f"""
        <h1>Nueva solicitud de compra</h1>
        <p>Cliente: {user}</p>
        <p>Producto: {purchase.product_name}</p>
        <p>Cantidad: {purchase.quantity}</p>
        <p>Total: Lps {purchase.total_price:.2f}</p>
        <p>Teléfono: {purchase.user_phone}</p>
        """
    )
    
    # Mock notification
    logger.info(f"📧 MOCK EMAIL: Solicitud de compra #{purchase.id}")
    logger.info(f"   Cliente: {user}")
    logger.info(f"   Producto: {purchase.product_name}")
    logger.info(f"   Cantidad: {purchase.quantity}")
    logger.info(f"   Total: Lps {purchase.total_price:.2f}")
    logger.info(f"   Teléfono: {purchase.user_phone}")
    
    return purchase

@api_router.post("/requests/verify-phone")
async def verify_phone(data: dict):
    """Send verification code (Mock)"""
    phone = data["phone"]
    
    # Check if phone is already verified
    verified = await db.get_collection("verified_phones").find_one({"phone": phone})
    if verified:
        return {"already_verified": True, "message": "Teléfono ya verificado"}
    
    # Generate code
    code = str(random.randint(100000, 999999))
    
    # Store pending verification
    await db.get_collection("pending_verifications").update_one(
        {"phone": phone},
        {"$set": {"code": code, "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    # Mock WhatsApp notification
    logger.info(f"📱 MOCK WHATSAPP: Código de verificación para {phone}")
    logger.info(f"   Código: {code}")
    logger.info(f"   ⚠️ Este código solo aparece en los logs del servidor")
    
    return {"message": "Código enviado", "mock_code": code}

@api_router.post("/requests/validate-code")
async def validate_code(data: dict):
    """Validate verification code"""
    phone = data["phone"]
    code = data["code"]
    
    pending = await db.get_collection("pending_verifications").find_one({"phone": phone})
    if not pending or pending["code"] != code:
        raise HTTPException(status_code=400, detail="Código inválido")
    
    # Mark as verified
    verified_phone = VerifiedPhone(phone=phone)
    verified_doc = verified_phone.model_dump()
    verified_doc['verified_at'] = verified_doc['verified_at'].isoformat()
    verified_doc['last_used'] = verified_doc['last_used'].isoformat()
    
    await db.get_collection("verified_phones").update_one(
        {"phone": phone},
        {"$set": verified_doc},
        upsert=True
    )
    
    # Delete pending
    await db.get_collection("pending_verifications").delete_one({"phone": phone})
    
    return {"verified": True}

@api_router.post("/requests/out-of-stock")
async def create_out_of_stock_request(data: dict, background_tasks: BackgroundTasks):
    """Request out of stock product"""
    phone = data["phone"]
    
    # Get product
    product = await db.get_collection("products").find_one({"id": data["product_id"]}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Create request
    request_obj = OutOfStockRequest(
        product_id=data["product_id"],
        product_name=product["name"],
        phone=phone,
        quantity=data["quantity"],
        verified=False
    )
    
    request_doc = request_obj.model_dump()
    request_doc['created_at'] = request_doc['created_at'].isoformat()
    
    await db.get_collection("out_of_stock_requests").insert_one(request_doc)

    # Send email
    user = (data["user_name"] or "Anónimo") + " " + (data["user_email"] or "Anónimo")
    background_tasks.add_task(
        send_email,
        destinatary=os.environ['EMAIL_DESTINATARY'],
        subject=f"Solicitud de artículo sin stock #{request_obj.id}",
        message=f"""
        <h1>Nueva solicitud de artículo sin stock</h1>
        <p>Cliente: {user}</p>
        <p>Producto: {request_obj.product_name}</p>
        <p>Cantidad: {request_obj.quantity}</p>
        <p>Teléfono: {request_obj.phone}</p>
        """
    )
    
    # Mock notification
    logger.info(f"📧 MOCK EMAIL: Solicitud de artículo sin stock #{request_obj.id}")
    logger.info(f"   Producto: {request_obj.product_name}")
    logger.info(f"   Cantidad: {request_obj.quantity}")
    logger.info(f"   Teléfono: {request_obj.phone}")
    
    return request_obj

@api_router.post("/requests/custom")
async def create_custom_request(data: dict, background_tasks: BackgroundTasks):
    """Request custom/non-existent product"""
    phone = data["phone"]
    
    # Create request
    request_obj = CustomRequest(
        phone=phone,
        description=data["description"],
        quantity=data["quantity"],
        verified=False
    )
    
    request_doc = request_obj.model_dump()
    request_doc['created_at'] = request_doc['created_at'].isoformat()
    
    await db.get_collection("custom_requests").insert_one(request_doc)

    # Send email
    user = (data["user_name"] or "Anónimo") + " " + (data["user_email"] or "Anónimo")
    background_tasks.add_task(
        send_email,
        destinatary=os.environ['EMAIL_DESTINATARY'],
        subject=f"Solicitud de artículo personalizado #{request_obj.id}",
        message=f"""
        <h1>Nueva solicitud de artículo personalizado</h1>
        <p>Cliente: {user}</p>
        <p>Descripción: {request_obj.description}</p>
        <p>Cantidad: {request_obj.quantity}</p>
        <p>Teléfono: {request_obj.phone}</p>
        """
    )
    
    # Mock notification
    logger.info(f"📧 MOCK EMAIL: Solicitud de artículo personalizado #{request_obj.id}")
    logger.info(f"   Descripción: {request_obj.description}")
    logger.info(f"   Cantidad: {request_obj.quantity}")
    logger.info(f"   Teléfono: {request_obj.phone}")
    
    return request_obj

@api_router.get("/requests")
async def get_all_requests(request: Request):
    """Get all requests (admin only)"""
    await require_admin(request)
    
    purchase_requests = await db.get_collection("purchase_requests").find({}, {"_id": 0}).to_list(1000)
    out_of_stock_requests = await db.get_collection("out_of_stock_requests").find({}, {"_id": 0}).to_list(1000)
    custom_requests = await db.get_collection("custom_requests").find({}, {"_id": 0}).to_list(1000)
    
    for req in purchase_requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    
    for req in out_of_stock_requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    
    for req in custom_requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    
    return {
        "purchase_requests": purchase_requests,
        "out_of_stock_requests": out_of_stock_requests,
        "custom_requests": custom_requests
    }

@api_router.put("/requests/purchase/{request_id}/complete")
async def complete_purchase_request(request_id: str, request: Request):
    """Mark a purchase request as completed"""
    await require_admin(request)
    
    result = await db.get_collection("purchase_requests").update_one(
        {"id": request_id},
        {"$set": {"status": "completed"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    return {"message": "Solicitud marcada como completada"}

@api_router.put("/requests/purchase/{request_id}/reject")
async def reject_purchase_request(request_id: str, request: Request):
    """Mark a purchase request as rejected and restitute stock"""
    await require_admin(request)
    
    # Get the request first to know the quantity and product
    purchase_request = await db.get_collection("purchase_requests").find_one({"id": request_id})
    if not purchase_request:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    if purchase_request["status"] != "pending":
        raise HTTPException(status_code=400, detail="La solicitud ya ha sido procesada")
    
    # Update request status
    await db.get_collection("purchase_requests").update_one(
        {"id": request_id},
        {"$set": {"status": "rejected"}}
    )
    
    # Restitute stock
    await db.get_collection("products").update_one(
        {"id": purchase_request["product_id"]},
        {"$inc": {"stock": purchase_request["quantity"]}}
    )
    
    return {"message": "Solicitud rechazada y stock restituido"}

@api_router.put("/requests/out-of-stock/{request_id}/complete")
async def complete_out_of_stock_request(request_id: str, request: Request):
    """Mark an out-of-stock request as completed"""
    await require_admin(request)
    
    result = await db.get_collection("out_of_stock_requests").update_one(
        {"id": request_id},
        {"$set": {"status": "completed"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    return {"message": "Solicitud marcada como completada"}

@api_router.put("/requests/custom/{request_id}/complete")
async def complete_custom_request(request_id: str, request: Request):
    """Mark a custom request as completed"""
    await require_admin(request)
    
    result = await db.get_collection("custom_requests").update_one(
        {"id": request_id},
        {"$set": {"status": "completed"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    return {"message": "Solicitud marcada como completada"}

# ==================== CONFIG ROUTES ====================

@api_router.get("/config")
async def get_config(request: Request):
    """Get admin config"""
    await require_admin(request)
    
    config = await db.get_collection("admin_config").find_one({}, {"_id": 0})
    if not config:
        # Return default
        return {"email": "", "phone": ""}
    return config

@api_router.put("/config")
async def update_config(config_data: AdminConfig, request: Request):
    """Update admin config"""
    await require_admin(request)
    
    await db.get_collection("admin_config").update_one(
        {},
        {"$set": config_data.model_dump()},
        upsert=True
    )
    
    return config_data

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