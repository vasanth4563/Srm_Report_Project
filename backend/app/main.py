from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import User
from .routers import auth_router, report_router, goal_router, acc_router, pending_router, weekly_router, admin_router

# Initialize tables
Base.metadata.create_all(bind=engine)

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

@app.get("/")
def read_root():
    return {"message": "ReportSync FastAPI Backend is running!"}
