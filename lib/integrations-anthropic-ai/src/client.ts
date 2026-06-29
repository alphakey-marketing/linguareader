/**
 * AI Text Client — powered by OpenRouter
 *
 * Previously used Anthropic direct API. Now routes through OpenRouter
 * (https://openrouter.ai) using the Anthropic SDK's compatible baseURL.
 *
 * OpenRouter is a unified gateway: ONE API key accesses 500+ models
 * including Claude, Gemini, Llama, Mistral, and more.
 *
 * ─── Environment variable required ───────────────────────────────────────
 *   OPENROUTER_API_KEY   — from https://openrouter.ai/keys
 *                          (replaces both ANTHROPIC_API_KEY and OPENAI_API_KEY)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Default model: google/gemini-2.0-flash-lite
 *   - Best cost/quality for short Japanese→English explanation prompts
 *   - ~$0.10/$0.40 per 1M tokens in/out
 *   - Change OPENROUTER_TEXT_MODEL env var to swap without code changes
 *
 * Other recommended models (set via OPENROUTER_TEXT_MODEL):
 *   mistralai/mistral-7b-instruct       — cheaper, reliable structured output
 *   meta-llama/llama-3.1-8b-instruct    — open-source, consistent Japanese
 *   anthropic/claude-haiku-4-5          — if you want the original Claude
 */

import Anthropic from "@anthropic-ai/sdk";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY must be set. " +
    "Get your key at https://openrouter.ai/keys and add it to Replit Secrets."
  );
}

/**
 * Default text model used for AI translation / word explanations.
 * Override by setting OPENROUTER_TEXT_MODEL in your environment.
 */
export const DEFAULT_TEXT_MODEL =
  process.env.OPENROUTER_TEXT_MODEL ?? "google/gemini-2.0-flash-lite";

/**
 * Anthropic SDK client pointed at OpenRouter's compatible endpoint.
 * The SDK is fully compatible — only the baseURL and API key differ.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    // Recommended by OpenRouter for analytics / abuse prevention
    "HTTP-Referer": "https://linguareader.app",
    "X-Title": "LinguaReader",
  },
});
