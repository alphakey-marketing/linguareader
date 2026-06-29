# LinguaReader — Integrations & API Keys Guide

This document is the single source of truth for all external service integrations in LinguaReader. If you are ever confused about which API key to use, which model is active, or how to change it — read this file first.

---

## Overview

| Service | Purpose in LinguaReader | Key Name in Replit Secrets |
|---|---|---|
| **OpenRouter** | ALL AI calls — text translation + audio transcription | `OPENROUTER_API_KEY` |
| **Supabase** | Postgres database + file storage | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

> ✅ There is **no separate Anthropic API key**.
> ✅ There is **no separate OpenAI API key**.
> One `OPENROUTER_API_KEY` covers everything AI-related.

---

## OpenRouter

### What is OpenRouter?

OpenRouter (https://openrouter.ai) is a unified AI gateway that provides access to 500+ models (Claude, Gemini, Llama, Mistral, Whisper, and more) under a single API key and a single invoice. It is OpenAI-API-compatible, meaning existing SDKs work by just changing the `baseURL`.

### How to get the key

1. Go to https://openrouter.ai → Sign up
2. Go to https://openrouter.ai/keys → **Create Key**
3. Set a monthly credit limit (e.g. $10) for safety
4. Copy the key (starts with `sk-or-v1-...`)
5. Paste into **Replit → 🔒 Secrets → `OPENROUTER_API_KEY`**
6. Go to https://openrouter.ai/credits → add $10 credit

### Active Models

#### Text Model — AI Translation & Word Explanation (`/api/ai/translate`)

| | |
|---|---|
| **Default model string** | `google/gemini-2.0-flash-lite` |
| **Override env var** | `OPENROUTER_TEXT_MODEL` |
| **Cost** | ~$0.10/$0.40 per 1M tokens in/out |
| **Estimated monthly cost** | < $0.10 at normal LinguaReader usage |
| **Why this model** | Fastest + cheapest; strong Japanese multilingual support; ideal for short 200-token prompts |

Alternative models (change `OPENROUTER_TEXT_MODEL` to use):

| Model String | Notes |
|---|---|
| `mistralai/mistral-7b-instruct` | Reliable structured output, cheaper |
| `meta-llama/llama-3.1-8b-instruct` | Open-source, consistent Japanese |
| `anthropic/claude-haiku-4-5` | Original Claude quality if needed |
| `anthropic/claude-sonnet-4-6` | Higher quality, 3× more expensive |

#### Audio Model — Japanese Transcription (`/api/import/audio`)

| | |
|---|---|
| **Default model string** | `openai/gpt-4o-mini-transcribe` |
| **Override env var** | `OPENROUTER_AUDIO_MODEL` |
| **Cost** | $0.003/minute (~$0.90 for 5 hrs/month) |
| **Returns word timestamps** | ✅ Yes — required for audio player sentence sync |
| **Language param** | Always set to `ja` for Japanese |

Alternative models (change `OPENROUTER_AUDIO_MODEL` to use):

| Model String | Notes |
|---|---|
| `openai/gpt-4o-transcribe` | Higher accuracy, $0.006/min |
| `openai/whisper-large-v3-turbo` | Reliable fallback, segment-level timestamps |

### How the model is selected

**The model is NEVER set in the OpenRouter dashboard.** It is always passed as the `model` field in each API call from your code. To change the model:
- Either update the `OPENROUTER_TEXT_MODEL` or `OPENROUTER_AUDIO_MODEL` env var in Replit Secrets
- Or directly edit the `DEFAULT_TEXT_MODEL` / `DEFAULT_AUDIO_MODEL` exports in the client files

### Code locations

| File | What it does |
|---|---|
| `lib/integrations-anthropic-ai/src/client.ts` | Anthropic SDK configured with OpenRouter baseURL — used for text/chat calls |
| `lib/integrations-anthropic-ai/src/audio.ts` | Native fetch client for OpenRouter STT endpoint — used for audio transcription |
| `lib/integrations-anthropic-ai/src/batch/utils.ts` | Batch processing utilities (rate limiting + retries) for bulk AI operations |
| `lib/integrations-anthropic-ai/src/index.ts` | Exports: `anthropic`, `transcribeAudio`, `batchProcess`, `DEFAULT_TEXT_MODEL`, `DEFAULT_AUDIO_MODEL` |

---

## Supabase

### What Supabase provides

- **Postgres database** — all lessons, vocab, stats, collections tables
- **File storage** — uploaded audio files and EPUB files
- **Auth** — single-user JWT session (MVP; multi-user via Supabase Auth for v2)

### How to get the keys

1. Go to https://supabase.com → **New Project**
2. Choose a region (Singapore or Tokyo recommended for HK users)
3. Once created, go to **Project Settings → Database** → copy **Connection String (URI)** → paste as `DATABASE_URL`
4. Go to **Project Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Key security rules

| Key | Safe for browser? | Used in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes (limited permissions) | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ NO — server only | API routes only |
| `DATABASE_URL` | ❌ NO — server only | Drizzle ORM only |

---

## Removed / Deprecated Keys

The following environment variables were used in an earlier version and are **no longer needed**. Remove them from Replit Secrets if they exist:

| Old Key | Replaced By |
|---|---|
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | `OPENROUTER_API_KEY` |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Hardcoded to `https://openrouter.ai/api/v1` in `client.ts` |
| `ANTHROPIC_API_KEY` | `OPENROUTER_API_KEY` |
| `OPENAI_API_KEY` | `OPENROUTER_API_KEY` |

---

## Monthly Cost Estimate

| Service | Estimated Cost |
|---|---|
| OpenRouter — text AI | < $0.10/month |
| OpenRouter — audio transcription (5 hrs) | ~$0.90/month |
| Supabase (free tier) | $0/month |
| **Total** | **~$1/month** |

This is well within the NFR-05 target of $5/month.
