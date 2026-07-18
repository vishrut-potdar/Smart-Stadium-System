import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { localTranslate, LANGUAGES } from "@/lib/translate.functions";

// 1. Mock TanStack Start server functions & request headers
vi.mock("@tanstack/react-start", () => {
  return {
    createServerFn: (options: any) => {
      const serverFn = async (args: any) => {
        if (options.inputValidator) {
          options.inputValidator(args.data);
        }
        return options.handler(args);
      };
      serverFn.inputValidator = function (validator: any) {
        options.inputValidator = validator;
        return this;
      };
      serverFn.handler = function (handler: any) {
        options.handler = handler;
        return this;
      };
      return serverFn;
    },
  };
});

vi.mock("@tanstack/react-start/server", () => {
  return {
    getRequestHeaders: () => {
      return {
        "x-forwarded-for": "127.0.0.1",
      };
    },
  };
});

// 2. Mock Google GenAI SDK
const mockGenerateContent = vi.fn().mockResolvedValue({
  text: "Simulated Gemini Translation",
});

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      config: any;
      constructor(config: any) {
        this.config = config;
      }
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

// 3. Mock Vercel AI SDK
const mockGenerateText = vi.fn().mockResolvedValue({
  text: "Simulated Lovable Translation",
});

vi.mock("ai", () => {
  return {
    generateText: mockGenerateText,
  };
});

describe("local offline translation logic", () => {
  it("should translate exact sample phrases correctly", () => {
    const text = "Gate D is temporarily closed. Please use Gate B or C.";

    const spanishTranslation = localTranslate(text, "es");
    expect(spanishTranslation).toBe(
      "La puerta D está cerrada temporalmente. Utilice la puerta B o C.",
    );

    const hindiTranslation = localTranslate(text, "hi");
    expect(hindiTranslation).toBe(
      "गेट डी अस्थायी रूप से बंद है। कृपया गेट बी या सी का उपयोग करें।",
    );
  });

  it("should translate word-by-word for custom lexicon matches", () => {
    expect(localTranslate("hello", "es")).toBe("[Spanish] Hola");
    expect(localTranslate("goal", "fr")).toBe("[French] But");
    expect(localTranslate("stadium", "de")).toBe("[German] Stadion");
  });

  it("should preserve word casing during lookup", () => {
    expect(localTranslate("Hello", "es")).toBe("[Spanish] Hola");
    expect(localTranslate("Seat", "es")).toBe("[Spanish] Asiento");
  });

  it("should return the text unmodified if target language is English", () => {
    expect(localTranslate("Match day hello goal", "en")).toBe("Match day hello goal");
  });

  it("should handle custom strings by keeping non-lexicon words intact", () => {
    const customText = "My seat is near the stadium entrance";
    const translated = localTranslate(customText, "es");

    expect(translated).toContain("[Spanish]");
    expect(translated).toContain("near");
    expect(translated).toContain("entrance");
    expect(translated.toLowerCase()).toContain("asiento");
    expect(translated.toLowerCase()).toContain("estadio");
  });
});

describe("translateText server function", () => {
  let translateText: any;
  let aiGateway: any;

  beforeEach(async () => {
    vi.resetModules();
    // Reset environments
    delete process.env.API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.LOVABLE_API_KEY;

    mockGenerateContent.mockClear();
    mockGenerateText.mockClear();

    // Dynamically import to pick up fresh mocks and clean environment
    const module = await import("@/lib/translate.functions");
    translateText = module.translateText;
    aiGateway = await import("@/lib/ai-gateway.server");
  });

  it("should use localTranslate if no API keys are provided", async () => {
    const result = await translateText({ data: { text: "hello", target: "es" } });
    expect(result.text).toBe("[Spanish] Hola");
    expect(result.target).toBe("Spanish");
  });

  it("should use Gemini API if GEMINI_API_KEY is provided", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    mockGenerateContent.mockResolvedValueOnce({
      text: " Hola (Gemini) ",
    });

    const result = await translateText({ data: { text: "hello", target: "es" } });
    expect(result.text).toBe("Hola (Gemini)");
    expect(result.target).toBe("Spanish");
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("should use Lovable AI Gateway if LOVABLE_API_KEY is provided and no Gemini Key", async () => {
    process.env.LOVABLE_API_KEY = "test-lovable-key";
    mockGenerateText.mockResolvedValueOnce({
      text: " Hola (Lovable) ",
    });

    const result = await translateText({ data: { text: "hello", target: "es" } });
    expect(result.text).toBe("Hola (Lovable)");
    expect(result.target).toBe("Spanish");
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("should fall back to localTranslate if the external API call fails", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    mockGenerateContent.mockRejectedValueOnce(new Error("API Overloaded"));

    const result = await translateText({ data: { text: "hello", target: "es" } });
    // Falls back to localTranslate
    expect(result.text).toBe("[Spanish] Hola");
    expect(result.target).toBe("Spanish");
  });

  it("should respect rate limits and throw an error when exceeded", async () => {
    const rateLimitSpy = vi.spyOn(aiGateway, "rateLimit").mockReturnValueOnce({
      ok: false,
      retryAfter: 45,
    });

    await expect(
      translateText({ data: { text: "hello", target: "es" } })
    ).rejects.toThrow("Rate limit exceeded. Try again in 45s.");

    rateLimitSpy.mockRestore();
  });

  it("should throw a validation error for invalid inputs", async () => {
    // Empty text
    await expect(
      translateText({ data: { text: "  ", target: "es" } })
    ).rejects.toThrow();

    // Too long text (> 800 chars)
    const longText = "a".repeat(801);
    await expect(
      translateText({ data: { text: longText, target: "es" } })
    ).rejects.toThrow();

    // Unsupported language code
    await expect(
      translateText({ data: { text: "hello", target: "invalid_lang" as any } })
    ).rejects.toThrow();
  });
});
