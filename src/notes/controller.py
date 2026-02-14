from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.notes.dtos import NotesSchema
from src.notes.models import NotesModel
from src.subject.models import SubjectModel
from src.users.models import UserModel


def create_note(body: NotesSchema, db: Session, current_user: UserModel):
    subject = (
        db.query(SubjectModel)
        .filter(SubjectModel.id == body.subject_id, SubjectModel.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not Found")

    new_note = NotesModel(
        title=body.title,
        content=body.content,
        subject_id=body.subject_id,
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


def get_notes(db: Session, current_user: UserModel):
    notes = (
        db.query(NotesModel)
        .join(SubjectModel, NotesModel.subject_id == SubjectModel.id)
        .filter(SubjectModel.user_id == current_user.id)
        .all()
    )
    return notes


def get_notebyId(id: int, db: Session, current_user: UserModel):
    note = (
        db.query(NotesModel)
        .join(SubjectModel, NotesModel.subject_id == SubjectModel.id)
        .filter(NotesModel.id == id, SubjectModel.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not Found")
    return note


def update_note(id: int, body: NotesSchema, db: Session, current_user: UserModel):
    note = (
        db.query(NotesModel)
        .join(SubjectModel, NotesModel.subject_id == SubjectModel.id)
        .filter(NotesModel.id == id, SubjectModel.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not Found")

    subject = (
        db.query(SubjectModel)
        .filter(SubjectModel.id == body.subject_id, SubjectModel.user_id == current_user.id)
        .first()
    )
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not Found")

    data = body.model_dump()
    for field, value in data.items():
        setattr(note, field, value)

    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def delete_note(id: int, db: Session, current_user: UserModel):
    note = (
        db.query(NotesModel)
        .join(SubjectModel, NotesModel.subject_id == SubjectModel.id)
        .filter(NotesModel.id == id, SubjectModel.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not Found")

    db.delete(note)
    db.commit()
    return None
