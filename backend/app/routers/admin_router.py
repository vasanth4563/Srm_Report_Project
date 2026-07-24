from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users", response_model=List[schemas.UserReportSummary])
def get_users_report_summary(
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_current_admin)
):
    users = db.query(models.User).filter(models.User.role != 'chairman').all()
    result = []
    
    for u in users:
        # Count across all 5 activity modules
        rep_total = db.query(func.count(models.DailyReport.id)).filter(models.DailyReport.user_id == u.id).scalar() or 0
        rep_done = db.query(func.count(models.DailyReport.id)).filter(models.DailyReport.user_id == u.id, models.DailyReport.completed == True).scalar() or 0
        
        goal_total = db.query(func.count(models.Goal100Days.id)).filter(models.Goal100Days.user_id == u.id).scalar() or 0
        goal_done = db.query(func.count(models.Goal100Days.id)).filter(models.Goal100Days.user_id == u.id, models.Goal100Days.completed == True).scalar() or 0

        acc_total = db.query(func.count(models.Accomplishment.id)).filter(models.Accomplishment.user_id == u.id).scalar() or 0
        acc_done = db.query(func.count(models.Accomplishment.id)).filter(models.Accomplishment.user_id == u.id, models.Accomplishment.completed == True).scalar() or 0

        pend_total = db.query(func.count(models.PendingWork.id)).filter(models.PendingWork.user_id == u.id).scalar() or 0
        pend_done = db.query(func.count(models.PendingWork.id)).filter(models.PendingWork.user_id == u.id, models.PendingWork.completed == True).scalar() or 0

        week_total = db.query(func.count(models.WeeklyPlan.id)).filter(models.WeeklyPlan.user_id == u.id).scalar() or 0
        week_done = db.query(func.count(models.WeeklyPlan.id)).filter(models.WeeklyPlan.user_id == u.id, models.WeeklyPlan.completed == True).scalar() or 0

        total = rep_total + goal_total + acc_total + pend_total + week_total
        done = rep_done + goal_done + acc_done + pend_done + week_done
        pending = total - done
        progress_pct = round((done / total * 100), 1) if total > 0 else 0.0
        
        display_name = f"{u.name}"
        
        result.append({
            "id": u.id,
            "title": u.title,
            "name": display_name,
            "designation": u.designation,
            "institution": u.institution,
            "email": u.email,
            "mobile": u.mobile,
            "branch": u.branch,
            "role": u.role,
            "totalReports": total,
            "doneReports": done,
            "pendingReports": pending,
            "progressPct": progress_pct,
            "moduleBreakdown": {
                "daily": {"done": rep_done, "total": rep_total, "pct": round(rep_done/rep_total*100, 1) if rep_total>0 else 0.0},
                "goals": {"done": goal_done, "total": goal_total, "pct": round(goal_done/goal_total*100, 1) if goal_total>0 else 0.0},
                "acc": {"done": acc_done, "total": acc_total, "pct": round(acc_done/acc_total*100, 1) if acc_total>0 else 0.0},
                "pending": {"done": pend_done, "total": pend_total, "pct": round(pend_done/pend_total*100, 1) if pend_total>0 else 0.0},
                "weekly": {"done": week_done, "total": week_total, "pct": round(week_done/week_total*100, 1) if week_total>0 else 0.0},
            }
        })
        
    return result
