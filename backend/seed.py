import sys
import os

# Add current directory to python path to import app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base

def init_db():
    print("Verifying database schema...")
    try:
        # Create all tables (if they don't exist)
        Base.metadata.create_all(bind=engine)
        print("Database schema verified and tables created successfully!")
    except Exception as e:
        print("Error initializing database schema:", e)

if __name__ == "__main__":
    init_db()
