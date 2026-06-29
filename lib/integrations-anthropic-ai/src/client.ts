/**
 * AI Text Client — powered by BasicRouter
 *
 * Routes through BasicRouter (https://basicrouter.ai) using the Anthropic
 * SDK's compatible baseURL. BasicRouter is an OpenAI-compatible AI gateway
 * with unified access to Claude, Gemini, GPT, and more.
 *
 * ─── Environment variable required ───────────────────────────────────────
 *   BASICROUTER_API_KEY   — from https://basicrouter.ai
 *                          Add it to Replit Secrets (Settings → Secrets)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Default model: google/gemini-2.5-flash
 *   - Best cost/quality for short Japanese→English explanation prompts
 *   - Supports structured output natively
 *   - Change BASICROUTER_TEXT_MODEL env var to swap without code changes
 *
 * Other recommended models (set via BASICROUTER_TEXT_MODEL):
 *   google/gemini-2.5-flash-lite        — cheaper, still fast Japanese
 *   anthropic/claude-haiku-4.5          — fast Claude, reliable structured output
 *   openai/gpt-4o                       — solid all-round Japanese comprehension
 */

import Anthropic from "@anthropic-ai/sdk";

if (!process.env.BASICROUTER_API_KEY) {
  throw new Error(
    "BASICROUTER_API_KEY must be set. " +
    "Get your key at https://basicrouter.ai and add it to Replit Secrets."
  );
}

/**
 * Default text model used for AI translation / word explanations.
 * Override by setting BASICROUTER_TEXT_MODEL in your environment.
 */
export const DEFAULT_TEXT_MODEL =
  process.env.BASICROUTER_TEXT_MODEL ?? "google/gemini-2.5-flash";

/**
 * Anthropic SDK client pointed at BasicRouter's compatible endpoint.
 * The SDK is fully compatible — only the baseURL and API key differ.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.BASICROUTER_API_KEY,
  baseURL: "https://basicrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://linguareader.app",
    "X-Title": "LinguaReader",
  },
});
