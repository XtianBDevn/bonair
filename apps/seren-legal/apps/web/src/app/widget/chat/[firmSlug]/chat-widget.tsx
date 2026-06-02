"use client";

import { FormEvent, useRef, useState } from "react";
import { Send, Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "bot" | "user"; content: string };

export function ChatWidget({
  firmSlug,
  firmName,
}: {
  firmSlug: string;
  firmName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function sendMessage(text: string, showUser = true) {
    if (showUser) {
      setMessages((m) => [...m, { role: "user", content: text }]);
      scrollDown();
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/widget/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmSlug,
          sessionId: sessionId ?? undefined,
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSessionId(data.sessionId);
      setMessages((m) => [...m, { role: "bot", content: data.reply }]);
      if (data.complete) setSubmitted(true);
      scrollDown();
    } catch {
      setError("Unable to reach intake service");
    } finally {
      setLoading(false);
    }
  }

  async function startChat() {
    setStarted(true);
    await sendMessage("I'd like help with a legal matter.");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || submitted || loading) return;

    const userMsg = input.trim();
    setInput("");
    if (!started) setStarted(true);
    await sendMessage(userMsg);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col p-4">
      <div className="mb-4 flex items-center gap-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{firmName}</p>
          <p className="text-xs text-indigo-200">Secure intake · Powered by Seren Legal</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-white shadow-xl">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 min-h-[320px]">
          {messages.length === 0 && !started && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
              <p className="mb-4">Start a confidential intake conversation.</p>
              <Button type="button" onClick={startChat} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Begin intake"}
              </Button>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-500">
                Typing…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-200 p-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={submitted ? "Intake complete" : "Type your message…"}
            disabled={submitted || loading || !started}
            className="flex-1"
            aria-label="Message"
          />
          <Button type="submit" disabled={submitted || loading || !input.trim() || !started} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
