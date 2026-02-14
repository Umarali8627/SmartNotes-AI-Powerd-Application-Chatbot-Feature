from sqlalchemy import Column,Integer,String,DateTime
from src.utils.db import Base
from datetime import datetime
from sqlalchemy.orm import relationship

class UserModel(Base):
    __tablename__="Users"

    id=Column(Integer,primary_key=True)
    name=Column(String,nullable=False)
    username=Column(String,nullable=False)
    hash_password=Column(String)
    email=Column(String,unique=True)
    timestamp=Column(DateTime,default=datetime.now())

    subjects = relationship("SubjectModel",back_populates="owner",cascade="all,delete-orphan")
