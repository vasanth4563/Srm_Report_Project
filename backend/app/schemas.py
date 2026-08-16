from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# User Schemas
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    id: Optional[str] = None
    title: str = "Mr."
    name: str
    designation: str
    institution: Optional[str] = "SRM Institute of Science and Technology"
    email: str
    password: str
    branch: Optional[str] = "Ramapuram"
    mobile: Optional[str] = ""
    role: Optional[str] = "user"

class UserResponse(BaseModel):
    id: str
    email: str
    title: Optional[str] = "Mr."
    name: str
    designation: Optional[str] = None
    institution: Optional[str] = None
    branch: Optional[str] = None
    mobile: Optional[str] = None
    role: str
    avatar: Optional[str] = ""
    email_sent: Optional[bool] = None
    email_status_msg: Optional[str] = None

    class Config:
        from_attributes = True

class UserReportSummary(BaseModel):
    id: str
    title: Optional[str] = "Mr."
    name: str
    designation: Optional[str] = None
    institution: Optional[str] = None
    email: str
    mobile: Optional[str] = None
    branch: Optional[str] = None
    role: str = "user"
    totalReports: int
    doneReports: int
    pendingReports: int
    progressPct: float = 0.0
    moduleBreakdown: Optional[dict] = None

    class Config:
        from_attributes = True

# Daily Report Schemas
class DailyReportBase(BaseModel):
    date: date
    area: str
    report: str
    completed: Optional[bool] = True
    edited_once: Optional[bool] = False

class DailyReportCreate(DailyReportBase):
    pass

class DailyReportResponse(DailyReportBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

# 100 Days Goal Schemas
class GoalBase(BaseModel):
    day: int
    date: date
    goal: str
    responsible_person: Optional[str] = "Self"
    completed: Optional[bool] = True

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

# Accomplishment Schemas
class AccomplishmentBase(BaseModel):
    area: str
    work: str
    date_start: date
    date_end: date
    completed: Optional[bool] = True

class AccomplishmentCreate(AccomplishmentBase):
    pass

class AccomplishmentResponse(AccomplishmentBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

# Pending Work Schemas
class PendingWorkBase(BaseModel):
    areas: str
    particulars: str
    responsible_person: Optional[str] = None
    date_start: date
    date_end: Optional[date] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    completed: Optional[bool] = False

class PendingWorkCreate(PendingWorkBase):
    pass

class PendingWorkResponse(PendingWorkBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

# Weekly Plan Schemas
class WeeklyPlanBase(BaseModel):
    date: date
    date_end: Optional[date] = None
    work: str
    responsible_person: Optional[str] = "Self"
    completed: Optional[bool] = True

class WeeklyPlanCreate(WeeklyPlanBase):
    pass

class WeeklyPlanResponse(WeeklyPlanBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

# Edit Request Schemas
class EditRequestCreate(BaseModel):
    module: str
    item_id: int
    item_title: Optional[str] = None
    reason: Optional[str] = None

class EditRequestResponse(BaseModel):
    id: int
    user_id: str
    module: str
    item_id: int
    item_title: Optional[str] = None
    reason: Optional[str] = None
    status: str
    requested_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
