from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/goals", tags=["goals"])

@router.get("", response_model=List[schemas.GoalResponse])
def get_goals(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    target_user_id = current_user.id
    if current_user.role in ["admin", "chairman"] and user_id:
        target_user_id = user_id
    
    return db.query(models.Goal100Days).filter(models.Goal100Days.user_id == target_user_id).order_by(models.Goal100Days.day.asc()).all()

@router.post("", response_model=schemas.GoalResponse)
def create_goal(
    goal_data: schemas.GoalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if goal for that day already exists for the user
    existing = db.query(models.Goal100Days).filter(
        models.Goal100Days.user_id == current_user.id,
        models.Goal100Days.day == goal_data.day
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Goal for day {goal_data.day} already exists")

    new_goal = models.Goal100Days(
        user_id=current_user.id,
        day=goal_data.day,
        date=goal_data.date,
        goal=goal_data.goal,
        responsible_person=goal_data.responsible_person or "Self",
        completed=goal_data.completed
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.put("/{id}", response_model=schemas.GoalResponse)
def update_goal(
    id: int,
    goal_data: schemas.GoalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    goal = db.query(models.Goal100Days).filter(models.Goal100Days.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if current_user.role != "admin" and goal.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this goal")
    
    goal.day = goal_data.day
    goal.date = goal_data.date
    goal.goal = goal_data.goal
    goal.responsible_person = goal_data.responsible_person
    goal.completed = goal_data.completed
    
    db.commit()
    db.refresh(goal)
    return goal

@router.patch("/{id}/toggle", response_model=schemas.GoalResponse)
def toggle_goal_status(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    goal = db.query(models.Goal100Days).filter(models.Goal100Days.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if current_user.role != "admin" and goal.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this goal")
    
    goal.completed = True
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    goal = db.query(models.Goal100Days).filter(models.Goal100Days.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if current_user.role != "admin" and goal.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this goal")
    
    db.delete(goal)
    db.commit()
    return None
