import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { api, type Subject } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Loader2,
  Search,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";

const Dashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const { avatarDataUrl } = useProfileAvatar(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const fetchSubjects = async () => {
    try {
      const data = await api.subjects.list();
      setSubjects(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.subjects.create(newTitle.trim());
      setNewTitle("");
      setCreateOpen(false);
      await fetchSubjects();
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editTitle.trim()) return;
    try {
      await api.subjects.update(id, editTitle.trim());
      setEditId(null);
      await fetchSubjects();
    } catch {
      // handle error
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this subject and all notes inside it? This action cannot be undone.",
    );
    if (!confirmed) return;
    try {
      await api.subjects.delete(id);
      await fetchSubjects();
    } catch {
      // handle error
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) =>
      subject.title.toLowerCase().includes(query),
    );
  }, [subjects, search]);

  const initials = useMemo(() => {
    if (!user) return "U";
    return user.name
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ backgroundImage: "var(--gradient-subtle)" }}>
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/75 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Smart Notes</h1>
              <p className="text-xs text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar>
                    <AvatarImage src={avatarDataUrl || undefined} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">@{user.username}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card border-border/60 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Workspace Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Total Subjects</p>
                <p className="font-display text-2xl font-bold">{subjects.length}</p>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Theme</p>
                <p className="font-display text-2xl font-bold capitalize">{theme}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Quick Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subjects..."
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">My Subjects</h2>
            <p className="text-sm text-muted-foreground">
              Showing {filteredSubjects.length} of {subjects.length}
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-accent bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                New Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create Subject</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  placeholder="Subject title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
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
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              {search ? (
                <Search className="h-8 w-8 text-muted-foreground" />
              ) : (
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {search ? "No matching subjects" : "No subjects yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try a different keyword."
                : "Create your first subject to get started."}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredSubjects.map((subject, i) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group border-border/60 shadow-card transition-shadow hover:shadow-soft">
                    <CardContent className="flex items-center justify-between p-5">
                      {editId === subject.id ? (
                        <form
                          className="flex flex-1 gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdate(subject.id);
                          }}
                        >
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus
                            className="flex-1"
                          />
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
                        </form>
                      ) : (
                        <>
                          <div
                            className="flex flex-1 cursor-pointer items-center gap-3"
                            onClick={() => navigate(`/subjects/${subject.id}`)}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                              <BookOpen className="h-5 w-5 text-accent" />
                            </div>
                            <span className="font-display font-semibold text-foreground">
                              {subject.title}
                            </span>
                          </div>
                          <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditId(subject.id);
                                setEditTitle(subject.title);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(subject.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
