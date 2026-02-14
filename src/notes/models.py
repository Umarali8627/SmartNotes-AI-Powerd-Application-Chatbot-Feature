from sqlalchemy import Column,Integer,String ,DateTime ,ForeignKey,Text
from src.utils.db import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class NotesModel(Base):
    __tablename__="Notes"

    id =Column(Integer,primary_key=True)
    title=Column(String,nullable=False)
    content=Column(Text)
    create_at=Column(DateTime,default=datetime.now())

    subject_id= Column(Integer,ForeignKey("Subject.id"))

    subject= relationship("SubjectModel",back_populates="notes")


