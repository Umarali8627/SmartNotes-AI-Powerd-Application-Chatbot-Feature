from src.subject.dtos import SubjectSchema
from sqlalchemy.orm import Session
from src.utils.db import get_db
from src.subject.models import SubjectModel
from src.users.models import UserModel
from fastapi import HTTPException,status


def create_subject(body:SubjectSchema,db:Session,current_user:UserModel):

    data= body.model_dump()
    new_subject= SubjectModel(
        title= data["title"],
        user_id= current_user.id
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    return new_subject

def get_subjects(db:Session,current_user:UserModel):
    subjects= db.query(SubjectModel).filter(SubjectModel.user_id==current_user.id).all()
    return subjects

def get_subjectbyId(id:int,db:Session,current_user:UserModel):
    subject= db.query(SubjectModel).filter(SubjectModel.id==id,SubjectModel.user_id==current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Subject not Found")
    return subject

def updateSubject(id:int,body:SubjectSchema,db:Session,current_user:UserModel):
    subject=db.query(SubjectModel).filter(SubjectModel.id==id,SubjectModel.user_id==current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Subject not Found")
    body=body.model_dump()
    for field,value in body.items():
        setattr(subject,field,value)

    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

def delete_subject(id:int,db:Session,current_user:UserModel):
    subject=db.query(SubjectModel).filter(SubjectModel.id==id,SubjectModel.user_id==current_user.id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Subject not Found")
    db.delete(subject)
    db.commit()

    return None
    
