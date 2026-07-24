from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("", response_model=List[schemas.DailyReportResponse])
def get_reports(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Admins can query other users' reports
    if current_user.role == "admin":
        if user_id:
            return db.query(models.DailyReport).filter(models.DailyReport.user_id == user_id).all()
        return db.query(models.DailyReport).all()
    
    # Standard users can only access their own reports
    return db.query(models.DailyReport).filter(models.DailyReport.user_id == current_user.id).all()

@router.post("", response_model=schemas.DailyReportResponse)
def create_report(
    report_data: schemas.DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Determine next slNo/id count (not strictly required if autoincrement PK handles it,
    # but we can save it)
    new_report = models.DailyReport(
        user_id=current_user.id,
        date=report_data.date,
        area=report_data.area,
        report=report_data.report,
        completed=report_data.completed
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.put("/{id}", response_model=schemas.DailyReportResponse)
def update_report(
    id: int,
    report_data: schemas.DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    report = db.query(models.DailyReport).filter(models.DailyReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role != "admin" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this report")
    
    report.date = report_data.date
    report.area = report_data.area
    report.report = report_data.report
    report.completed = report_data.completed
    
    db.commit()
    db.refresh(report)
    return report

@router.patch("/{id}/toggle", response_model=schemas.DailyReportResponse)
def toggle_report_status(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    report = db.query(models.DailyReport).filter(models.DailyReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if current_user.role != "admin" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this report")
    
    report.completed = True
    db.commit()
    db.refresh(report)
    return report

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    report = db.query(models.DailyReport).filter(models.DailyReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if current_user.role != "admin" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this report")
    
    db.delete(report)
    db.commit()
    return None
