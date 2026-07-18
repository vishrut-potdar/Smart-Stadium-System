import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Card, Icon, PanelHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { askAssistant } from "@/lib/assistant.functions";
import { useT } from "@/lib/i18n";
import { LANGUAGES, type LangCode } from "@/lib/translate.functions";

const SUGGESTIONS = [
  "Explain the offside rule",
  "Who's the top scorer today?",
  "Explain the VAR decision",
  "How does a 4-3-3 formation work?",
];

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI assistant · Arena" },
      { name: "description", content: "Ask Arena anything about the match." },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hey! I'm Arena, your match assistant. Ask me anything about today's game.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askAssistant);
  const { lang } = useT();
  const apiLang = (lang in LANGUAGES ? lang : "en") as LangCode;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setErr("");
    setInput("");
    const history = messages
      .slice(-10)
      .filter((m) => m.role !== "assistant" || m.content.length < 500);
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await ask({ data: { question: q, history, lang: apiLang } });
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't reach the assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PanelHeader
        eyebrow="AI Match Assistant"
        title="Never miss a moment, or its meaning."
        desc="Ask about a rule, a player, or a decision — Arena explains it instantly, grounded in match context."
      />
      <Card className="flex h-[560px] flex-col p-0">
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto p-6"
          role="log"
          aria-live="polite"
          aria-label="Chat transcript"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start" aria-label="Assistant is typing">
              <div className="rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
          {err && (
            <p className="text-xs text-destructive" role="alert">
              {err}
            </p>
          )}
        </div>
        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="pill border border-border bg-transparent text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 focus-within:ring-2 focus-within:ring-ring/40"
          >
            <label htmlFor="ai-input" className="sr-only">
              Ask a question
            </label>
            <input
              id="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              placeholder="Ask about the match…"
              className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Send message"
            >
              <Icon.Arrow className="h-4 w-4" />
            </button>
          </form>
        </div>
      </Card>
    </>
  );
}
