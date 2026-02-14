from pydantic import BaseModel
from typing import Optional

class ChatMessage(BaseModel):
    query: str
    user_name: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class ChatHistory(BaseModel):
    history: list[ChatMessage]
