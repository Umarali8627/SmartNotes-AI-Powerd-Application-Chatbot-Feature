from fastapi import APIRouter,Depends,status,Request
from src.utils.db import get_db
from src.subject.dtos import SubjectSchema,SubjectResponse
from src.subject import controller
from src.users import controller as user_controller
from src.utils.db import get_db
from sqlalchemy.orm import Session
from src.users.models import UserModel
from typing import List 

subject_routes=APIRouter(prefix="/subjects")

def get_current_user(request:Request,db:Session=Depends(get_db)):
    return user_controller.is_authenticated(request,db)


@subject_routes.post("/create",response_model=SubjectResponse,status_code=status.HTTP_201_CREATED)
def create_notes(body:SubjectSchema,db:Session=Depends(get_db),current_user:UserModel=Depends(get_current_user)):
    return controller.create_subject(body,db,current_user)

@subject_routes.get("/get",response_model=List[SubjectResponse],status_code=status.HTTP_200_OK)
def get_subeject(db:Session=Depends(get_db),current_user:UserModel=Depends(get_current_user)):
    return controller.get_subjects(db,current_user)


@subject_routes.get("/get_subject/{id}",response_model=SubjectResponse,status_code=status.HTTP_200_OK)
def get_subjectbyId(id:int,db:Session=Depends(get_db),current_user:UserModel=Depends(get_current_user)):
    return controller.get_subjectbyId(id,db,current_user)
@subject_routes.put("/update/{id}",response_model=SubjectResponse,status_code=status.HTTP_201_CREATED)
def update_subject(id:int,body:SubjectSchema,db:Session=Depends(get_db),current_user:UserModel=Depends(get_current_user)):
    return controller.updateSubject(id,body,db,current_user)
@subject_routes.delete("/delete/{id}",response_model=None,status_code=status.HTTP_204_NO_CONTENT)
def deletesubject(id:int,db:Session=Depends(get_db),current_user:UserModel=Depends(get_current_user)):
    return controller.delete_subject(id,db,current_user)