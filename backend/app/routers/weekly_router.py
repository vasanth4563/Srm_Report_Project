from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/weekly", tags=["weekly"])

@router.get("", response_model=List[schemas.WeeklyPlanResponse])
def get_weekly_plans(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    target_user_id = current_user.id
    if current_user.role in ["admin", "chairman"] and user_id:
        target_user_id = user_id
        
    return db.query(models.WeeklyPlan).filter(models.WeeklyPlan.user_id == target_user_id).all()

@router.post("", response_model=schemas.WeeklyPlanResponse)
def create_weekly_plan(
    data: schemas.WeeklyPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_weekly = models.WeeklyPlan(
        user_id=current_user.id,
        date=data.date,
        work=data.work,
        responsible_person=data.responsible_person or "Self",
        completed=data.completed if data.completed is not None else True
    )
    try:
        new_weekly.date_end = data.date_end
    except Exception:
        pass
    db.add(new_weekly)
    db.commit()
    db.refresh(new_weekly)
    return new_weekly

@router.put("/{id}", response_model=schemas.WeeklyPlanResponse)
def update_weekly_plan(
    id: int,
    data: schemas.WeeklyPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    weekly = db.query(models.WeeklyPlan).filter(models.WeeklyPlan.id == id).first()
    if not weekly:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    
    if current_user.role != "admin" and weekly.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this record")
    
    weekly.date = data.date
    try:
        weekly.date_end = data.date_end
    except Exception:
        pass
    weekly.work = data.work
    weekly.responsible_person = data.responsible_person
    if data.completed is not None:
        weekly.completed = data.completed
    
    db.commit()
    db.refresh(weekly)
    return weekly

@router.patch("/{id}/toggle", response_model=schemas.WeeklyPlanResponse)
def toggle_weekly_plan(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    weekly = db.query(models.WeeklyPlan).filter(models.WeeklyPlan.id == id).first()
    if not weekly:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    
    if current_user.role != "admin" and weekly.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this record")
    
    weekly.completed = True
    db.commit()
    db.refresh(weekly)
    return weekly

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weekly_plan(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    weekly = db.query(models.WeeklyPlan).filter(models.WeeklyPlan.id == id).first()
    if not weekly:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    
    if current_user.role != "admin" and weekly.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")
    
    db.delete(weekly)
    db.commit()
    return None
