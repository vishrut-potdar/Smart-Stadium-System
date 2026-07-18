import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(
  apiKey: string,
  _initialRunId?: string,
  options?: { structuredOutputs?: boolean },
) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

/** Very small in-memory token bucket, per Worker isolate. Best effort. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= max) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  b.count += 1;
  return { ok: true };
}

/** Strip control chars and cap length. Neutralises common prompt-injection role markers. */
export function sanitizeUserText(text: string, max = 1000): string {
  // eslint-disable-next-line no-control-regex
  const noControls = text.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();
  const clipped = noControls.slice(0, max);
  // Neutralise attempts to spoof roles / system / tool tags
  return clipped
    .replace(/<\/?(system|assistant|user|tool)[^>]*>/gi, "")
    .replace(/^(system|assistant|developer)\s*:/gim, "$1_:");
}

export function clientKey(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anon"
  );
}

export function formatAiError(err: unknown): string {
  if (!err) return "AI request failed";

  let msg = "AI request failed";
  if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === "object" && err !== null && "message" in err) {
    msg = String((err as Record<string, unknown>).message);
  } else {
    msg = String(err);
  }

  // Clean up "ApiError: " prefix if present
  if (msg.startsWith("ApiError: ")) {
    msg = msg.substring(10);
  }

  try {
    // Attempt to parse the inner JSON error from Google API
    const parsed = JSON.parse(msg);
    if (parsed && parsed.error) {
      const apiMsg = parsed.error.message;
      if (apiMsg) {
        if (apiMsg.includes("API key not valid") || apiMsg.includes("API_KEY_INVALID")) {
          return "The configured API Key is invalid. Please check your Settings > Secrets panel and ensure you have added a valid API_KEY or GEMINI_API_KEY secret.";
        }
        if (parsed.error.status === "PERMISSION_DENIED" && apiMsg.includes("disabled")) {
          return "Gemini API or Vertex AI is disabled or not activated for the project. Please ensure a valid, active Gemini API Key is configured.";
        }
        return `AI Error: ${apiMsg}`;
      }
    }
  } catch {
    // If it's not valid JSON, check the raw message string
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      return "The configured API Key is invalid. Please check your Settings > Secrets panel and ensure you have added a valid API_KEY or GEMINI_API_KEY secret.";
    }
  }

  return msg;
}
