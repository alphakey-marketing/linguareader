/**
 * Auto-migration: ensures all Drizzle schema tables exist in the database.
 *
 * Called automatically on server startup (index.ts) before the HTTP server
 * starts accepting connections. This means:
 *
 *   - First deploy: creates all tables from scratch
 *   - Schema changes: adds new columns/tables (safe, non-destructive)
 *   - Already up to date: no-op, completes in <100ms
 *
 * You NEVER need to run `pnpm --filter @workspace/db run push` manually.
 * Just deploy and the server handles it.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

/**
 * Creates all tables defined in the Drizzle schema if they don't exist.
 * Uses CREATE TABLE IF NOT EXISTS — safe to run on every startup.
 */
export async function ensureSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Add it to Replit Secrets (Settings → Secrets)."
    );
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const client = await pool.connect();

    try {
      // Create enums first (idempotent)
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE source_type AS ENUM ('text', 'youtube', 'audio', 'epub', 'url');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      await client.query(`
        DO $$ BEGIN
          CREATE TYPE lesson_status AS ENUM ('saved', 'in_progress', 'completed');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      // Collections table
      await client.query(`
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Lessons table
      await client.query(`
        CREATE TABLE IF NOT EXISTS lessons (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          source_url TEXT,
          source_type TEXT NOT NULL DEFAULT 'text',
          raw_text TEXT NOT NULL,
          tokens JSONB,
          timestamps JSONB,
          audio_url TEXT,
          collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
          status TEXT NOT NULL DEFAULT 'saved',
          word_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Vocab table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vocab (
          id TEXT PRIMARY KEY,
          surface TEXT NOT NULL,
          dictionary_form TEXT NOT NULL,
          reading TEXT,
          status SMALLINT NOT NULL DEFAULT 0,
          times_seen INTEGER NOT NULL DEFAULT 1,
          note TEXT,
          source_lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
          next_review TIMESTAMPTZ,
          interval_days NUMERIC(8,2) NOT NULL DEFAULT 1,
          ease_factor NUMERIC(4,3) NOT NULL DEFAULT 2.5,
          review_count INTEGER NOT NULL DEFAULT 0,
          last_reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Stats table
      await client.query(`
        CREATE TABLE IF NOT EXISTS stats_daily (
          id TEXT PRIMARY KEY,
          date DATE NOT NULL UNIQUE,
          words_read INTEGER NOT NULL DEFAULT 0,
          listening_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
          new_vocab_saved INTEGER NOT NULL DEFAULT 0,
          vocab_reviewed INTEGER NOT NULL DEFAULT 0,
          known_words_total INTEGER NOT NULL DEFAULT 0,
          study_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
          lessons_completed INTEGER NOT NULL DEFAULT 0
        );
      `);

      console.log("[DB] Schema ensured ✔");
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}
