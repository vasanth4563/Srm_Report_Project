import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User

db = SessionLocal()

try:
    print("--- Searching users in database ---")
    all_users = db.query(User).all()
    for u in all_users:
        print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Role: {u.role}")

    # Update Kathiravan -> user
    kathir_users = db.query(User).filter(User.name.like("%Kathiravan%")).all()
    for u in kathir_users:
        u.role = "user"
        print(f"[UPDATED] {u.name} role changed to 'user'")

    # Update Raji -> admin
    raji_users = db.query(User).filter(User.name.like("%Raji%")).all()
    for u in raji_users:
        u.role = "admin"
        print(f"[UPDATED] {u.name} role changed to 'admin'")

    db.commit()
    print("--- Changes committed successfully ---")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
