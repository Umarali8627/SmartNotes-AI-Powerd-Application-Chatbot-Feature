from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base
from src.utils.settings import settings

# creating the engine
engine = create_engine(settings.DATABASE_URL)
# create the session 
SessionLocal= sessionmaker(bind=engine)

def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
Base=declarative_base()