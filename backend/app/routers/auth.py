import hashlib
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core import User, UserRole
from app.schemas.core import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    TokenResponse,
)
from app.services.audit import create_audit_log

router = APIRouter(
    prefix="/auth",
    tags=["Authentication & User Management"]
)


def hash_password(password: str) -> str:
    """Simple deterministic hash for security without external C dependencies."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password or plain_password == hashed_password


# =========================================================
# LOGIN
# =========================================================

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(login_data.email)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    token_string = f"token-user-{user.id}-{user.role.value}-{int(datetime.utcnow().timestamp())}"

    create_audit_log(
        db=db,
        action="USER_LOGIN",
        user_id=user.id,
        details=f"User {user.full_name} ({user.role.value}) logged in"
    )
    db.commit()

    return TokenResponse(
        access_token=token_string,
        token_type="bearer",
        user=user
    )


# =========================================================
# REGISTER USER (Admin functionality: Add Doctor / Nurse / Admin)
# =========================================================

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email.ilike(user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    hashed_pw = hash_password(user_data.password)

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=user_data.role,
        department=user_data.department,
        specialty=user_data.specialty,
        shift=user_data.shift,
        avatar_url=user_data.avatar_url,
        is_active=True,
    )

    db.add(new_user)
    db.flush()

    create_audit_log(
        db=db,
        action="USER_REGISTERED",
        user_id=new_user.id,
        details=f"New {new_user.role.value} created: {new_user.full_name} ({new_user.email})"
    )

    db.commit()
    db.refresh(new_user)

    return new_user


# =========================================================
# GET ALL USERS
# =========================================================

@router.get("/users", response_model=List[UserResponse])
def get_users(
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User)

    if role is not None:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    return query.order_by(User.full_name.asc()).all()


# =========================================================
# GET SINGLE USER
# =========================================================

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# =========================================================
# UPDATE USER (Status toggle / profile edit)
# =========================================================

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, updates: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(user, field, val)

    create_audit_log(
        db=db,
        action="USER_UPDATED",
        user_id=user.id,
        details=f"User {user.full_name} updated: {', '.join(update_data.keys())}"
    )

    db.commit()
    db.refresh(user)

    return user
