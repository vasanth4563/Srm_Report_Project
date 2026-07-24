import os
from sqlalchemy import create_engine, text
from urllib.parse import urlparse
import bcrypt
from app.config import settings

# Connect
engine = create_engine(settings.DATABASE_URL)
try:
    with engine.connect() as conn:
        print("Connected to DB successfully.")
        res = conn.execute(text("SELECT id, email, password_hash, role FROM users WHERE email='kathiravan@srmist.edu.in'")).fetchone()
        if res:
            print("Found User:")
            print("  ID:", res[0])
            print("  Email:", res[1])
            print("  Hash:", res[2])
            print("  Role:", res[3])
            
            # Check bcrypt verification
            plain = "SRM@1234"
            try:
                ok = bcrypt.checkpw(plain.encode('utf-8'), res[2].encode('utf-8'))
                print(f"Bcrypt verification for '{plain}':", ok)
            except Exception as e:
                print("Bcrypt check failed with error:", e)
        else:
            print("User 'kathiravan@srmist.edu.in' NOT found in database!")
except Exception as e:
    print("Database connection error:", e)
