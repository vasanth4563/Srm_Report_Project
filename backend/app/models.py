from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)  # e.g., EMP-001
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    title = Column(String(20), default="Mr.")
    name = Column(String(100), nullable=False)
    designation = Column(String(100))
    institution = Column(String(150))
    branch = Column(String(50))
    mobile = Column(String(20))
    role = Column(String(20), default="user")  # 'admin' or 'user'
    avatar = Column(String(10), default="")

    daily_reports = relationship("DailyReport", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal100Days", back_populates="user", cascade="all, delete-orphan")
    accomplishments = relationship("Accomplishment", back_populates="user", cascade="all, delete-orphan")
    pending_works = relationship("PendingWork", back_populates="user", cascade="all, delete-orphan")
    weekly_plans = relationship("WeeklyPlan", back_populates="user", cascade="all, delete-orphan")


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    area = Column(String(100), nullable=False)
    report = Column(Text, nullable=False)
    completed = Column(Boolean, default=True)
    edited_once = Column(Boolean, default=False)

    user = relationship("User", back_populates="daily_reports")


class Goal100Days(Base):
    __tablename__ = "goals_100_days"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    goal = Column(Text, nullable=False)
    responsible_person = Column(String(100), default="Self")
    completed = Column(Boolean, default=True)

    user = relationship("User", back_populates="goals")


class Accomplishment(Base):
    __tablename__ = "accomplishments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    area = Column(String(150), nullable=False)
    work = Column(Text, nullable=False)
    date_start = Column(Date, nullable=False)
    date_end = Column(Date, nullable=False)
    completed = Column(Boolean, default=True)

    user = relationship("User", back_populates="accomplishments")


class PendingWork(Base):
    __tablename__ = "pending_works"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    areas = Column(String(150), nullable=False)
    particulars = Column(Text, nullable=False)
    responsible_person = Column(String(100))
    date_start = Column(Date, nullable=False)
    date_end = Column(Date)
    status = Column(String(255))
    remarks = Column(Text)
    completed = Column(Boolean, default=True)

    user = relationship("User", back_populates="pending_works")


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    date_end = Column(Date, nullable=True)
    work = Column(Text, nullable=False)
    responsible_person = Column(String(100), default="Self")
    completed = Column(Boolean, default=True)

    user = relationship("User", back_populates="weekly_plans")


class EditRequest(Base):
    __tablename__ = "edit_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module = Column(String(50), nullable=False)
    item_id = Column(Integer, nullable=False)
    item_title = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User")
