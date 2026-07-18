import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FEATURES, Icon } from "./icons";
import { UI_LANGUAGES, useT, type UiLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { TrafficBanner } from "./TrafficBanner";

function AuthStatusPill() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setEmail(session?.user?.email ?? null);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
  if (!email) {
    return (
      <Link
        data-testid="header-signin"
        to="/auth"
        className="pill inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
      >
        Sign in
      </Link>
    );
  }
  return (
    <div className="relative">
      <button
        data-testid="header-account"
        onClick={() => setOpen((v) => !v)}
        className="pill inline-flex items-center gap-1.5 bg-secondary text-foreground hover:bg-secondary/80"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">
          {email[0]?.toUpperCase()}
        </span>
        <span className="hidden sm:inline text-[11px] font-medium">{email.split("@")[0]}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-border bg-surface-elevated p-2 shadow-[var(--shadow-elevated)]"
          >
            <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              {email}
            </p>
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm hover:bg-secondary/60"
            >
              Admin console
            </Link>
            <button
              data-testid="header-signout"
              onClick={async () => {
                await supabase.auth.signOut();
                setOpen(false);
                navigate({ to: "/", replace: true });
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary/60"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { dir } = useT();
  return (
    <div className="min-h-dvh bg-background text-foreground" dir={dir}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <TrafficBanner />
      <TopBar />
      <TabBar current={pathname} />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

function TopBar() {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 pt-3">
      <div className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-2.5">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
            <span className="text-[11px] font-semibold tracking-tight">A</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">Arena</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {t("Live")} · Sec 214 · Row F
          </span>
          <div className="relative">
            <button
              data-testid="lang-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-label="Change language"
              aria-expanded={open}
              className="pill inline-flex items-center gap-1.5 bg-secondary text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon.Language className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium uppercase">{lang}</span>
            </button>
            {open && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  aria-hidden
                  onClick={() => setOpen(false)}
                />
                <div
                  role="menu"
                  data-testid="lang-menu"
                  className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-[var(--shadow-elevated)]"
                >
                  {(Object.keys(UI_LANGUAGES) as UiLang[]).map((code) => (
                    <button
                      key={code}
                      role="menuitemradio"
                      aria-checked={lang === code}
                      data-testid={`lang-${code}`}
                      onClick={() => {
                        setLang(code);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        lang === code ? "bg-secondary font-medium" : "hover:bg-secondary/60",
                      )}
                    >
                      <span>{UI_LANGUAGES[code]}</span>
                      {lang === code && <Icon.Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <AuthStatusPill />
        </div>
      </div>
    </header>
  );
}

function TabBar({ current }: { current: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const { t } = useT();

  const onKey = (e: React.KeyboardEvent<HTMLAnchorElement>, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("[role=tab]");
    if (!links) return;
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = links[(idx + dir + links.length) % links.length];
    next?.focus();
  };

  return (
    <nav aria-label="Features" className="sticky top-16 z-30 mx-auto max-w-6xl px-4 pt-3 sm:px-6">
      <div
        ref={listRef}
        role="tablist"
        className="glass flex gap-1 overflow-x-auto rounded-full p-1.5"
      >
        {FEATURES.map((f, i) => {
          const active = f.to === "/" ? current === "/" : current.startsWith(f.to);
          const IconCmp = f.icon;
          return (
            <Link
              key={f.id}
              to={f.to}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "group inline-flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <IconCmp className="h-4 w-4" />
              <span>{t(f.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Shared UI primitives ---------- */

export function PanelHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <div className="pill inline-flex bg-secondary text-muted-foreground">{eyebrow}</div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{desc}</p>
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
}) {
  return (
    <Tag
      className={cn(
        "rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-glass)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function LiveDot({ label }: { label?: string }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      {label ?? t("Live")}
    </span>
  );
}

export function TransportBadge({ transport }: { transport: "ws" | "polling" | "connecting" }) {
  const label =
    transport === "ws" ? "WS live" : transport === "polling" ? "Polling" : "Connecting…";
  const tone =
    transport === "ws"
      ? "bg-success/15 text-success"
      : transport === "polling"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-secondary text-muted-foreground";
  return (
    <span
      data-testid="transport-badge"
      data-transport={transport}
      className={cn("pill inline-flex", tone)}
    >
      {label}
    </span>
  );
}

export function useAutoFocus() {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

export { Icon };
