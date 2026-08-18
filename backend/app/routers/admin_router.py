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
    users = db.query(models.User).filter(models.User.role != 'chairman', models.User.role != 'admin').all()
    result = []
    
    for u in users:
        # Daily reports: 100% progress if user submitted today (IST)
        import datetime
        ist_now = datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30)
        today_date = ist_now.date()
        
        has_today_report = db.query(models.DailyReport).filter(
            models.DailyReport.user_id == u.id,
            models.DailyReport.date == today_date,
            models.DailyReport.completed == True
        ).first() is not None
        
        rep_done = 1 if has_today_report else 0
        rep_total = 1
        
        rep_weight_done = 100 if has_today_report else 0
        rep_weight_total = 100
        
        # 100 Days Goals progress (1 completed goal = 1% progress)
        goal_done = db.query(func.count(models.Goal100Days.id)).filter(models.Goal100Days.user_id == u.id, models.Goal100Days.completed == True).scalar() or 0
        goal_total = 100

        # Accomplishments progress (1 accomplishment = 1% progress)
        acc_done = db.query(func.count(models.WeeklyPlan.id)).filter(models.WeeklyPlan.user_id == u.id).scalar() or 0
        acc_total = 100

        # Pending Work progress (1 pending work = 1% progress)
        pend_done = db.query(func.count(models.PendingWork.id)).filter(models.PendingWork.user_id == u.id).scalar() or 0
        pend_total = 100

        # Weekly Plans progress (1 weekly plan = 1% progress)
        week_done = db.query(func.count(models.WeeklyPlan.id)).filter(models.WeeklyPlan.user_id == u.id).scalar() or 0
        week_total = 100

        total = rep_weight_total + goal_total + acc_total + pend_total + week_total
        done = rep_weight_done + goal_done + acc_done + pend_done + week_done
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
                "daily": {"done": rep_done, "total": rep_total, "pct": min(int(round(rep_done/rep_total*100)), 100) if rep_total>0 else 0},
                "goals": {"done": goal_done, "total": goal_total, "pct": int(round(goal_done/goal_total*100)) if goal_total>0 else 0},
                "acc": {"done": acc_done, "total": acc_total, "pct": int(round(acc_done/acc_total*100)) if acc_total>0 else 0},
                "pending": {"done": pend_done, "total": pend_total, "pct": int(round(pend_done/pend_total*100)) if pend_total>0 else 0},
                "weekly": {"done": week_done, "total": week_total, "pct": int(round(week_done/week_total*100)) if week_total>0 else 0},
            }
        })
        
    return result


import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

def send_credentials_email(recipient_email: str, name: str, password: str):
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

    subject = "🔑 Your Login Credentials - SRM Group of Institutions Portal"
    
    text_content = f"""Dear {name},

An account has been created for you by the Administrator. Below are your login credentials:

Login Email: {recipient_email}
Password: {password}
Login Link: {login_url_with_logout}

Simple Instructions to Log In:
1. Open the Login Link: {login_url_with_logout}
2. Enter your Login Email ({recipient_email}) and Password provided above.
3. Click 'Sign In' to access your SRM Dashboard Portal.

Please keep your credentials secure.
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #4c248b, #0284c7); padding: 20px; border-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 22px;">SRM Group of Institutions</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Ramapuram & Trichy • Dashboard Reports & Reviews</p>
        </div>

        <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #333333;">Dear <strong>{name}</strong>,</p>
            <p style="font-size: 14px; color: #555555; line-height: 1.6;">
                An account has been created for you by the Administrator. Below are your login credentials to access the SRM Dashboard Portal:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;">
                <tr>
                    <td style="padding: 12px 16px; font-weight: bold; color: #475569; width: 40%; border-bottom: 1px solid #e2e8f0;">Login Email:</td>
                    <td style="padding: 12px 16px; font-weight: bold; color: #0284c7; border-bottom: 1px solid #e2e8f0;"><a href="mailto:{recipient_email}" style="color: #0284c7;">{recipient_email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">Password:</td>
                    <td style="padding: 12px 16px; font-weight: bold; color: #dc2626; font-size: 16px; border-bottom: 1px solid #e2e8f0;">{password}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; font-weight: bold; color: #475569;">Login Link:</td>
                    <td style="padding: 12px 16px; font-weight: bold; color: #4c248b;"><a href="{login_url_with_logout}" style="color: #4c248b;">{login_url}</a></td>
                </tr>
            </table>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #0369a1;">📌 Simple Instructions to Log In:</p>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
                    <li>Click the <strong>Login Link</strong> above or open <a href="{login_url_with_logout}">{login_url}</a> in your web browser.</li>
                    <li>Enter your <strong>Login Email</strong> (<code>{recipient_email}</code>) and the <strong>Password</strong> provided above.</li>
                    <li>Click <strong>Sign In</strong> to access your portal.</li>
                </ol>
            </div>
        </div>

        <div style="border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; color: #888888; font-size: 12px;">
            This is an automated system email. Please keep your credentials secure.
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
                import ssl
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(timeout=10, context=context)
                server._host = smtp_host
                server.connect(ipv4_host, smtp_port)
                with server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_sender, [recipient_email], msg.as_string())
            else:
                with smtplib.SMTP(ipv4_host, smtp_port, timeout=10) as server:
                    server._host = smtp_host
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_sender, [recipient_email], msg.as_string())

            print(f"[EMAIL SUCCESS] Login credentials sent to {recipient_email}")
            return True, "Email sent successfully"
        except Exception as e:
            err_msg = str(e)
            print(f"[EMAIL ERROR] Failed to send email to {recipient_email}: {err_msg}")
            return False, f"Email delivery failed: {err_msg}"
    else:
        status_msg = "SMTP not configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASS required)"
        print(f"[EMAIL NOT CONFIGURED] Account created for {name} ({recipient_email}). Password: {password}")
        return False, status_msg


@router.post("/create-user", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: schemas.UserRegister,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_current_admin)
):
    email = user_data.email.strip().lower()
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    count = db.query(models.User).count()
    emp_id = f"EMP-{count + 1:03d}"

    hashed_pw = auth.get_password_hash(user_data.password)

    new_user = models.User(
        id=emp_id,
        email=email,
        password_hash=hashed_pw,
        title=user_data.title or "Mr.",
        name=user_data.name,
        designation=user_data.designation,
        institution=user_data.institution or "SRM Institute of Science and Technology",
        branch=user_data.branch or "Ramapuram",
        mobile=user_data.mobile or "",
        role=user_data.role or "user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    email_sent, email_msg = send_credentials_email(
        recipient_email=email,
        name=user_data.name,
        password=user_data.password
    )

    user_dict = schemas.UserResponse.from_orm(new_user).dict()
    user_dict["email_sent"] = email_sent
    user_dict["email_status_msg"] = email_msg
    return user_dict
