import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Subject, type Note } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Loader2,
  FileText,
  StickyNote,
  Search,
  Eye,
} from "lucide-react";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => inlineMarkdown(cell.trim()));
}

function isTableSeparatorLine(line: string): boolean {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  if (!cells.length) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderNoteMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown || "").split(/\r?\n/);
  let html = "";
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
    if (inOl) {
      html += "</ol>";
      inOl = false;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      closeLists();
      html += '<div class="h-2"></div>';
      continue;
    }

    const nextLine = lines[i + 1]?.trim() ?? "";
    if (trimmed.includes("|") && nextLine.includes("|") && isTableSeparatorLine(nextLine)) {
      closeLists();
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length) {
        const rowLine = lines[i].trim();
        if (!rowLine || !rowLine.includes("|")) break;
        rows.push(splitTableRow(rowLine));
        i += 1;
      }
      i -= 1;

      html += '<div class="my-3 overflow-x-auto rounded-lg border border-border/60">';
      html += '<table class="w-full border-collapse text-left text-sm">';
      html += '<thead><tr class="bg-muted/40 border-b border-border/60">';
      headers.forEach((header) => {
        html += `<th class="px-3 py-2 font-semibold">${header}</th>`;
      });
      html += "</tr></thead><tbody>";
      rows.forEach((cells) => {
        html += '<tr class="border-b border-border/40">';
        cells.forEach((cell) => {
          html += `<td class="px-3 py-2 align-top">${cell}</td>`;
        });
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      continue;
    }

    const h1 = trimmed.match(/^#\s+(.+)/);
    const h2 = trimmed.match(/^##\s+(.+)/);
    const h3 = trimmed.match(/^###\s+(.+)/);
    const ul = trimmed.match(/^[-*]\s+(.+)/);
    const ol = trimmed.match(/^\d+\.\s+(.+)/);

    if (h3) {
      closeLists();
      html += `<h3 class="mb-2 mt-4 text-base font-semibold">${inlineMarkdown(h3[1])}</h3>`;
      continue;
    }
    if (h2) {
      closeLists();
      html += `<h2 class="mb-2 mt-4 text-lg font-semibold">${inlineMarkdown(h2[1])}</h2>`;
      continue;
    }
    if (h1) {
      closeLists();
      html += `<h1 class="mb-2 mt-4 text-xl font-bold">${inlineMarkdown(h1[1])}</h1>`;
      continue;
    }
    if (ul) {
      if (inOl) {
        html += "</ol>";
        inOl = false;
      }
      if (!inUl) {
        html += '<ul class="my-2 list-disc pl-5">';
        inUl = true;
      }
      html += `<li class="mb-1">${inlineMarkdown(ul[1])}</li>`;
      continue;
    }
    if (ol) {
      if (inUl) {
        html += "</ul>";
        inUl = false;
      }
      if (!inOl) {
        html += '<ol class="my-2 list-decimal pl-5">';
        inOl = true;
      }
      html += `<li class="mb-1">${inlineMarkdown(ol[1])}</li>`;
      continue;
    }

    closeLists();
    html += `<p class="mb-3 leading-relaxed">${inlineMarkdown(trimmed)}</p>`;
  }

  closeLists();
  return html || '<p class="text-muted-foreground">No content available.</p>';
}

const SubjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", description: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState({ title: "", description: "" });
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteViewOpen, setNoteViewOpen] = useState(false);

  const subjectId = Number(id);

  const fetchData = async () => {
    try {
      const [subjectData, notesData] = await Promise.all([
        api.subjects.get(subjectId),
        api.notes.list(subjectId),
      ]);
      setSubject(subjectData);
      setNotes(notesData);
    } catch {
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (!id || Number.isNaN(subjectId)) {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [subjectId, authLoading, user, navigate, id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    setCreating(true);
    try {
      await api.notes.create({
        title: newNote.title.trim(),
        description: newNote.description.trim(),
        subject_id: subjectId,
      });
      setNewNote({ title: "", description: "" });
      setCreateOpen(false);
      await fetchData();
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (noteId: number) => {
    if (!editNote.title.trim()) return;
    try {
      await api.notes.update(noteId, {
        title: editNote.title.trim(),
        description: editNote.description.trim(),
        subject_id: subjectId,
      });
      setEditId(null);
      await fetchData();
    } catch {
      // handle error
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await api.notes.delete(noteId);
      await fetchData();
    } catch {
      // handle error
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredNotes = useMemo(() => {
    const query = noteSearch.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) => {
      const title = note.title.toLowerCase();
      const description = (note.description || "").toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [notes, noteSearch]);

  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Smart Notes</h1>
              <p className="text-xs text-muted-foreground">Welcome, {user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back + Title */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subjects
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {subject?.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredNotes.length} of {notes.length} note{notes.length !== 1 ? "s" : ""}
              </p>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-accent bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Create Note</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Title</Label>
                    <Input
                      id="note-title"
                      placeholder="Note title..."
                      value={newNote.title}
                      onChange={(e) => setNewNote((n) => ({ ...n, title: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-desc">Description</Label>
                    <Textarea
                      id="note-desc"
                      placeholder="Write your note content..."
                      value={newNote.description}
                      onChange={(e) => setNewNote((n) => ({ ...n, description: e.target.value }))}
                      rows={5}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={creating}
                  >
                    {creating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Note
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              placeholder="Search notes by title or content..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              {noteSearch ? (
                <Search className="h-8 w-8 text-muted-foreground" />
              ) : (
                <StickyNote className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {noteSearch ? "No matching notes" : "No notes yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {noteSearch
                ? "Try a different search term."
                : "Create your first note for this subject"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {editId === note.id ? (
                    <Card className="shadow-card border-border/60">
                      <CardContent className="p-5">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdate(note.id);
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={editNote.title}
                              onChange={(e) =>
                                setEditNote((n) => ({ ...n, title: e.target.value }))
                              }
                              autoFocus
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={editNote.description}
                              onChange={(e) =>
                                setEditNote((n) => ({ ...n, description: e.target.value }))
                              }
                              rows={5}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" variant="secondary">
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card
                      className="group cursor-pointer shadow-card border-border/60 transition-shadow hover:shadow-soft"
                      onClick={() => {
                        setSelectedNote(note);
                        setNoteViewOpen(true);
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                              <FileText className="h-4 w-4 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display font-semibold text-foreground">
                                {note.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {note.description || "No description"}
                              </p>
                              <div className="mt-2 inline-flex items-center gap-1 text-xs text-accent">
                                <Eye className="h-3.5 w-3.5" />
                                Open note
                              </div>
                            </div>
                          </div>
                          <div
                            className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0 ml-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditId(note.id);
                                setEditNote({
                                  title: note.title,
                                  description: note.description,
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={noteViewOpen} onOpenChange={setNoteViewOpen}>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
            <DialogHeader className="border-b border-border/60 px-6 py-4">
              <DialogTitle className="font-display text-xl">
                {selectedNote?.title || "Note"}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div
                className="text-sm text-foreground"
                dangerouslySetInnerHTML={{
                  __html: renderNoteMarkdown(selectedNote?.description || ""),
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SubjectDetail;
