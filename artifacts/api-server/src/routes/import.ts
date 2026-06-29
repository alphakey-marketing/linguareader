import { Router } from "express";
import { db, lessonsTable } from "@workspace/db";
import { ImportTextBody, ImportUrlBody, ImportYoutubeBody } from "@workspace/api-zod";

const router = Router();

function tokenizeJapanese(text: string): Array<{ surface: string; dictionaryForm: string; reading: string }> {
  // Simple tokenizer for MVP: split on boundaries between CJK, kana, latin, and punctuation
  const tokens: Array<{ surface: string; dictionaryForm: string; reading: string }> = [];
  const pattern = /[\u4e00-\u9fff\u3400-\u4dbf]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+|[a-zA-Z0-9]+|[^\s\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff]/g;
  const matches = text.match(pattern);
  if (matches) {
    for (const surface of matches) {
      if (surface.trim()) {
        tokens.push({ surface, dictionaryForm: surface, reading: surface });
      }
    }
  }
  return tokens;
}

router.post("/import/text", async (req, res) => {
  const parsed = ImportTextBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { title, text, collectionId } = parsed.data;
  const tokens = tokenizeJapanese(text);

  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      title,
      sourceType: "text",
      rawText: text,
      tokens: JSON.stringify(tokens),
      collectionId: collectionId ?? null,
      wordCount: tokens.length,
      status: "saved",
    })
    .returning();

  return res.status(201).json(formatLesson(lesson));
});

router.post("/import/url", async (req, res) => {
  const parsed = ImportUrlBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { url, collectionId } = parsed.data;

  // Fetch and extract text from the URL
  let extractedText = "";
  let title = url;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinguaReader/1.0)",
        "Accept": "text/html",
      },
    });
    const html = await response.text();

    // Simple title extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    // Simple text extraction: strip HTML tags
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    extractedText = bodyHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    if (!extractedText) extractedText = `[Could not extract text from: ${url}]`;
  } catch {
    extractedText = `[Failed to fetch: ${url}]`;
  }

  const tokens = tokenizeJapanese(extractedText);
  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      title,
      sourceType: "url",
      sourceUrl: url,
      rawText: extractedText,
      tokens: JSON.stringify(tokens),
      collectionId: collectionId ?? null,
      wordCount: tokens.length,
      status: "saved",
    })
    .returning();

  return res.status(201).json(formatLesson(lesson));
});

router.post("/import/youtube", async (req, res) => {
  const parsed = ImportYoutubeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { url, collectionId } = parsed.data;

  // Extract YouTube video ID
  const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  const placeholder = `YouTube subtitles import for: ${url}\n\nThis feature requires yt-dlp to be installed on the server. For the MVP, paste the subtitle text directly using the "Paste Text" import option.\n\nVideo ID: ${videoId ?? "unknown"}`;

  const tokens = tokenizeJapanese(placeholder);
  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      title: `YouTube: ${videoId ?? url}`,
      sourceType: "youtube",
      sourceUrl: url,
      rawText: placeholder,
      tokens: JSON.stringify(tokens),
      collectionId: collectionId ?? null,
      wordCount: tokens.length,
      status: "saved",
    })
    .returning();

  return res.status(201).json(formatLesson(lesson));
});

function formatLesson(lesson: typeof lessonsTable.$inferSelect) {
  return {
    id: lesson.id,
    title: lesson.title,
    sourceUrl: lesson.sourceUrl,
    sourceType: lesson.sourceType,
    rawText: lesson.rawText,
    tokens: lesson.tokens,
    audioUrl: lesson.audioUrl,
    collectionId: lesson.collectionId,
    status: lesson.status,
    wordCount: lesson.wordCount,
    createdAt: lesson.createdAt.toISOString(),
  };
}

export default router;
