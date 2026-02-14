from fastapi import APIRouter, HTTPException, status
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from src.chatbot.dtos import ChatMessage, ChatResponse
from src.utils.settings import settings

chat_router = APIRouter(prefix="/chatbot")

llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY, temperature=0.7,max_tokens=500)

prompt = """
You are Smart Notes Assistant for students.

Student name: {user_name}
Requested question: {question}

Your task:
1. Start with a short greeting to the student using their name.
2. Write clear, exam-oriented notes.
3. Keep explanations step-by-step and practical.
4. Include real-world examples.
5. End with short Q&A revision points.

Formatting rules (strict):
- Respond in Markdown.
- Use headings: `#`, `##`, `###`
- Use short paragraphs.
- Use bullet points where useful.
- Use **bold** only for important terms.
- Keep language simple and concise.
"""

template = PromptTemplate(
    input_variables=["question", "user_name"],
    template=prompt,
)
parser = StrOutputParser()
chain = template | llm | parser


def generate_notes(question: str, user_name: str) -> str:
    return chain.invoke({"question": question, "user_name": user_name})


@chat_router.post(
    "/generate",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
def generate_chat_response(body: ChatMessage):
    try:
        user_name = body.user_name.strip() if body.user_name else "Student"
        response = generate_notes(body.query, user_name)
        return {"response": response}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot failed: {exc}",
        )
