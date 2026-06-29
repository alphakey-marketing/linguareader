import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { AiTranslateBody } from "@workspace/api-zod";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const MODEL = "claude-haiku-4-5";

router.post("/ai/translate", async (req, res) => {
  const parsed = AiTranslateBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { sentence, targetWord } = parsed.data;

  try {
    const prompt = targetWord
      ? `You are a Japanese language tutor. Given this Japanese sentence: "${sentence}" — explain the word "${targetWord}" in context. Provide: 1) The English translation of the full sentence. 2) A brief explanation of what "${targetWord}" means in this context. Keep your response concise and educational.`
      : `Translate this Japanese sentence to English, then provide a brief linguistic note if there's anything interesting about the grammar or vocabulary: "${sentence}". Format: first the translation, then a brief note (if applicable).`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "";

    let translation = text;
    let wordExplanation: string | null = null;

    if (targetWord && text.includes("1)") && text.includes("2)")) {
      const parts = text.split(/2\)/);
      translation = parts[0].replace(/1\)/, "").trim();
      wordExplanation = parts[1]?.trim() ?? null;
    }

    return res.json({ translation, wordExplanation });
  } catch (err) {
    req.log?.error({ err }, "AI translation failed");
    return res.status(500).json({ error: "AI translation failed" });
  }
});

export default router;
