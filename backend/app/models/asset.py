from sqlalchemy import Column, String, Numeric, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(String, nullable=False, index=True)
    ticker = Column(String(20), nullable=False)          # ex: PETR4, AAPL
    name = Column(String(100), nullable=True)            # ex: Petrobras
    quantity = Column(Numeric(15, 6), nullable=False)    # suporta frações (cripto/ETF)
    avg_price = Column(Numeric(15, 6), nullable=False)   # preço médio ponderado
    total_invested = Column(Numeric(15, 2), nullable=False)  # quantidade * preço médio
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
