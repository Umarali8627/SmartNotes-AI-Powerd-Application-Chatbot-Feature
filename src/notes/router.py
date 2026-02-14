from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from typing import List

from src.notes import controller
from src.notes.dtos import NotesSchema, NotesResponse
from src.users import controller as user_controller
from src.users.models import UserModel
from src.utils.db import get_db


notes_routes = APIRouter(prefix="/notes")


def get_current_user(request: Request, db: Session = Depends(get_db)):
    return user_controller.is_authenticated(request, db)


@notes_routes.post("/create", response_model=NotesResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    body: NotesSchema,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return controller.create_note(body, db, current_user)


@notes_routes.get("/get", response_model=List[NotesResponse], status_code=status.HTTP_200_OK)
def get_notes(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return controller.get_notes(db, current_user)


@notes_routes.get("/get_note/{id}", response_model=NotesResponse, status_code=status.HTTP_200_OK)
def get_noteById(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return controller.get_notebyId(id, db, current_user)


@notes_routes.put("/update/{id}", response_model=NotesResponse, status_code=status.HTTP_201_CREATED)
def update_note(
    id: int,
    body: NotesSchema,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return controller.update_note(id, body, db, current_user)


@notes_routes.delete("/delete/{id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return controller.delete_note(id, db, current_user)
