from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/edit-requests", tags=["Edit Requests"])

@router.post("", response_model=schemas.EditRequestResponse)
def create_edit_request(
    req: schemas.EditRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    existing = db.query(models.EditRequest).filter(
        models.EditRequest.user_id == current_user.id,
        models.EditRequest.module == req.module,
        models.EditRequest.item_id == req.item_id,
        models.EditRequest.status == "pending"
    ).first()

    if existing:
        res = schemas.EditRequestResponse.from_orm(existing)
        res.user_name = current_user.name
        return res

    new_req = models.EditRequest(
        user_id=current_user.id,
        module=req.module,
        item_id=req.item_id,
        item_title=req.item_title or f"{req.module.capitalize()} #{req.item_id}",
        reason=req.reason or "Needs modification",
        status="pending",
        requested_at=datetime.utcnow()
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    res = schemas.EditRequestResponse.from_orm(new_req)
    res.user_name = current_user.name
    return res

@router.get("", response_model=List[schemas.EditRequestResponse])
def get_edit_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role in ["admin", "chairman"]:
        requests = db.query(models.EditRequest).order_by(models.EditRequest.requested_at.desc()).all()
    else:
        requests = db.query(models.EditRequest).filter(
            models.EditRequest.user_id == current_user.id
        ).order_by(models.EditRequest.requested_at.desc()).all()

    results = []
    for r in requests:
        res = schemas.EditRequestResponse.from_orm(r)
        res.user_name = r.user.name if r.user else "Unknown User"
        results.append(res)
    return results

@router.post("/{request_id}/approve", response_model=schemas.EditRequestResponse)
def approve_edit_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["admin", "chairman"]:
        raise HTTPException(status_code=403, detail="Only Admin can approve edit requests")

    req = db.query(models.EditRequest).filter(models.EditRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Edit request not found")

    now = datetime.utcnow()
    req.status = "approved"
    req.approved_at = now
    req.expires_at = now + timedelta(hours=24)

    db.commit()
    db.refresh(req)

    res = schemas.EditRequestResponse.from_orm(req)
    res.user_name = req.user.name if req.user else "Unknown User"
    return res

@router.post("/{request_id}/reject", response_model=schemas.EditRequestResponse)
def reject_edit_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["admin", "chairman"]:
        raise HTTPException(status_code=403, detail="Only Admin can reject edit requests")

    req = db.query(models.EditRequest).filter(models.EditRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Edit request not found")

    req.status = "rejected"
    db.commit()
    db.refresh(req)

    res = schemas.EditRequestResponse.from_orm(req)
    res.user_name = req.user.name if req.user else "Unknown User"
    return res

@router.get("/check-permission")
def check_edit_permission(
    module: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role in ["admin", "chairman"]:
        return {"can_edit": True, "reason": "admin_privilege", "status": "approved"}

    now = datetime.utcnow()
    approved_req = db.query(models.EditRequest).filter(
        models.EditRequest.user_id == current_user.id,
        models.EditRequest.module == module,
        models.EditRequest.item_id == item_id,
        models.EditRequest.status == "approved",
        models.EditRequest.expires_at > now
    ).first()

    if approved_req:
        remaining_secs = (approved_req.expires_at - now).total_seconds()
        return {
            "can_edit": True,
            "status": "approved",
            "expires_at": approved_req.expires_at.isoformat(),
            "remaining_hours": round(remaining_secs / 3600, 1)
        }

    pending_req = db.query(models.EditRequest).filter(
        models.EditRequest.user_id == current_user.id,
        models.EditRequest.module == module,
        models.EditRequest.item_id == item_id,
        models.EditRequest.status == "pending"
    ).first()

    if pending_req:
        return {"can_edit": False, "status": "pending", "requested_at": pending_req.requested_at.isoformat()}

    return {"can_edit": False, "status": "none"}
