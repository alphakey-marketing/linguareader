# LinguaReader

A self-hosted Japanese immersion reading platform inspired by LingQ. Read Japanese content with color-coded vocabulary, SRS flashcard reviews, and a progress dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, Recharts, Wouter

## Where things live

- DB schema: `lib/db/src/schema/` (collections, lessons, vocab, stats)
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Generated API hooks: `lib/api-client-react/src/generated/api.ts`
- API routes: `artifacts/api-server/src/routes/`
- Frontend pages: `artifacts/lingua-reader/src/pages/`

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks
- Vocab states: 0=unknown (blue), 1-4=learning (yellow→orange→green), 5=known (transparent), 99=ignored (gray)
- SM-2 SRS algorithm implemented in `artifacts/api-server/src/routes/srs.ts`
- Tokenizer is regex-based (CJK/kana/latin boundaries) — no external NLP library
- Dictionary is built-in fallback (no JMdict SQLite for MVP)
- Anthropic Claude Haiku for AI translation via Replit AI proxy

## Product

- **Reader**: Interactive tokenized reader with color-coded vocab states, furigana toggle, tap-to-define
- **Import**: Paste text, URL article extraction, YouTube subtitle import
- **SRS Review**: SM-2 flashcard review with context sentences (Again/Hard/Good/Easy)
- **Vocabulary**: Full vocab table with status filtering, bulk status updates
- **Collections**: Organize lessons into named groups
- **Dashboard**: Stats cards + 30-day known-word growth chart (Recharts)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any lib changes, must run `pnpm run typecheck:libs` before checking artifact packages
- Vocab lookup uses POST `/api/vocab/lookup` (batch) — called from lesson reader on mount via useEffect, not during render
- `useGetVocab` params: omit `status` entirely when not filtering (don't pass `null`)
- Anthropic model: `claude-haiku-4-5`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
