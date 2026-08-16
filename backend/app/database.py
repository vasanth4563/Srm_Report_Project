from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import urlparse
from .config import settings

def create_database_if_not_exists():
    try:
        url = settings.DATABASE_URL
        if "postgresql" in url or "postgres" in url:
            parsed = urlparse(url)
            db_name = parsed.path.lstrip('/')
            netloc = parsed.netloc
            scheme = parsed.scheme if parsed.scheme else "postgresql"
            postgres_url = f"{scheme}://{netloc}/postgres"
            
            temp_engine = create_engine(postgres_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
                exists = result.scalar()
                if not exists:
                    conn.execute(text(f"CREATE DATABASE {db_name}"))
                    print(f"PostgreSQL Database '{db_name}' created.")
                else:
                    print(f"PostgreSQL Database '{db_name}' verified.")
            temp_engine.dispose()
        elif "mysql" in url:
            parsed = urlparse(url)
            db_name = parsed.path.lstrip('/')
            server_url = f"{parsed.scheme}://{parsed.netloc}"
            temp_engine = create_engine(server_url)
            with temp_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
                conn.commit()
            temp_engine.dispose()
            print(f"MySQL Database '{db_name}' verified/created.")
    except Exception as e:
        print(f"Warning: Could not check/create database: {e}")

# Run verify/create check
create_database_if_not_exists()

def run_migrations(engine):
    from sqlalchemy import inspect
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        with engine.begin() as conn:
            # 1. users table
            if "users" in existing_tables:
                cols = [c["name"] for c in inspector.get_columns("users")]
                if "title" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN title VARCHAR(20) DEFAULT 'Mr.'"))
                    print("Migration: Added title to users.")
            
            # 2. accomplishments table
            if "accomplishments" in existing_tables:
                cols = [c["name"] for c in inspector.get_columns("accomplishments")]
                if "completed" not in cols:
                    conn.execute(text("ALTER TABLE accomplishments ADD COLUMN completed BOOLEAN DEFAULT TRUE"))
                    print("Migration: Added completed to accomplishments.")

            # 3. pending_works table
            if "pending_works" in existing_tables:
                cols = [c["name"] for c in inspector.get_columns("pending_works")]
                if "completed" not in cols:
                    conn.execute(text("ALTER TABLE pending_works ADD COLUMN completed BOOLEAN DEFAULT FALSE"))
                    print("Migration: Added completed to pending_works.")
                if "status_date" in cols and "status" not in cols:
                    if engine.dialect.name == "postgresql":
                        conn.execute(text("ALTER TABLE pending_works RENAME COLUMN status_date TO status"))
                        conn.execute(text("ALTER TABLE pending_works ALTER COLUMN status TYPE VARCHAR(255)"))
                    else:
                        conn.execute(text("ALTER TABLE pending_works CHANGE COLUMN status_date status VARCHAR(255) NULL"))
                    print("Migration: Renamed status_date to status in pending_works.")
                elif "status" not in cols:
                    conn.execute(text("ALTER TABLE pending_works ADD COLUMN status VARCHAR(255) NULL"))
                    print("Migration: Added status to pending_works.")

            # 4. weekly_plans table
            if "weekly_plans" in existing_tables:
                cols = [c["name"] for c in inspector.get_columns("weekly_plans")]
                if "completed" not in cols:
                    conn.execute(text("ALTER TABLE weekly_plans ADD COLUMN completed BOOLEAN DEFAULT FALSE"))
                    print("Migration: Added completed to weekly_plans.")
                if "date_end" not in cols:
                    conn.execute(text("ALTER TABLE weekly_plans ADD COLUMN date_end DATE NULL"))
                    print("Migration: Added date_end to weekly_plans.")

            # 5. daily_reports table
            if "daily_reports" in existing_tables:
                cols = [c["name"] for c in inspector.get_columns("daily_reports")]
                if "edited_once" not in cols:
                    conn.execute(text("ALTER TABLE daily_reports ADD COLUMN edited_once BOOLEAN DEFAULT FALSE"))
                    print("Migration: Added edited_once to daily_reports.")
    except Exception as e:
        print(f"Warning: Could not run migrations: {e}")

def debug_export_users():
    try:
        from sqlalchemy import create_engine, text
        eng = create_engine(settings.DATABASE_URL)
        with eng.connect() as conn:
            res = conn.execute(text("SELECT id, name, email, role, password_hash FROM users")).fetchall()
            with open(r"c:\Users\vasan\OneDrive\Desktop\Report\backend\db_users_debug.txt", "w", encoding="utf-8") as f:
                f.write(f"Found {len(res)} users:\n")
                for row in res:
                    f.write(f"ID: {row[0]}, Name: {row[1]}, Email: {row[2]}, Role: {row[3]}, Hash: {row[4]}\n")
        eng.dispose()
        print("Exported database users to backend/db_users_debug.txt for verification.")
    except Exception as e:
        with open(r"c:\Users\vasan\OneDrive\Desktop\Report\backend\db_users_debug.txt", "w", encoding="utf-8") as f:
            f.write(f"Failed to export users: {e}\n")

# Run debug export
debug_export_users()


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
