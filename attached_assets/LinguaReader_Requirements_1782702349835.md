# LinguaReader — Personal Japanese Immersion Reader
> A self-hosted, LingQ-inspired language learning platform built for Japanese immersion, vocabulary acquisition, and comprehensible input — without subscription fees.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [User Requirements](#user-requirements)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Technical Architecture](#technical-architecture)
6. [Tech Stack](#tech-stack)
7. [Data Models](#data-models)
8. [API Integrations](#api-integrations)
9. [Milestones & Phases](#milestones--phases)
10. [Cost Estimate](#cost-estimate)
11. [Out of Scope](#out-of-scope)

---

## Project Overview

**Goal**: Build a personal web app that replicates the core LingQ experience — interactive reading with vocabulary tracking, audio sync, content import, and AI-powered definitions — self-hosted and free to operate at low cost.

**Target User**: Solo Japanese learner (N4→N1 progression) who consumes native content (YouTube, podcasts, articles, ebooks) and wants unified vocabulary tracking with spaced repetition.

**Core Philosophy**: Comprehensible input (Krashen i+1). Maximize exposure to real native content at a slightly challenging level, with frictionless word lookup and passive reinforcement through re-encounter.

---

## User Requirements

### UR-01 — Reading Experience
- As a user, I want to read any Japanese text with each word individually tappable so I can look up unknown words instantly without leaving the page.
- As a user, I want words color-coded by my personal knowledge level so I can see at a glance how familiar a text is.
- As a user, I want to mark a word as Known, Learning (stages 1–4), or Ignored so I can track my vocabulary state over time.

### UR-02 — Dictionary & Definitions
- As a user, I want a popup to appear when I tap a word showing its reading (furigana), meaning, and example sentences.
- As a user, I want AI-generated context-aware translations for the sentence I am reading, not just isolated word meanings.
- As a user, I want to save a custom note or mnemonic alongside any vocabulary entry.

### UR-03 — Content Import
- As a user, I want to paste a URL or raw text and have it instantly converted into an interactive lesson.
- As a user, I want to import YouTube videos by URL so the subtitles become a tappable, color-coded transcript synced to the video.
- As a user, I want to upload an MP3/podcast audio file and have it auto-transcribed and synced to the reader.
- As a user, I want to upload EPUB ebook files and read them with full vocabulary features.

### UR-04 — Audio & Listening
- As a user, I want audio to play while the current sentence is highlighted in the reader (read + listen simultaneously).
- As a user, I want to control playback speed (0.5×–2×) to practice at natural pace or slow down for comprehension.
- As a user, I want a sentence-by-sentence mode where I hear one sentence, pause, then proceed so I can practice listening-first.

### UR-05 — Vocabulary Review (SRS)
- As a user, I want a daily flashcard review queue of words I am currently learning, surfaced at spaced intervals.
- As a user, I want review cards to show the word in its original sentence context, not in isolation.
- As a user, I want my LingQ vocab to sync bidirectionally with Anki so I can review on mobile.

### UR-06 — Progress Tracking
- As a user, I want a dashboard showing my total known words, words read, listening hours, and study time.
- As a user, I want a chart showing known-word growth over time so I can see long-term progress.
- As a user, I want to see per-lesson statistics: % known words, new words found, time spent.

### UR-07 — Library & Organisation
- As a user, I want to organise lessons into collections/courses (e.g. "NHK News", "Anime Subs", "Novels").
- As a user, I want to mark lessons as In Progress, Completed, or Saved for Later.
- As a user, I want to search my full lesson library by title or tag.

### UR-08 — Text-to-Speech
- As a user, I want any imported text to be readable aloud by a high-quality Japanese TTS voice so I can generate listening content even when no audio exists.

---

## Functional Requirements

### FR-01 — Japanese Text Tokenisation
- The system MUST segment Japanese text into individual morpheme tokens using kuromoji.js (client-side) or MeCab (server-side).
- Each token MUST carry its surface form, dictionary form, reading (hiragana), and part-of-speech.
- The system MUST handle mixed scripts (kanji, hiragana, katakana, romaji, punctuation) correctly.

### FR-02 — Vocabulary State Management
- The system MUST store per-user vocabulary states: `unknown (0)`, `learning-1`, `learning-2`, `learning-3`, `learning-4`, `known (5)`, `ignored`.
- State updates MUST persist in real time on tap without full page reload.
- The system MUST increment a `times_seen` counter each time a word is encountered in any lesson.

### FR-03 — Interactive Reader Rendering
- The reader MUST render tokenised text with color-coded spans mapping to vocab state.
- Tapping any token MUST trigger a dictionary popup within 300ms.
- The reader MUST support furigana (ruby annotation) toggling above kanji.
- The reader MUST be responsive and usable on mobile screens.

### FR-04 — Dictionary Lookup
- The system MUST serve lookups from a locally hosted JMdict database (no external API dependency).
- Lookups MUST return: headword, all readings, all senses, part-of-speech tags, JLPT level where available.
- The system MAY call an AI API (Claude/GPT) for sentence-level context translation on user request.

### FR-05 — Content Ingestion Pipeline
- URL import MUST extract main article text using Readability.js and strip navigation/ads.
- YouTube import MUST fetch subtitle tracks via `yt-dlp` and parse into timestamped sentence segments.
- Audio import MUST transcribe via Whisper (local or API) and return word-level timestamps.
- EPUB import MUST parse chapter structure and preserve paragraph breaks.

### FR-06 — Audio Player
- The player MUST highlight the currently playing sentence in the reader in real time using Whisper word timestamps.
- The player MUST support click-to-seek: clicking any sentence jumps audio to that timestamp.
- The player MUST expose speed control, loop sentence, and auto-advance controls.

### FR-07 — SRS Review Engine
- The SRS engine MUST implement the SM-2 algorithm for scheduling review intervals.
- Each review card MUST display the target word inside its original sentence.
- The system MUST expose an AnkiConnect API endpoint for bidirectional Anki sync (optional but supported).

### FR-08 — Statistics Engine
- The system MUST track: words read (cumulative), listening minutes, study sessions, known word count by date.
- The dashboard MUST render a line chart of known-word growth over time.
- Stats MUST update in real time as the user reads.

### FR-09 — TTS Generation
- The system MUST support calling Voicevox (local, free) or Google Cloud TTS to generate audio for any lesson without native audio.
- Generated audio MUST be cached locally to avoid regeneration costs.

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Reader must render up to 5,000 tokens with no visible lag (<100ms paint) |
| NFR-02 | Offline | Core reading and SRS review must work offline after initial content load |
| NFR-03 | Privacy | All vocabulary data stored locally or in user-owned DB — no third-party tracking |
| NFR-04 | Extensibility | Architecture must support adding new languages (ZH, KO) without major refactor |
| NFR-05 | Cost | Operational cost must stay under $5 USD/month at normal usage |
| NFR-06 | Mobile | UI must be fully functional on iOS Safari and Android Chrome |
| NFR-07 | Auth | Single-user auth (personal use); JWT session or Supabase Auth acceptable |
| NFR-08 | Data Portability | User must be able to export all vocab data as CSV or JSON at any time |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  Next.js App Router  │  React Reader  │  kuromoji.js     │
│  Zustand state       │  Audio Player  │  IndexedDB cache │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS / API Routes
┌──────────────▼──────────────────────────────────────────┐
│                  Next.js API Layer                        │
│  /api/import   /api/vocab   /api/tts   /api/ai           │
│  /api/transcribe   /api/stats   /api/srs                 │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌──────▼──────────────────────────────┐
│  Supabase  │   │         External Services            │
│  Postgres  │   │  Whisper API / local Docker          │
│  Auth      │   │  Claude Haiku / GPT-4o mini          │
│  Storage   │   │  yt-dlp (server CLI)                 │
└────────────┘   │  Voicevox (local Docker)             │
                 │  JMdict (local SQLite)               │
                 └─────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Familiar stack; SSR for content, API routes for backend |
| Language | TypeScript | Type safety for complex vocab/token data models |
| Styling | Tailwind CSS | Rapid UI with mobile-first utilities |
| State | Zustand | Lightweight global state for reader + vocab |
| Database | Supabase (Postgres) | Free tier; real-time subscriptions; Auth included |
| Japanese Tokeniser | kuromoji.js | Runs client-side, no server cost, well-maintained |
| Dictionary | JMdict (local SQLite) | Free, offline, 200k+ entries, JLPT-tagged |
| Transcription | OpenAI Whisper (API or Docker) | Word-level timestamps; Japanese accuracy is excellent |
| AI Definitions | Claude Haiku API | Cheapest capable model; context-aware Japanese explanations |
| TTS | Voicevox (Docker) | Free, local, high-quality Japanese voices |
| Content Import | yt-dlp + Readability.js | Battle-tested; handles YouTube and web articles |
| SRS | Custom SM-2 implementation | ~30 lines TS; optionally sync to Anki via AnkiConnect |
| Hosting | Vercel (frontend) + Railway (backend workers) | Free tiers sufficient for personal use |
| Charts | Recharts / Tremor | Native React charting for stats dashboard |

---

## Data Models

### `lessons`
```ts
{
  id: uuid
  title: string
  source_url?: string
  source_type: 'text' | 'youtube' | 'audio' | 'epub'
  raw_text: string
  tokens: Token[]          // stored as JSONB
  audio_url?: string
  timestamps?: Timestamp[] // word-level from Whisper
  collection_id?: uuid
  status: 'saved' | 'in_progress' | 'completed'
  word_count: number
  created_at: timestamp
}
```

### `vocab`
```ts
{
  id: uuid
  user_id: uuid
  surface: string          // exact form as seen in text
  dictionary_form: string  // base form from kuromoji
  reading: string          // hiragana reading
  status: 0 | 1 | 2 | 3 | 4 | 5 | 99  // 5=known, 99=ignored
  times_seen: number
  note?: string
  source_lesson_id: uuid
  next_review: timestamp   // SM-2 scheduled date
  ease_factor: number      // SM-2 EF
  interval_days: number
  created_at: timestamp
  updated_at: timestamp
}
```

### `stats_daily`
```ts
{
  user_id: uuid
  date: date
  words_read: number
  listening_minutes: number
  new_lingqs: number
  known_words_total: number // snapshot at end of day
  study_minutes: number
}
```

---

## API Integrations

| Service | Purpose | Free Tier / Cost |
|---|---|---|
| OpenAI Whisper API | Audio transcription | $0.006/min (~$1.80 for 5hrs/month) |
| Claude Haiku (Anthropic) | Context-aware AI definitions | ~$0.25/M input tokens; ~$1–2/month typical |
| Voicevox | Japanese TTS (local Docker) | Completely free |
| JMdict | Japanese dictionary | Free, self-hosted |
| yt-dlp | YouTube subtitle extraction | Free, open source CLI |
| Supabase | Database + Auth + Storage | Free up to 500MB / 50k MAU |
| Vercel | Frontend hosting | Free hobby tier |
| AnkiConnect | Anki sync (optional) | Free |

**Estimated monthly cost: $3–5 USD**

---

## Milestones & Phases

### Phase 1 — Core Reader (Week 1–2)
- [ ] Next.js project setup with Supabase auth
- [ ] Paste-text import → kuromoji tokenisation → color-coded reader render
- [ ] JMdict SQLite integration → tap-to-lookup popup
- [ ] Vocab state persistence (unknown/learning/known) in Supabase
- [ ] Basic known-word counter on dashboard

### Phase 2 — Content Import Pipeline (Week 3–4)
- [ ] URL import via Readability.js
- [ ] YouTube subtitle import via yt-dlp API route
- [ ] EPUB upload and chapter parsing
- [ ] Lesson library with collections and status tagging

### Phase 3 — Audio & Listening (Week 5–6)
- [ ] Audio player with sentence-highlight sync (Whisper timestamps)
- [ ] MP3/podcast upload → Whisper transcription → timestamped reader
- [ ] Playback speed control and sentence-loop mode
- [ ] Voicevox TTS for text-only lessons

### Phase 4 — AI & SRS (Week 7–8)
- [ ] Claude Haiku API integration for context-aware sentence translation
- [ ] SM-2 SRS engine with daily review queue
- [ ] Review card UI with original-sentence context
- [ ] AnkiConnect sync endpoint (optional)

### Phase 5 — Stats & Polish (Week 9–10)
- [ ] Full stats dashboard with Recharts graphs
- [ ] Mobile-responsive UI pass
- [ ] Furigana toggle and reader theme options
- [ ] CSV/JSON vocab export
- [ ] Performance optimisation for large lessons (5000+ tokens)

---

## Cost Estimate

| Phase | One-time Effort | Monthly Running Cost |
|---|---|---|
| Phase 1 (Reader) | ~20–30 hrs | $0 |
| Phase 2 (Import) | ~15–20 hrs | $0 |
| Phase 3 (Audio) | ~20–25 hrs | ~$1.80 (Whisper) |
| Phase 4 (AI+SRS) | ~15 hrs | ~$1–2 (Claude) |
| Phase 5 (Polish) | ~10 hrs | $0 additional |
| **Total** | **~80–100 hrs** | **~$3–5/month** |

vs. LingQ Premium: $119.99/year (~$10/month), with word limits and no customisation.

---

## Out of Scope (v1)

- Speaking / pronunciation practice (no mic input)
- Grammar explanation engine (use external resources, e.g. Bunpro)
- Multi-user / community features
- Mobile native app (web-only, responsive)
- Content recommendation algorithm
- Social features (leaderboards, sharing)

These may be considered for v2 based on usage patterns.

---

*Last updated: June 2026 | Owner: Chan Kwan Yin*
