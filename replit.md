# LinguaReader

A self-hosted Japanese immersion reading platform inspired by LingQ. Read Japanese content with color-coded vocabulary, SRS flashcard reviews, and a progress dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Required Environment Variables (Replit Secrets)

All secrets are managed in **Replit → 🔒 Secrets panel**. Never hardcode these.

| Secret Key | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres connection string | Supabase → Project Settings → Database |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (safe for client) | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never expose to client) | Supabase → Project Settings → API |
| `OPENROUTER_API_KEY` | OpenRouter unified AI key — covers ALL models (text + audio) | https://openrouter.ai/keys |

> ⚠️ **No separate Anthropic or OpenAI keys needed.** A single `OPENROUTER_API_KEY` handles both AI text (Claude/Gemini/Llama) and audio transcription (Whisper) through OpenRouter's unified gateway.

### Optional model overrides (set in Replit Secrets to change models without code changes)

| Secret Key | Default value | Purpose |
|---|---|---|
| `OPENROUTER_TEXT_MODEL` | `google/gemini-2.0-flash-lite` | Model for `/api/ai/translate` |
| `OPENROUTER_AUDIO_MODEL` | `openai/gpt-4o-mini-transcribe` | Model for `/api/import/audio` |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, Recharts, Wouter
- AI Gateway: **OpenRouter** (https://openrouter.ai) — single key for all AI providers

## Where things live

- DB schema: `lib/db/src/schema/` (collections, lessons, vocab, stats)
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Generated API hooks: `lib/api-client-react/src/generated/api.ts`
- API routes: `artifacts/api-server/src/routes/`
- Frontend pages: `artifacts/lingua-reader/src/pages/`
- AI text client: `lib/integrations-anthropic-ai/src/client.ts`
- AI audio client: `lib/integrations-anthropic-ai/src/audio.ts`
- Kuromoji tokeniser: `lib/kuromoji/src/index.ts`

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks
- Vocab states: 0=unknown (blue), 1-4=learning (yellow→orange→green), 5=known (transparent), 99=ignored (gray)
- SM-2 SRS algorithm implemented in `artifacts/api-server/src/routes/srs.ts`
- **AI provider: OpenRouter** — all AI calls (text + audio) go through `https://openrouter.ai/api/v1` using one `OPENROUTER_API_KEY`. The Anthropic SDK is used as the HTTP client for text calls (compatible baseURL), and a native fetch client is used for audio transcription.
- Tokenizer: `@workspace/kuromoji` wraps kuromoji.js (server-side IPA dict) — returns `{ surface, dictionaryForm, reading, partOfSpeech, isWord }` per token
- Dictionary is built-in fallback (no JMdict SQLite for MVP)

## Product

- **Reader**: Interactive tokenized reader with color-coded vocab states, furigana toggle, tap-to-define
- **Import**: Paste text, URL article extraction, YouTube subtitle import, audio upload (Whisper via OpenRouter), EPUB
- **SRS Review**: SM-2 flashcard review with context sentences (Again/Hard/Good/Easy)
- **Vocabulary**: Full vocab table with status filtering, bulk status updates, CSV/JSON export
- **Collections**: Organize lessons into named groups
- **Dashboard**: Stats cards + 30-day known-word growth chart (Recharts)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any lib changes, must run `pnpm run typecheck:libs` before checking artifact packages
- Vocab lookup uses POST `/api/vocab/lookup` (batch) — called from lesson reader on mount via useEffect, not during render
- `useGetVocab` params: omit `status` entirely when not filtering (don't pass `null`)
- **AI model is NOT configured in OpenRouter dashboard** — it is set via the `model` field in each API call, or overridden via `OPENROUTER_TEXT_MODEL` / `OPENROUTER_AUDIO_MODEL` env vars
- Old env vars `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` are **removed** — use `OPENROUTER_API_KEY` only
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser — server-side routes only

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenRouter model catalogue: https://openrouter.ai/models
- OpenRouter STT docs: https://openrouter.ai/docs/guides/overview/multimodal/stt
