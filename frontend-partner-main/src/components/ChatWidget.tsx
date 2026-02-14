import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

function renderAssistantMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown).split(/\r?\n/);
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

      html += '<div class="my-2 overflow-x-auto">';
      html += '<table class="w-full border-collapse text-left text-xs">';
      html += '<thead><tr class="border-b border-border/60">';
      headers.forEach((header) => {
        html += `<th class="px-2 py-1 font-semibold">${header}</th>`;
      });
      html += "</tr></thead><tbody>";
      rows.forEach((cells) => {
        html += '<tr class="border-b border-border/40">';
        cells.forEach((cell) => {
          html += `<td class="px-2 py-1 align-top">${cell}</td>`;
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
      html += `<h3 class="mt-3 mb-1 text-sm font-semibold">${inlineMarkdown(h3[1])}</h3>`;
      continue;
    }
    if (h2) {
      closeLists();
      html += `<h2 class="mt-3 mb-1 text-base font-semibold">${inlineMarkdown(h2[1])}</h2>`;
      continue;
    }
    if (h1) {
      closeLists();
      html += `<h1 class="mt-3 mb-1 text-lg font-bold">${inlineMarkdown(h1[1])}</h1>`;
      continue;
    }
    if (ul) {
      if (inOl) {
        html += "</ol>";
        inOl = false;
      }
      if (!inUl) {
        html += '<ul class="my-1 list-disc pl-5">';
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
        html += '<ol class="my-1 list-decimal pl-5">';
        inOl = true;
      }
      html += `<li class="mb-1">${inlineMarkdown(ol[1])}</li>`;
      continue;
    }

    closeLists();
    html += `<p class="mb-2 leading-relaxed">${inlineMarkdown(trimmed)}</p>`;
  }

  closeLists();
  return html;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const starterMessage = user
    ? `Hi ${user.name}, I am Smart Notes Assistant. Ask me to generate study notes on any topic.`
    : "Hi, I am Smart Notes Assistant. Ask me to generate study notes on any topic.";
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: starterMessage },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [{ id: 1, role: "assistant", text: starterMessage }];
      }
      return prev;
    });
  }, [starterMessage]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/chatbot/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, user_name: user?.name ?? "Student" }),
      });

      if (!res.ok) {
        throw new Error("Failed to get chatbot response");
      }

      const data: { response: string } = await res.json();
      const assistantReply: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.response || "No response from assistant.",
      };
      setMessages((prev) => [...prev, assistantReply]);
    } catch {
      const assistantReply: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: "Chatbot is unavailable right now. Please try again.",
      };
      setMessages((prev) => [...prev, assistantReply]);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedMessageId(id);
    window.setTimeout(() => {
      setCopiedMessageId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[350px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/70 bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Smart Notes Assistant</p>
              <p className="text-xs text-muted-foreground">AI notes generator</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-72 px-4 py-3">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "ml-auto bg-accent text-accent-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="relative pr-9">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-0 top-0 h-7 w-7"
                        onClick={() => handleCopy(message.id, message.text)}
                        aria-label="Copy assistant response"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <div
                        className="chat-md"
                        dangerouslySetInnerHTML={{
                          __html: renderAssistantMarkdown(message.text),
                        }}
                      />
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 border-t border-border/70 p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button size="icon" onClick={sendMessage} disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Button
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
