import { useEffect, useMemo, useState, type ChangeEvent } from "react";

export function useProfileAvatar(userId?: number) {
  const avatarStorageKey = useMemo(
    () => (userId ? `profile_avatar_${userId}` : null),
    [userId],
  );
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarStorageKey) return;
    const stored = localStorage.getItem(avatarStorageKey);
    setAvatarDataUrl(stored || null);
  }, [avatarStorageKey]);

  const saveAvatar = (value: string) => {
    if (!avatarStorageKey) return;
    localStorage.setItem(avatarStorageKey, value);
    setAvatarDataUrl(value);
  };

  const onAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : "";
      if (!nextValue) return;
      saveAvatar(nextValue);
    };
    reader.readAsDataURL(file);
  };

  return { avatarDataUrl, onAvatarFileChange };
}
