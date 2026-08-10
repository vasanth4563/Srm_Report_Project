from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/pending", tags=["pending"])

@router.get("", response_model=List[schemas.PendingWorkResponse])
def get_pending_works(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    target_user_id = current_user.id
    if current_user.role in ["admin", "chairman"] and user_id:
        target_user_id = user_id
        
    return db.query(models.PendingWork).filter(models.PendingWork.user_id == target_user_id).all()

@router.post("", response_model=schemas.PendingWorkResponse)
def create_pending_work(
    data: schemas.PendingWorkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_pending = models.PendingWork(
        user_id=current_user.id,
        areas=data.areas,
        particulars=data.particulars,
        responsible_person=data.responsible_person,
        date_start=data.date_start,
        date_end=data.date_end,
        status_date=data.status_date,
        remarks=data.remarks,
        completed=data.completed if data.completed is not None else False
    )
    db.add(new_pending)
    db.commit()
    db.refresh(new_pending)
    return new_pending

@router.put("/{id}", response_model=schemas.PendingWorkResponse)
def update_pending_work(
    id: int,
    data: schemas.PendingWorkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    pending = db.query(models.PendingWork).filter(models.PendingWork.id == id).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Pending entry not found")
    
    if current_user.role != "admin" and pending.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this record")
    
    pending.areas = data.areas
    pending.particulars = data.particulars
    pending.responsible_person = data.responsible_person
    pending.date_start = data.date_start
    pending.date_end = data.date_end
    pending.status_date = data.status_date
    pending.remarks = data.remarks
    if data.completed is not None:
        pending.completed = data.completed
    
    db.commit()
    db.refresh(pending)
    return pending

@router.patch("/{id}/toggle", response_model=schemas.PendingWorkResponse)
def toggle_pending_work(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    pending = db.query(models.PendingWork).filter(models.PendingWork.id == id).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Pending entry not found")
    
    if current_user.role != "admin" and pending.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this record")
    
    pending.completed = True
    db.commit()
    db.refresh(pending)
    return pending

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pending_work(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    pending = db.query(models.PendingWork).filter(models.PendingWork.id == id).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Pending entry not found")
    
    if current_user.role != "admin" and pending.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")
    
    db.delete(pending)
    db.commit()
    return None
