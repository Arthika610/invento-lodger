"""
InventoLedger - Relational Data Models (SQLAlchemy)
DBMS Module: Transaction-safe schema for stock, purchases, sales, and transfers.
Authors: 24091A3215, 24091A3222
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=False)
    manager_name = Column(String, nullable=False)
    manager_email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    inventories = relationship("Inventory", back_populates="branch")
    sales = relationship("Sale", back_populates="branch")

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    sku = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    min_reorder_level = Column(Integer, default=10, nullable=False)
    target_stock = Column(Integer, default=50, nullable=False)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('price >= 0', name='check_price_positive'),
        CheckConstraint('cost_price >= 0', name='check_cost_positive'),
    )

    inventories = relationship("Inventory", back_populates="product")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)
    last_restocked_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('stock_quantity >= 0', name='check_stock_non_negative'),
        CheckConstraint('reserved_quantity >= 0', name='check_reserved_non_negative'),
        UniqueConstraint('product_id', 'branch_id', name='uq_product_branch')
    )

    product = relationship("Product", back_populates="inventories")
    branch = relationship("Branch", back_populates="inventories")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'ADMIN', 'BRANCH_MANAGER', 'CUSTOMER'
    branch_id = Column(String, ForeignKey("branches.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    home_branch_id = Column(String, ForeignKey("branches.id"), nullable=True)
    total_spend = Column(Float, default=0.0)
    orders_count = Column(Integer, default=0)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

class Sale(Base):
    __tablename__ = "sales"

    id = Column(String, primary_key=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    user_email = Column(String, nullable=False)
    sale_type = Column(String, nullable=False)
    payment_method = Column(String, default="Credit Card", nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="Completed", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(String, primary_key=True)
    sale_id = Column(String, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(String, primary_key=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    supplier_name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="Completed", nullable=False)
    ordered_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(String, primary_key=True)
    source_branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    target_branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String, default="Completed", nullable=False)
    requested_by = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class TransactionLedger(Base):
    __tablename__ = "transaction_ledger"

    id = Column(String, primary_key=True)
    txn_ref_id = Column(String, nullable=True)
    txn_type = Column(String, nullable=False)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    qty_change = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    user_role = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    severity = Column(String, nullable=False)  # 'out' or 'low'
    alert_type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_resolved = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
