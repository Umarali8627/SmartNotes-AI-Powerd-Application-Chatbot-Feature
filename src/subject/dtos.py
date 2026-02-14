from pydantic import BaseModel

class SubjectSchema(BaseModel):
    title:str
    # user_id:int
class SubjectResponse(BaseModel):
    id:int
    title:str
    user_id:int
    
