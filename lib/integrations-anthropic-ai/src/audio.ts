/**
 * Audio Transcription Client — powered by BasicRouter
 *
 * Uses BasicRouter's Speech-to-Text endpoint (OpenAI-compatible):
 *   POST https://basicrouter.ai/api/v1/audio/transcriptions
 *
 * This is OpenAI-compatible, so it uses the same FormData shape as
 * the OpenAI Whisper API — just with the BasicRouter base URL and key.
 *
 * ─── Environment variable required ───────────────────────────────────────
 *   BASICROUTER_API_KEY   — same key used for text models, no second key needed
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Default model: openai/gpt-4o-mini-transcribe
 *   - Best cost/accuracy balance for Japanese audio
 *   - Returns word-level timestamps for audio sync
 *   - Override via BASICROUTER_AUDIO_MODEL env var
 *
 * Other available models (set via BASICROUTER_AUDIO_MODEL):
 *   openai/gpt-4o-transcribe            — higher accuracy
 *   openai/whisper-large-v3-turbo       — fallback, reliable, timestamps
 */

if (!process.env.BASICROUTER_API_KEY) {
  throw new Error(
    "BASICROUTER_API_KEY must be set. " +
    "Get your key at https://basicrouter.ai and add it to Replit Secrets."
  );
}

const BASICROUTER_STT_URL = "https://basicrouter.ai/api/v1/audio/transcriptions";

/**
 * Default audio transcription model.
 * Override by setting BASICROUTER_AUDIO_MODEL in your environment.
 */
export const DEFAULT_AUDIO_MODEL =
  process.env.BASICROUTER_AUDIO_MODEL ?? "openai/gpt-4o-mini-transcribe";

export interface TranscriptionWord {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface TranscriptionResult {
  text: string;
  words: TranscriptionWord[];
  language: string;
  duration: number;
}

/**
 * Transcribe an audio file using BasicRouter's STT endpoint.
 *
 * @param audioBuffer  - Raw audio file buffer (MP3, M4A, WAV)
 * @param filename     - Original filename including extension (e.g. "podcast.mp3")
 * @param language     - BCP-47 language code; always "ja" for LinguaReader
 * @returns TranscriptionResult with full text + word-level timestamps
 *
 * @example
 * const buffer = fs.readFileSync("episode.mp3");
 * const result = await transcribeAudio(buffer, "episode.mp3", "ja");
 * // result.words = [{ word: "今日は", start: 0.0, end: 0.8 }, ...]
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  language = "ja"
): Promise<TranscriptionResult> {
  const formData = new FormData();

  // Determine MIME type from filename extension
  const ext = filename.split(".").pop()?.toLowerCase() ?? "mp3";
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    webm: "audio/webm",
  };
  const mimeType = mimeTypes[ext] ?? "audio/mpeg";

  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append("file", blob, filename);
  formData.append("model", DEFAULT_AUDIO_MODEL);
  formData.append("language", language);
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");

  const response = await fetch(BASICROUTER_STT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BASICROUTER_API_KEY}`,
      "HTTP-Referer": "https://linguareader.app",
      "X-Title": "LinguaReader",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `BasicRouter transcription failed (${response.status}): ${error}`
    );
  }

  const data = await response.json() as {
    text: string;
    words?: Array<{ word: string; start: number; end: number }>;
    language?: string;
    duration?: number;
  };

  return {
    text: data.text,
    words: data.words ?? [],
    language: data.language ?? language,
    duration: data.duration ?? 0,
  };
}
