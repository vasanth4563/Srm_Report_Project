from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import User
from .routers import auth_router, report_router, goal_router, acc_router, pending_router, weekly_router, admin_router, edit_request_router

# Initialize tables (triggers uvicorn reload)
Base.metadata.create_all(bind=engine)

from .database import run_migrations
run_migrations(engine)


def copy_logo_file():
    import shutil
    import os
    src_logo = r"C:\Users\vasan\.gemini\antigravity\brain\bb7d008d-2bb3-4c53-a1d3-6c900d55fe53\.user_uploaded\media_1786541435349.jpg"
    dest_logo = r"c:\Users\vasan\OneDrive\Desktop\Report\public\srm_logo.jpg"
    src_icon = r"C:\Users\vasan\.gemini\antigravity\brain\bb7d008d-2bb3-4c53-a1d3-6c900d55fe53\.user_uploaded\media_1786541405088.png"
    dest_icon = r"c:\Users\vasan\OneDrive\Desktop\Report\public\srm_icon.png"
    
    if os.path.exists(src_logo):
        try:
            os.makedirs(os.path.dirname(dest_logo), exist_ok=True)
            shutil.copy(src_logo, dest_logo)
            print("[LOGO COPY] Successfully copied logo to public/srm_logo.jpg")
        except Exception as e:
            print(f"[LOGO COPY ERROR] {e}")
            
    if os.path.exists(src_icon):
        try:
            os.makedirs(os.path.dirname(dest_icon), exist_ok=True)
            shutil.copy(src_icon, dest_icon)
            print("[LOGO COPY] Successfully copied icon to public/srm_icon.png")
        except Exception as e:
            print(f"[ICON COPY ERROR] {e}")

copy_logo_file()

def seed_default_users():
    db = SessionLocal()
    try:
        from .auth import get_password_hash
        count = db.query(User).count()
        if count == 0:
            print("[SEED] No users found. Seeding default accounts...")
            users_to_seed = [
                User(
                    id="CH-001",
                    email="chairman@srmist.edu.in",
                    password_hash=get_password_hash("SRM@1234"),
                    title="Mr.",
                    name="Chairman",
                    designation="Chairman",
                    institution="SRM Group",
                    branch="Ramapuram",
                    mobile="9876543212",
                    role="chairman",
                    avatar="CH"
                ),
                User(
                    id="EMP-001",
                    email="raji@srmist.edu.in",
                    password_hash=get_password_hash("SRM@1234"),
                    title="Dr.",
                    name="Dr. Raji",
                    designation="Administrator",
                    institution="SRM Ramapuram",
                    branch="Ramapuram",
                    mobile="9876543210",
                    role="admin",
                    avatar="DR"
                ),
                User(
                    id="EMP-002",
                    email="kathiravan@srmist.edu.in",
                    password_hash=get_password_hash("SRM@1234"),
                    title="Dr.",
                    name="Dr. Kathiravan",
                    designation="Professor",
                    institution="SRM Ramapuram",
                    branch="Ramapuram",
                    mobile="9876543211",
                    role="user",
                    avatar="DK"
                )
            ]
            db.add_all(users_to_seed)
            db.commit()
            print("[SEED] Successfully seeded default accounts (Chairman, Admin, User).")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Failed to seed default accounts: {e}")
    finally:
        db.close()

seed_default_users()

def sync_user_roles():
    db = SessionLocal()
    try:
        # Kathiravan -> user
        kathir_users = db.query(User).filter(User.name.like("%Kathiravan%")).all()
        for u in kathir_users:
            if u.role != "user":
                u.role = "user"
                print(f"[ROLE SYNC] Updated {u.name} ({u.id}) -> role='user'")

        # Raji -> admin
        raji_users = db.query(User).filter(User.name.like("%Raji%")).all()
        for u in raji_users:
            if u.role != "admin":
                u.role = "admin"
                print(f"[ROLE SYNC] Updated {u.name} ({u.id}) -> role='admin'")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[ROLE SYNC ERROR] {e}")
    finally:
        db.close()

sync_user_roles()

app = FastAPI(
    title="SRM Group of Institutions API",
    description="Backend API for SRM Group of Institutions (Chennai Ramapuram & Trichy) Dashboard Reports & Reviews",
    version="2.0"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(report_router.router)
app.include_router(goal_router.router)
app.include_router(acc_router.router)
app.include_router(pending_router.router)
app.include_router(weekly_router.router)
app.include_router(admin_router.router)
app.include_router(edit_request_router.router)

@app.get("/")
def read_root():
    return {"message": "ReportSync FastAPI Backend is running!"}
