"""
InventoLedger - FastAPI REST Backend
Full-Stack & OS Concurrency Engine
Authors: 24091A3215, 24091A3222
"""

import os
import asyncio
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from models import Base, Branch, Product, Inventory, User, Customer, Sale, SaleItem, Purchase, Transfer, TransactionLedger, Alert

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventoledger.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InventoLedger API",
    description="Multi-Branch Retail Inventory System with ACID transactions and Mutex synchronization",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# OS Mutex registry
resource_mutexes = {}
def get_resource_mutex(product_id: str, branch_id: str) -> asyncio.Lock:
    key = f"{product_id}:{branch_id}"
    if key not in resource_mutexes:
        resource_mutexes[key] = asyncio.Lock()
    return resource_mutexes[key]

# Pydantic Schemas
class LoginRequest(BaseModel):
    role: str
    email: str
    password: str

class SaleItemCreate(BaseModel):
    productId: str
    quantity: int
    unitPrice: float

class SaleCreate(BaseModel):
    branchId: str
    customerId: Optional[str] = None
    customerName: Optional[str] = "Retail Shopper"
    userEmail: str
    saleType: str = "Customer Sale"
    paymentMethod: str = "Credit Card"
    items: List[SaleItemCreate]

class TransferCreate(BaseModel):
    productId: str
    sourceBranchId: str
    targetBranchId: str
    quantity: int
    requestedBy: str
    notes: Optional[str] = "Stock rebalance"

class ConcurrencySimRequest(BaseModel):
    productId: str = "p-001"
    branchId: str = "b-001"
    initialStock: int = 10
    threads: int = 15
    useMutex: bool = True
    simulatedDelayMs: int = 25

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "InventoLedger FastAPI Engine", "authors": ["24091A3215", "24091A3222"]}

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user or user.password_hash != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user.role != req.role:
        raise HTTPException(status_code=403, detail=f"Account role does not match {req.role}.")

    branch_name = None
    if user.branch_id:
        br = db.query(Branch).filter(Branch.id == user.branch_id).first()
        branch_name = br.name if br else None

    return {
        "ok": True,
        "session": {
            "userId": user.id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role,
            "branchId": user.branch_id,
            "assignedBranch": branch_name
        }
    }

@app.get("/api/branches")
def list_branches(db: Session = Depends(get_db)):
    branches = db.query(Branch).all()
    return {"ok": True, "data": branches}

@app.get("/api/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []
    for p in products:
        stock = sum(inv.stock_quantity for inv in p.inventories)
        result.append({
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "cost_price": p.cost_price,
            "min_reorder_level": p.min_reorder_level,
            "stock": stock
        })
    return {"ok": True, "data": result}

@app.post("/api/sales")
async def create_sale(req: SaleCreate, db: Session = Depends(get_db)):
    # Mutex acquisition for each item
    locks = [get_resource_mutex(it.productId, req.branchId) for it in req.items]
    for lock in locks:
        await lock.acquire()

    try:
        total_amount = sum(it.unitPrice * it.quantity for it in req.items)
        sale_id = f"s-{uuid.uuid4().hex[:8]}"

        sale = Sale(
            id=sale_id,
            branch_id=req.branchId,
            customer_id=req.customerId,
            customer_name=req.customerName,
            user_email=req.userEmail,
            sale_type=req.saleType,
            payment_method=req.paymentMethod,
            total_amount=total_amount,
            status="Completed"
        )
        db.add(sale)

        for item in req.items:
            inv = db.query(Inventory).filter(
                Inventory.product_id == item.productId,
                Inventory.branch_id == req.branchId
            ).first()

            if not inv or inv.stock_quantity < item.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock for one or more items.")

            inv.stock_quantity -= item.quantity
            db.add(SaleItem(
                id=f"si-{uuid.uuid4().hex[:8]}",
                sale_id=sale_id,
                product_id=item.productId,
                quantity=item.quantity,
                unit_price=item.unitPrice,
                subtotal=item.unitPrice * item.quantity
            ))

            db.add(TransactionLedger(
                id=f"txl-{uuid.uuid4().hex[:8]}",
                txn_ref_id=sale_id,
                txn_type=req.saleType,
                branch_id=req.branchId,
                product_id=item.productId,
                qty_change=-item.quantity,
                balance_after=inv.stock_quantity,
                user_email=req.userEmail,
                user_role="USER",
                notes=f"Sold {item.quantity} units"
            ))

        db.commit()
        return {"ok": True, "saleId": sale_id, "totalAmount": total_amount}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        for lock in locks:
            lock.release()

@app.post("/api/concurrency/simulate")
async def simulate_concurrency(req: ConcurrencySimRequest):
    current_stock = req.initialStock
    sim_mutex = asyncio.Lock()
    successful = 0
    rejected = 0
    thread_results = []

    async def worker(t_idx: int):
        nonlocal current_stock, successful, rejected
        t_id = f"Thread-{t_idx:02d}"

        if req.useMutex:
            async with sim_mutex:
                stock_read = current_stock
                await asyncio.sleep(req.simulatedDelayMs / 1000.0)
                if stock_read > 0:
                    current_stock = stock_read - 1
                    successful += 1
                    thread_results.append({"threadId": t_id, "status": "SUCCESS", "stockBefore": stock_read, "stockAfter": current_stock})
                else:
                    rejected += 1
                    thread_results.append({"threadId": t_id, "status": "REJECTED (Out of Stock)", "stockBefore": 0, "stockAfter": 0})
        else:
            stock_read = current_stock
            await asyncio.sleep(req.simulatedDelayMs / 1000.0)
            if stock_read > 0:
                current_stock = stock_read - 1
                successful += 1
                thread_results.append({"threadId": t_id, "status": "UNSAFE_WRITE", "stockBefore": stock_read, "stockAfter": current_stock})
            else:
                rejected += 1
                thread_results.append({"threadId": t_id, "status": "REJECTED", "stockBefore": 0, "stockAfter": 0})

    tasks = [worker(i) for i in range(1, req.threads + 1)]
    await asyncio.gather(*tasks)

    expected_stock = max(0, req.initialStock - req.threads)
    anomaly = False if req.useMutex else (current_stock != expected_stock)

    return {
        "ok": True,
        "simulation": {
            "useMutex": req.useMutex,
            "threads": req.threads,
            "initialStock": req.initialStock,
            "finalStock": current_stock,
            "expectedStock": expected_stock,
            "successfulDeductions": successful,
            "rejectedDeductions": rejected,
            "anomalyDetected": anomaly,
            "analysis": "Mutual exclusion guaranteed serializability." if req.useMutex else "Lost updates reproduced due to non-atomic concurrent access.",
            "threads": thread_results
        }
    }
