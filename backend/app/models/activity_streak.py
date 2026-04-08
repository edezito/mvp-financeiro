from sqlalchemy import Column, String, Integer, Date, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class ActivityStreak(Base):
    __tablename__ = "activity_streaks"

    user_id = Column(String, primary_key=True, index=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
