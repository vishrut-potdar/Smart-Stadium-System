import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card, Icon, PanelHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { translateText, LANGUAGES, type LangCode } from "@/lib/translate.functions";
import { useT, type UiLang } from "@/lib/i18n";

const SAMPLES = [
  "That was a stunning cover drive to the boundary rope!",
  "Please return to your seat. The second half is about to begin.",
  "Gate D is temporarily closed. Please use Gate B or C.",
];

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "Translate · Arena" },
      { name: "description", content: "Every voice, in your language." },
    ],
  }),
  component: TranslatePage,
});

function TranslatePage() {
  const { lang: uiLang, setLang } = useT();
  const [lang, setLangLocal] = useState<LangCode>(
    (uiLang in LANGUAGES ? uiLang : "hi") as LangCode,
  );
  const [text, setText] = useState(SAMPLES[0]);
  const [out, setOut] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const translate = useServerFn(translateText);

  const run = async () => {
    setErr("");
    setOut("");
    setLoading(true);
    try {
      const res = await translate({ data: { text, target: lang } });
      setOut(res.text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PanelHeader
        eyebrow="Language & Transcribe"
        title="Every voice, in your language."
        desc="Live captions of commentary, announcements, and the fan next to you — translated in real time by AI. Set the whole app to this language with one tap."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="flex flex-col items-center py-4 text-center">
            <button
              onClick={() => setListening((v) => !v)}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Start listening"}
              className={cn(
                "grid h-24 w-24 place-items-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                listening
                  ? "bg-accent text-accent-foreground shadow-[0_0_40px_-8px_var(--color-accent)]"
                  : "bg-secondary text-foreground hover:bg-secondary/80",
              )}
            >
              <Icon.Mic className="h-8 w-8" />
            </button>
            <p className="mt-4 text-sm font-medium" aria-live="polite">
              {listening ? "Listening…" : "Tap to transcribe"}
            </p>
            <fieldset className="mt-6 w-full">
              <legend className="sr-only">Target language</legend>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <button
                    key={code}
                    data-testid={`tr-lang-${code}`}
                    onClick={() => setLangLocal(code as LangCode)}
                    aria-pressed={lang === code}
                    className={cn(
                      "pill border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      lang === code
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              data-testid="apply-ui-lang"
              onClick={() => setLang(lang as UiLang)}
              className="mt-4 text-xs font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Use {LANGUAGES[lang]} as UI language
            </button>
          </div>
        </Card>

        <Card>
          <label
            htmlFor="src"
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Source · English
          </label>
          <textarea
            id="src"
            data-testid="translate-input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 800))}
            rows={3}
            className="mt-2 w-full resize-none rounded-2xl border border-border bg-background p-3 text-base leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => setText(s)}
                className="pill border border-border bg-transparent text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s.slice(0, 28)}…
              </button>
            ))}
          </div>
          <button
            data-testid="translate-submit"
            onClick={run}
            disabled={loading || !text.trim()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {loading ? "Translating…" : "Translate"} <Icon.Arrow className="h-4 w-4" />
          </button>
          <div className="my-5 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Translated · {LANGUAGES[lang]}
          </div>
          {err && (
            <p className="mt-2 text-sm text-destructive" role="alert" data-testid="translate-error">
              {err}
            </p>
          )}
          <p
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="mt-2 min-h-[3rem] text-lg font-medium leading-snug text-accent"
            aria-live="polite"
            data-testid="translate-output"
          >
            {out || <span className="text-muted-foreground">Translation appears here.</span>}
          </p>
        </Card>
      </div>
    </>
  );
}
