import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type BroadcastRow = Database["public"]["Tables"]["admin_broadcasts"]["Row"];

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Role check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data, userId: context.userId };
  });

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_admin");
    if (error) throw new Error(error.message);
    return { claimed: !!data };
  });

const BroadcastInput = z.object({
  tag: z.string().min(1).max(24),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  tone: z.enum(["primary", "accent", "warning", "destructive"]).default("primary"),
});

export const broadcastAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => BroadcastInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("admin_broadcasts")
      .insert({ tag: data.tag, title: data.title, body: data.body, tone: data.tone })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, broadcast: row };
  });

export const listBroadcasts = createServerFn({ method: "GET" }).handler(async () => {
  // Public read — uses server publishable client
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabasePublic = createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await supabasePublic
    .from("admin_broadcasts")
    .select("id, tag, title, body, tone, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { broadcasts: [] as BroadcastRow[] };
  return { broadcasts: data ?? [] };
});
