"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Trash2, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorLog } from "@/components/error-log";
import { ChatMessage } from "./chat-message";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const EXAMPLE_QUESTIONS = [
  "What does check A1 mean?",
  "How do I set up Cookiebot with GTM?",
  "What should I fix first?",
  "Explain the difference between page scan and AI checks",
];

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const { addError } = useErrorLog();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pathname = usePathname();

  const siteId = pathname.match(/\/sites\/([^/]+)/)?.[1] ?? undefined;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    setError(null);
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, assistantMsg]);
    setStreaming(true);

    setThinking(false);
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const chatHistory = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, siteId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.thinking) {
              setThinking(true);
              continue;
            }
            if (data.content) {
              setThinking(false);
              fullContent += data.content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullContent } : m))
              );
            }
            if (data.done && data.usage?.totalTokens) {
              setTokenCount((prev) => prev + data.usage.totalTokens);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              throw e;
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out. Try a shorter question.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
        return;
      }
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMsg);
      addError("chat", errorMsg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      clearTimeout(timeout);
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleClear() {
    if (streaming) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setTokenCount(0);
    setError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay for click-outside-to-close */}
      <div className="fixed inset-0 z-40 bg-black/20 sm:block" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l bg-background shadow-xl sm:w-[420px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">GDPR Help</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear} title="Clear chat">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-subtle">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm font-medium">Ask me anything</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  I can help with GDPR checks, scan results, and what to fix.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
              {siteId && (
                <p className="text-[11px] text-muted-foreground">
                  Context: viewing a site audit
                </p>
              )}
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {streaming && messages.at(-1)?.content === "" && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  {thinking && <span className="text-xs text-muted-foreground">Looking up data...</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto shrink-0 underline">dismiss</button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a check, scan result, or how to fix..."
              rows={1}
              className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            />
            <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || streaming} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {tokenCount > 0 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {tokenCount.toLocaleString()} tokens this session
            </p>
          )}
        </div>
      </div>
    </>
  );
}
