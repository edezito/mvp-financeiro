from sqlalchemy import Column, String, Numeric, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class InvestmentGoal(Base):
    __tablename__ = "investment_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String(120), nullable=False)
    emoji = Column(String(8), default="🎯")
    target_value = Column(Numeric(15, 2), nullable=False)
    current_value = Column(Numeric(15, 2), default=0)
    monthly_contribution = Column(Numeric(15, 2), default=0)
    deadline = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
