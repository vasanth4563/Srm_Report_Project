from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import urlparse
from .config import settings

def create_database_if_not_exists():
    try:
        parsed = urlparse(settings.DATABASE_URL)
        db_name = parsed.path.lstrip('/')
        # Reconstruct connection URL without the database name
        server_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # Connect to MySQL server root
        temp_engine = create_engine(server_url)
        with temp_engine.connect() as conn:
            # Create DB if it doesn't exist
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
            conn.commit()
            
            # Run migrations to add columns if tables exist but lack them
            for table_query, label in [
                (f"ALTER TABLE {db_name}.users ADD COLUMN title VARCHAR(20) DEFAULT 'Mr.'", "title to users"),
                (f"ALTER TABLE {db_name}.accomplishments ADD COLUMN completed TINYINT(1) DEFAULT 1", "completed to accomplishments"),
                (f"ALTER TABLE {db_name}.pending_works ADD COLUMN completed TINYINT(1) DEFAULT 0", "completed to pending_works"),
                (f"ALTER TABLE {db_name}.weekly_plans ADD COLUMN completed TINYINT(1) DEFAULT 0", "completed to weekly_plans"),
                (f"ALTER TABLE {db_name}.weekly_plans ADD COLUMN date_end DATE NULL", "date_end to weekly_plans"),
                (f"ALTER TABLE {db_name}.pending_works MODIFY COLUMN status_date VARCHAR(255) NULL", "modify status_date to VARCHAR(255) in pending_works")
            ]:
                try:
                    conn.execute(text(table_query))
                    conn.commit()
                    print(f"Migration: Added {label}.")
                except Exception:
                    pass
                
        temp_engine.dispose()
        print(f"MySQL Database '{db_name}' verified/created.")
    except Exception as e:
        print(f"Warning: Could not check/create database: {e}")

# Run verify/create check
create_database_if_not_exists()

# Exclusive MySQL connection (SQLite fallback disabled)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
