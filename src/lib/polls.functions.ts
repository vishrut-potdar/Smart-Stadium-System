import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { LANGUAGES, type LangCode } from "./translate.functions";

const InputSchema = z.object({
  lang: z.enum(Object.keys(LANGUAGES) as [LangCode, ...LangCode[]]).default("en"),
  topic: z.string().trim().max(200).optional(),
});

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          pct: { type: Type.NUMBER },
        },
        required: ["label", "pct"],
      },
    },
    prediction: { type: Type.STRING },
  },
  required: ["question", "options", "prediction"],
};

function parseTeamsFromTopic(topic: string) {
  const matches = topic.match(
    /([A-Za-z0-9\s\u0900-\u097F]+)\s+vs\s+([A-Za-z0-9\s\u0900-\u097F]+)/i,
  );
  if (matches && matches[1] && matches[2]) {
    return {
      home: matches[1].trim().slice(0, 24),
      away: matches[2].trim().slice(0, 24),
    };
  }
  return null;
}

function generateLocalPoll(topic: string, lang: LangCode) {
  const teams = parseTeamsFromTopic(topic) || { home: "Home Team", away: "Away Team" };
  const h = teams.home;
  const a = teams.away;

  const pollsByLang: Record<
    LangCode,
    { question: string; drawLabel: string; predictionTemplate: string }
  > = {
    en: {
      question: `Who wins between ${h} and ${a}?`,
      drawLabel: "Draw",
      predictionTemplate: `${h} has higher possession, but ${a} is lethal on the counter. Expect a tight finish!`,
    },
    hi: {
      question: `क्या ${h} और ${a} के बीच कौन जीतेगा?`,
      drawLabel: "ड्रॉ",
      predictionTemplate: `${h} के पास अधिक नियंत्रण है, लेकिन ${a} जवाबी हमले में घातक है। कड़े मुकाबले की उम्मीद है!`,
    },
    es: {
      question: `¿Quién ganará entre ${h} y ${a}?`,
      drawLabel: "Empate",
      predictionTemplate: `${h} tiene mayor posesión, pero ${a} es letal en el contraataque. ¡Se espera un final reñido!`,
    },
    ja: {
      question: `${h}と${a}のどちらが勝ちますか？`,
      drawLabel: "引き分け",
      predictionTemplate: `${h}の方がポゼッション率が高いですが、${a}はカウンターが強力です。接戦が予想されます！`,
    },
    fr: {
      question: `Qui va gagner entre ${h} et ${a} ?`,
      drawLabel: "Match nul",
      predictionTemplate: `${h} a une meilleure possession, mais ${a} est redoutable en contre-attaque. Un match serré est attendu !`,
    },
    ar: {
      question: `من سيفوز بين ${h} و ${a}؟`,
      drawLabel: "تعادل",
      predictionTemplate: `يمتلك ${h} نسبة استحواذ أعلى، لكن ${a} قاتل في الهجمات المرتدة. متوقع نهاية مثيرة!`,
    },
    de: {
      question: `Wer gewinnt zwischen ${h} und ${a}?`,
      drawLabel: "Unentschieden",
      predictionTemplate: `${h} hat mehr Ballbesitz, aber ${a} ist im Konter brandgefährlich. Ein enges Spiel wird erwartet!`,
    },
    pt: {
      question: `Quem vencerá entre ${h} e ${a}?`,
      drawLabel: "Empate",
      predictionTemplate: `${h} tem maior posse de bola, mas ${a} é letal no contra-ataque. Espera-se um final equilibrado!`,
    },
  };

  const conf = pollsByLang[lang] || pollsByLang.en;
  return {
    question: conf.question.slice(0, 140),
    options: [
      { label: h.slice(0, 40), pct: 48 },
      { label: a.slice(0, 40), pct: 36 },
      { label: conf.drawLabel.slice(0, 40), pct: 16 },
    ],
    prediction: conf.predictionTemplate.slice(0, 240),
  };
}

export const generateBreakPoll = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const { rateLimit, clientKey } = await import("./ai-gateway.server");
    const headers = new Headers(getRequestHeaders() as HeadersInit);
    const rl = rateLimit(`poll:${clientKey(headers)}`, 20, 60_000);
    if (!rl.ok) throw new Error(`Rate limit exceeded. Try again in ${rl.retryAfter}s.`);

    const geminiApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const langName = LANGUAGES[data.lang];
    const topic = (data.topic || "Argentina vs France, 2nd half, Argentina leading 2-1").slice(
      0,
      200,
    );

    if (!geminiApiKey && !lovableApiKey) {
      // Use beautifully tailored local simulation
      return generateLocalPoll(topic, data.lang);
    }

    const prompt =
      `Create ONE short fan poll for the football match break. Context: ${topic}. ` +
      `Return: a question (max 12 words), exactly 3 short options each with a realistic pct 0-100 that sums to ~100, ` +
      `and a one-sentence AI prediction for the next 20 minutes. Write EVERYTHING strictly in ${langName}.`;

    try {
      interface PollOutput {
        question: string;
        options: { label: string; pct: number }[];
        prediction: string;
      }
      let output: PollOutput;

      if (geminiApiKey) {
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.7,
          },
        });

        output = JSON.parse(response.text!.trim());
      } else {
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const { generateText, Output } = await import("ai");

        const PollSchema = z.object({
          question: z.string(),
          options: z.array(z.object({ label: z.string(), pct: z.number() })),
          prediction: z.string(),
        });

        const gateway = createLovableAiGatewayProvider(lovableApiKey!, undefined, {
          structuredOutputs: true,
        });
        const res = await generateText({
          model: gateway("openai/gpt-5.5"),
          output: Output.object({ schema: PollSchema }),
          prompt,
        });

        output = res.output;
      }

      interface PollOption {
        label: string;
        pct: number;
      }
      // clamp
      const total = output.options.reduce((s: number, o: PollOption) => s + o.pct, 0) || 1;
      const options = output.options.slice(0, 3).map((o: PollOption) => ({
        label: o.label.slice(0, 40),
        pct: Math.max(1, Math.min(99, Math.round((o.pct / total) * 100))),
      }));
      return {
        question: output.question.slice(0, 140),
        options,
        prediction: output.prediction.slice(0, 240),
      };
    } catch {
      // Fallback to high-quality local generator
      return generateLocalPoll(topic, data.lang);
    }
  });
