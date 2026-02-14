const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface ProfileUpdateData {
  name: string;
  username: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

export interface Subject {
  id: number;
  title: string;
  user_id: number;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  subject_id: number;
}

interface BackendNote {
  id: number;
  title: string;
  content: string;
  subject_id: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }
  if (res.status === 204) return null as T;
  return res.json();
}

function toUiNote(note: BackendNote): Note {
  return {
    id: note.id,
    title: note.title,
    description: note.content || "",
    subject_id: note.subject_id,
  };
}

export const api = {
  auth: {
    register: (data: RegisterData) =>
      fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<User>(r)),

    login: (data: LoginData) =>
      fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<{ token: string }>(r)),

    me: () =>
      fetch(`${API_BASE}/users/is_auth`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<User>(r)),

    updateProfile: (data: ProfileUpdateData) =>
      fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }).then((r) => handleResponse<User>(r)),
  },

  subjects: {
    list: () =>
      fetch(`${API_BASE}/subjects/get`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<Subject[]>(r)),

    get: (id: number) =>
      fetch(`${API_BASE}/subjects/get_subject/${id}`, {
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<Subject>(r)),

    create: (title: string) =>
      fetch(`${API_BASE}/subjects/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title }),
      }).then((r) => handleResponse<Subject>(r)),

    update: (id: number, title: string) =>
      fetch(`${API_BASE}/subjects/update/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title }),
      }).then((r) => handleResponse<Subject>(r)),

    delete: (id: number) =>
      fetch(`${API_BASE}/subjects/delete/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<null>(r)),
  },

  notes: {
    list: (subjectId: number) =>
      fetch(`${API_BASE}/notes/get`, {
        headers: getAuthHeaders(),
      })
        .then((r) => handleResponse<BackendNote[]>(r))
        .then((notes) =>
          notes
            .filter((n) => n.subject_id === subjectId)
            .map((n) => toUiNote(n))
        ),

    create: (data: { title: string; description: string; subject_id: number }) =>
      fetch(`${API_BASE}/notes/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: data.title,
          content: data.description,
          subject_id: data.subject_id,
        }),
      })
        .then((r) => handleResponse<BackendNote>(r))
        .then((note) => toUiNote(note)),

    update: (
      id: number,
      data: { title: string; description: string; subject_id: number }
    ) =>
      fetch(`${API_BASE}/notes/update/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: data.title,
          content: data.description,
          subject_id: data.subject_id,
        }),
      })
        .then((r) => handleResponse<BackendNote>(r))
        .then((note) => toUiNote(note)),

    delete: (id: number) =>
      fetch(`${API_BASE}/notes/delete/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }).then((r) => handleResponse<null>(r)),
  },
};
