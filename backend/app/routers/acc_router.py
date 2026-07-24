from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/accomplishments", tags=["accomplishments"])

@router.get("", response_model=List[schemas.AccomplishmentResponse])
def get_accomplishments(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    target_user_id = current_user.id
    if current_user.role == "admin" and user_id:
        target_user_id = user_id
        
    return db.query(models.Accomplishment).filter(models.Accomplishment.user_id == target_user_id).all()

@router.post("", response_model=schemas.AccomplishmentResponse)
def create_accomplishment(
    acc_data: schemas.AccomplishmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_acc = models.Accomplishment(
        user_id=current_user.id,
        area=acc_data.area,
        work=acc_data.work,
        date_start=acc_data.date_start,
        date_end=acc_data.date_end,
        completed=acc_data.completed if acc_data.completed is not None else True
    )
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)
    return new_acc

@router.put("/{id}", response_model=schemas.AccomplishmentResponse)
def update_accomplishment(
    id: int,
    acc_data: schemas.AccomplishmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    acc = db.query(models.Accomplishment).filter(models.Accomplishment.id == id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Accomplishment not found")
    
    if current_user.role != "admin" and acc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this accomplishment")
    
    acc.area = acc_data.area
    acc.work = acc_data.work
    acc.date_start = acc_data.date_start
    acc.date_end = acc_data.date_end
    if acc_data.completed is not None:
        acc.completed = acc_data.completed
    
    db.commit()
    db.refresh(acc)
    return acc

@router.patch("/{id}/toggle", response_model=schemas.AccomplishmentResponse)
def toggle_accomplishment(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    acc = db.query(models.Accomplishment).filter(models.Accomplishment.id == id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Accomplishment not found")
    
    if current_user.role != "admin" and acc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this accomplishment")
    
    acc.completed = True
    db.commit()
    db.refresh(acc)
    return acc

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accomplishment(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    acc = db.query(models.Accomplishment).filter(models.Accomplishment.id == id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Accomplishment not found")
    
    if current_user.role != "admin" and acc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this accomplishment")
    
    db.delete(acc)
    db.commit()
    return None
