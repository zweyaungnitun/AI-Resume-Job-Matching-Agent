#!/usr/bin/env python3
"""
Setup script to initialize the first admin user.
Run this after database is created.
"""

import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.user import User
from app.services.auth_service import AuthService


def setup_admin():
    """Create or update an admin user"""
    init_db()  # Ensure tables exist

    email = input("Enter admin email: ").strip()
    if not email:
        print("Email required")
        return False

    db = SessionLocal()
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        if user:
            # Make existing user admin
            user.is_admin = True
            db.commit()
            print(f"✓ User {email} upgraded to admin")
        else:
            # Create new admin user
            password = input("Enter password (min 8 chars): ").strip()
            if len(password) < 8:
                print("Password must be at least 8 characters")
                return False

            name = input("Enter name (optional): ").strip() or None

            password_hash = AuthService.hash_password(password)
            user = User(
                email=email,
                name=name,
                password_hash=password_hash,
                auth_method="password",
                is_active=True,
                is_admin=True
            )
            db.add(user)
            db.commit()
            print(f"✓ Admin user created: {email}")

        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def list_admins():
    """List all admin users"""
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.is_admin == True).all()
        if not admins:
            print("No admin users found")
            return

        print("\nAdmin Users:")
        print("-" * 50)
        for admin in admins:
            status = "active" if admin.is_active else "inactive"
            print(f"  {admin.email} ({status})")
            print(f"    Name: {admin.name or 'N/A'}")
            print(f"    Auth: {admin.auth_method}")
            print(f"    Created: {admin.created_at}")
            print()
    finally:
        db.close()


def main():
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "list":
            list_admins()
            return

    print("\n=== Admin User Setup ===\n")
    if setup_admin():
        print("\n✓ Setup complete!\n")
    else:
        print("\n✗ Setup failed\n")


if __name__ == "__main__":
    main()
