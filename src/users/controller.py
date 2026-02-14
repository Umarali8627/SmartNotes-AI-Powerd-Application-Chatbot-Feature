from src.users.dtos import UserSchema, LoginSchema, ProfileUpdateSchema
from sqlalchemy.orm import Session
from src.users.models import UserModel
from fastapi import HTTPException,status,Request
from pwdlib import PasswordHash
import jwt
from src.utils.settings import settings
from datetime import datetime,timedelta
from jwt.exceptions  import InvalidTokenError


hash_password = PasswordHash.recommended()

def get_password_hash(password):
    return hash_password.hash(password)
def verify_password(plain_password, hashed_password):
    return hash_password.verify(plain_password, hashed_password)


def register(body:UserSchema,db:Session):
    # checks Duplicated username validation
    is_user=db.query(UserModel).filter(UserModel.username==body.username).first()
    if is_user:
        raise HTTPException(status_code=400,detail="Username already exist")
    #email validation 
    is_user=db.query(UserModel).filter(UserModel.email==body.email).first()
    if is_user:
        raise HTTPException(status_code=400,detail="Email Already register")
    # hash the password encryption
    hash_password= get_password_hash(body.password)
    # create the object of new usermodel
    new_user=UserModel(
        name= body.name,
        username=body.username,
        hash_password=hash_password,
        email=body.email
    )
    # store in database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
# login function
def login_user(body:LoginSchema,db:Session):
    is_user=db.query(UserModel).filter(UserModel.username==body.username).first()
    if not is_user:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User not Exit ")
    if not verify_password(body.password,is_user.hash_password):
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="You Enterd Wrong Password")
     # creating expiry token
    exp_time=datetime.now()+timedelta(minutes=settings.EXP_TIME)
     
     # now creating token 
    token=jwt.encode({"_id":is_user.id,"exp":exp_time.timestamp()},settings.SECRET_KEY,settings.ALGORITHM)
    
    return {"token":token}

def is_authenticated(request:Request,db:Session):
    auth_header=request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Token is missing")
    token=auth_header.split(" ")[1]
    try:
        payload=jwt.decode(token,settings.SECRET_KEY,algorithms=[settings.ALGORITHM])
        user_id=payload.get("_id")
        user=db.query(UserModel).filter(UserModel.id==user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User not found")
        return user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid Token")


def update_profile(body: ProfileUpdateSchema, request: Request, db: Session):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing",
        )

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = payload.get("_id")
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        normalized_username = body.username.strip()
        if not normalized_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is required",
            )

        username_taken = (
            db.query(UserModel)
            .filter(
                UserModel.username == normalized_username,
                UserModel.id != user.id,
            )
            .first()
        )
        if username_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exist",
            )

        user.name = body.name.strip() or user.name
        user.username = normalized_username
        db.commit()
        db.refresh(user)
        return user
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
        )
