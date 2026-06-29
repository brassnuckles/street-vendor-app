#!/usr/bin/env python
"""Database migration management script"""

import sys
import os
from alembic.config import Config
from alembic import command
from app.database import engine, Base
from app.config import settings

def init_db():
    """Create all tables using SQLAlchemy (for development)"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")

def migrate_up():
    """Run all pending migrations"""
    print("Running pending migrations...")
    config = Config("alembic.ini")
    command.upgrade(config, "head")
    print("✓ Migrations completed successfully")

def migrate_down(revision: str = "-1"):
    """Rollback to a specific revision"""
    print(f"Rolling back to {revision}...")
    config = Config("alembic.ini")
    command.downgrade(config, revision)
    print(f"✓ Rolled back to {revision}")

def create_migration(message: str):
    """Create a new migration"""
    print(f"Creating migration: {message}")
    config = Config("alembic.ini")
    command.revision(config, autogenerate=True, message=message)
    print("✓ Migration created successfully")

def show_current():
    """Show current migration status"""
    print("Checking migration status...")
    config = Config("alembic.ini")
    try:
        command.current(config)
    except Exception as e:
        print(f"No migrations applied yet: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("""
Database Management Script

Usage: python manage_db.py [command]

Commands:
  init          Create all tables (development only)
  migrate       Run pending migrations
  rollback N    Rollback N migrations (default: -1)
  create MSG    Create a new migration with message
  status        Show current migration status

Examples:
  python manage_db.py init
  python manage_db.py migrate
  python manage_db.py rollback -1
  python manage_db.py create "Add user ratings"
        """)
        sys.exit(1)

    command = sys.argv[1]

    if command == "init":
        init_db()
    elif command == "migrate":
        migrate_up()
    elif command == "rollback":
        revision = sys.argv[2] if len(sys.argv) > 2 else "-1"
        migrate_down(revision)
    elif command == "create":
        message = sys.argv[2] if len(sys.argv) > 2 else "Auto migration"
        create_migration(message)
    elif command == "status":
        show_current()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
