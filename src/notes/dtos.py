from pydantic import BaseModel
from datetime import datetime


class NotesSchema(BaseModel):
    title: str
    content: str
    subject_id: int


class NotesResponse(BaseModel):
    id: int
    title: str
    content: str
    subject_id: int
    create_at: datetime
