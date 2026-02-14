import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Moon, Pencil, Sun } from "lucide-react";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Failed to update profile";
}

const Profile = () => {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { avatarDataUrl, onAvatarFileChange } = useProfileAvatar(user?.id);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({ name: "", username: "" });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      setProfileForm({ name: user.name, username: user.username });
    }
  }, [authLoading, user, navigate]);

  const initials = useMemo(() => {
    if (!user) return "U";
    return user.name
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.username.trim()) {
      setError("Name and username are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const updated = await api.auth.updateProfile({
        name: profileForm.name.trim(),
        username: profileForm.username.trim(),
      });
      updateUser(updated);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-5">
              {error ? (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarDataUrl || undefined} alt={user.name} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="text-sm">
                    Profile Image
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={onAvatarFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Image is stored locally for this browser.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
