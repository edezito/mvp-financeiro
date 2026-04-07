from sqlalchemy import Column, String, Numeric, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"


class TransactionCategory(str, enum.Enum):
    salary = "salary"
    investment = "investment"
    freelance = "freelance"
    food = "food"
    transport = "transport"
    housing = "housing"
    health = "health"
    education = "education"
    entertainment = "entertainment"
    other = "other"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(String, nullable=False, index=True)
    type = Column(SAEnum(TransactionType), nullable=False)
    category = Column(
        SAEnum(TransactionCategory),
        nullable=False,
        default=TransactionCategory.other,
    )
    description = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
