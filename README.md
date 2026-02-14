# SmartNotes AI Powered Application (Chatbot Feature)

SmartNotes is a full-stack notes management platform for students. It combines structured subject/note organization with an AI assistant that generates exam-oriented study notes in Markdown.

## Core Features

- User authentication with JWT-based sessions
- User registration and login
- Profile update (name and username)
- Subject management per user (create, list, update, delete)
- Note management per subject (create, list, update, delete)
- Ownership-based access control (users can only access their own subjects/notes)
- AI chatbot endpoint to generate structured, student-friendly notes
- Responsive React frontend with dashboard, search, and note detail dialogs
- Theme toggle (light/dark)
- Frontend chat widget integrated across app routes

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy ORM
- PostgreSQL
- Pydantic / pydantic-settings
- JWT (`pyjwt`) for token auth
- `pwdlib` for password hashing
- LangChain + Groq (`langchain-groq`) for AI note generation

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- React Router
- React Query
- Framer Motion

## Project Structure

```text
.
|- main.py                     # FastAPI app entrypoint
|- src/
|  |- users/                   # auth + profile modules
|  |- subject/                 # subject CRUD modules
|  |- notes/                   # note CRUD modules
|  |- chatbot/                 # AI generation endpoint
|  |- utils/                   # db/session/settings helpers
|- frontend-partner-main/      # React frontend app
|- .env                        # local runtime secrets (do not commit)
```

## Architecture Overview

1. Frontend authenticates user via `/users/login` and stores JWT in `localStorage`.
2. Protected API calls include `Authorization: Bearer <token>`.
3. Backend validates token and resolves current user.
4. Subject and note operations are filtered by authenticated user ID.
5. Chat widget sends prompts to `/chatbot/generate` and displays Markdown response.

## API Endpoints

### Auth / Users

- `POST /users/register` - create account
- `POST /users/login` - login and return JWT token
- `GET /users/is_auth` - validate token and fetch current user
- `PUT /users/profile` - update profile details

### Subjects

- `POST /subjects/create` - create subject
- `GET /subjects/get` - list current user subjects
- `GET /subjects/get_subject/{id}` - get subject by id
- `PUT /subjects/update/{id}` - update subject
- `DELETE /subjects/delete/{id}` - delete subject

### Notes

- `POST /notes/create` - create note in a subject
- `GET /notes/get` - list current user notes
- `GET /notes/get_note/{id}` - get note by id
- `PUT /notes/update/{id}` - update note
- `DELETE /notes/delete/{id}` - delete note

### AI Chatbot

- `POST /chatbot/generate` - generate structured study notes from a question

Request body example:

```json
{
  "query": "Explain quick sort with example",
  "user_name": "Umar"
}
```

## Local Setup

### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally

### 2. Backend Setup

From project root:

```bash
python -m venv env
# Windows PowerShell
.\env\Scripts\Activate.ps1

pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings pyjwt pwdlib langchain-core langchain-groq psycopg2-binary
```

Create `.env` in project root:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db_name>
EXP_TIME=30
ALGORITHM=HS256
SECRET_KEY=<your_secret_key>
GROQ_API_KEY=<your_groq_api_key>
```

Run backend:

```bash
uvicorn main:app --reload
```

Backend default URL: `http://127.0.0.1:8000`

### 3. Frontend Setup

```bash
cd frontend-partner-main
npm install
```

Optional frontend env (`frontend-partner-main/.env`):

```env
VITE_API_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
npm run dev
```

Frontend default URL: `http://127.0.0.1:5173`

## Usage Flow

1. Register a new account.
2. Login to get authenticated.
3. Create subjects.
4. Create and manage notes under each subject.
5. Use the chatbot widget to generate exam-focused notes and paste/refine in your notes.

## Security Notes

- `.env` is intentionally ignored via `.gitignore`.
- Never commit real API keys or production secrets.
- For production, use HTTPS, stronger token policies, and secure secret management.

## Current Repository Notes

- Root `requirements.txt` is currently empty. Dependency installation is shown above.
- Frontend includes its own package configuration in `frontend-partner-main/package.json`.

## Future Improvements

- Refresh tokens and logout invalidation
- Role-based permissions
- Unit/integration tests for API modules
- Dockerized deployment for backend + frontend + database
- Better API validation and centralized error handling

