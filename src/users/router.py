from src.users.dtos import UserSchema, LoginSchema, UserResponseSchema, ProfileUpdateSchema
from sqlalchemy.orm import Session
from fastapi import APIRouter,Depends,status,Request
from src.utils.db import get_db
from src.users import controller

userrouter=APIRouter(prefix="/users")

@userrouter.post("/register",response_model=UserResponseSchema,status_code=status.HTTP_201_CREATED)
def register(body:UserSchema,db:Session=Depends(get_db)):
    return controller.register(body,db)

@userrouter.post("/login",status_code=status.HTTP_200_OK)
def login(body:LoginSchema,db:Session=Depends(get_db)):
    return controller.login_user(body,db)

@userrouter.get("/is_auth",status_code=status.HTTP_200_OK,response_model=UserResponseSchema)
def is_auth(request:Request,db:Session=Depends(get_db)):
    return controller.is_authenticated(request,db)


@userrouter.put("/profile", status_code=status.HTTP_200_OK, response_model=UserResponseSchema)
def update_profile(body: ProfileUpdateSchema, request: Request, db: Session = Depends(get_db)):
    return controller.update_profile(body, request, db)
