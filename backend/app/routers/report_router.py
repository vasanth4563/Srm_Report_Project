from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("", response_model=List[schemas.DailyReportResponse])
def get_reports(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Admins and Chairman can query other users' reports
    if current_user.role in ["admin", "chairman"]:
        if user_id:
            return db.query(models.DailyReport).filter(
                models.DailyReport.user_id == user_id
            ).all()
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

def verify_edit_permission(report, db, user):
    if user.role in ["admin", "chairman"]:
        return
        
    import datetime
    now = datetime.datetime.utcnow()
    approved_req = db.query(models.EditRequest).filter(
        models.EditRequest.user_id == user.id,
        models.EditRequest.module == "reports",
        models.EditRequest.item_id == report.id,
        models.EditRequest.status == "approved",
        models.EditRequest.expires_at > now
    ).first() is not None
    
    if approved_req:
        return
        
    if report.edited_once:
        raise HTTPException(
            status_code=403,
            detail="This report has already been edited once. Please request Admin approval to edit this report again."
        )
        
    ist_now = datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30)
    today = ist_now.date()
    yesterday = today - datetime.timedelta(days=1)
    
    report_date = report.date
    if isinstance(report_date, datetime.datetime):
        report_date = report_date.date()
        
    if report_date not in (today, yesterday):
        raise HTTPException(
            status_code=403,
            detail="Edit window has closed. You can only edit reports for today and yesterday. Please request Admin approval to edit this report."
        )

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
        
    verify_edit_permission(report, db, current_user)
    
    report.date = report_data.date
    report.area = report_data.area
    report.report = report_data.report
    report.completed = report_data.completed
    
    if current_user.role not in ["admin", "chairman"]:
        report.edited_once = True
        
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
        
    verify_edit_permission(report, db, current_user)
    
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
        
    verify_edit_permission(report, db, current_user)
    
    db.delete(report)
    db.commit()
    return None


class EmailAlertRequest(BaseModel):
    missed_date_formatted: str


def send_missing_report_email(recipient_email: str, name: str, missed_date_formatted: str):
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()
    smtp_sender = os.getenv("SMTP_SENDER", smtp_user or "noreply@srm.edu.in").strip()
    login_url = os.getenv("LOGIN_URL", os.getenv("APP_URL", "http://localhost:5173/login")).strip()
    login_url_with_logout = f"{login_url}&logout=true" if "?" in login_url else f"{login_url}?logout=true"

    subject = f"⚠️ Action Required: Missing Daily Report for {missed_date_formatted}"
    
    text_content = f"""Dear {name},
    
Action Required: You forgot to submit your Daily Report for yesterday ({missed_date_formatted}). Please submit it on the Daily Reports page.

Login Link: {login_url_with_logout}

Please submit your report as soon as possible.
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626, #f59e0b); padding: 20px; border-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 22px;">SRM Group of Institutions</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Ramapuram & Trichy • Daily Report Warning</p>
        </div>

        <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #333333;">Dear <strong>{name}</strong>,</p>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 15px; color: #78350f; line-height: 1.6; font-weight: 600;">
                ⚠️ Action Required: You forgot to submit your Daily Report for yesterday ({missed_date_formatted}). Please fill and submit it on the Daily Reports page.
            </div>

            <p style="font-size: 14px; color: #555555; line-height: 1.6;">
                Logging daily activities is required to track ongoing performance and compile weekly achievements. Please click the button below to sign in and submit your missing report:
            </p>

            <div style="text-align: center; margin: 25px 0;">
                <a href="{login_url_with_logout}" style="background: linear-gradient(135deg, #4c248b, #0284c7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(76,36,139,0.25);">
                    Go to Daily Reports Page
                </a>
            </div>
        </div>

        <div style="border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; color: #888888; font-size: 12px;">
            This is an automated reminder. If you have already submitted your report, please ignore this email.
        </div>
    </div>
    """

    if smtp_host and smtp_user and smtp_pass:
        try:
            import socket
            ipv4_host = smtp_host
            try:
                addresses = socket.getaddrinfo(smtp_host, None, socket.AF_INET)
                if addresses:
                    ipv4_host = addresses[0][4][0]
            except Exception:
                pass

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_sender
            msg["To"] = recipient_email
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if smtp_port == 465:
                with smtplib.SMTP_SSL(ipv4_host, smtp_port, timeout=10, server_hostname=smtp_host) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_sender, [recipient_email], msg.as_string())
            else:
                with smtplib.SMTP(ipv4_host, smtp_port, timeout=10) as server:
                    server.starttls(server_hostname=smtp_host)
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_sender, [recipient_email], msg.as_string())

            print(f"[EMAIL SUCCESS] Missing report warning sent to {recipient_email}")
            return True, "Email sent successfully"
        except Exception as e:
            err_msg = str(e)
            print(f"[EMAIL ERROR] Failed to send missing report email to {recipient_email}: {err_msg}")
            return False, f"Email delivery failed: {err_msg}"
    else:
        status_msg = "SMTP not configured in .env"
        print(f"[EMAIL NOT CONFIGURED] Warning for {name} ({recipient_email}) on {missed_date_formatted}")
        return False, status_msg


@router.post("/email-alert")
def send_report_email_alert(
    payload: EmailAlertRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    success, message = send_missing_report_email(
        recipient_email=current_user.email,
        name=current_user.name,
        missed_date_formatted=payload.missed_date_formatted
    )
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return {"status": "success", "message": message}
