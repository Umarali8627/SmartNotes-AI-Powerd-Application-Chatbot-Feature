from sqlalchemy import Column,Integer,String,ForeignKey
from sqlalchemy.orm import relationship
from src.utils.db import Base
from datetime import datetime

class SubjectModel(Base):

    __tablename__="Subject"
    
    id =Column(Integer,primary_key=True)
    title=Column(String,nullable=False,unique=True)
    user_id= Column(Integer,ForeignKey("Users.id"))

    owner= relationship("UserModel",back_populates="subjects")
    notes= relationship("NotesModel",back_populates="subject",cascade="all,delete-orphan")
