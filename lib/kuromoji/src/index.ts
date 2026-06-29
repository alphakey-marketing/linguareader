/**
 * @workspace/kuromoji
 * Wrapper around kuromoji.js for Japanese text tokenisation.
 * Returns structured tokens with surface form, dictionary form,
 * hiragana reading, and part-of-speech — as required by FR-01.
 *
 * Usage:
 *   import { tokenize } from '@workspace/kuromoji';
 *   const tokens = await tokenize('日本語を勉強しています');
 */

import kuromoji from "kuromoji";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Types ────────────────────────────────────────────────────────────────────

export interface JpToken {
  /** Exact surface form as it appears in the text e.g. 食べて */
  surface: string;
  /** Base (dictionary) form e.g. 食べる */
  dictionaryForm: string;
  /** Hiragana reading e.g. たべて */
  reading: string;
  /** Part-of-speech tag e.g. 動詞, 名詞 */
  partOfSpeech: string;
  /** Secondary POS detail e.g. 自立, 非自立 */
  partOfSpeechDetail: string;
  /** True when the token is a CJK/kana word (not punctuation/whitespace) */
  isWord: boolean;
}

// ── Tokeniser singleton ──────────────────────────────────────────────────────

let _tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

/**
 * Lazily build and cache the kuromoji tokeniser.
 * The dict path points to the IPA dictionary bundled with the package.
 */
export async function getTokenizer(): Promise<
  kuromoji.Tokenizer<kuromoji.IpadicFeatures>
> {
  if (_tokenizer) return _tokenizer;

  return new Promise((resolve, reject) => {
    // Resolve the bundled dict relative to node_modules/kuromoji
    const dictPath = path.resolve(
      __dirname,
      "..",
      "node_modules",
      "kuromoji",
      "dict"
    );

    kuromoji
      .builder({ dicPath: dictPath })
      .build((err, tokenizer) => {
        if (err) return reject(err);
        _tokenizer = tokenizer;
        resolve(tokenizer);
      });
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Katakana → hiragana conversion for normalising readings */
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/** Returns true if the surface token represents a meaningful word */
function isWordToken(token: kuromoji.IpadicFeatures): boolean {
  const pos = token.pos ?? "";
  // Exclude punctuation, whitespace, symbols
  const excluded = ["記号", "空白", "BOS/EOS"];
  return !excluded.some((p) => pos.startsWith(p));
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Tokenise a Japanese string into structured JpToken objects.
 *
 * @param text - Raw Japanese text (may contain kanji, kana, romaji, punctuation)
 * @returns Array of JpToken
 *
 * @example
 * const tokens = await tokenize('私は毎日日本語を勉強しています');
 * // [
 * //   { surface: '私', dictionaryForm: '私', reading: 'わたし', partOfSpeech: '名詞', ... },
 * //   { surface: 'は', dictionaryForm: 'は', reading: 'は', partOfSpeech: '助詞', ... },
 * //   ...
 * // ]
 */
export async function tokenize(text: string): Promise<JpToken[]> {
  const tokenizer = await getTokenizer();
  const raw = tokenizer.tokenize(text);

  return raw.map((t) => ({
    surface: t.surface_form,
    dictionaryForm: t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form,
    reading: t.reading && t.reading !== "*"
      ? katakanaToHiragana(t.reading)
      : t.surface_form,
    partOfSpeech: t.pos ?? "",
    partOfSpeechDetail: t.pos_detail_1 ?? "",
    isWord: isWordToken(t),
  }));
}

/**
 * Tokenise text and return only word tokens (no punctuation/whitespace).
 * Useful when building vocab sets from a lesson.
 */
export async function tokenizeWords(text: string): Promise<JpToken[]> {
  const tokens = await tokenize(text);
  return tokens.filter((t) => t.isWord);
}

/**
 * Extract unique dictionary forms from a text.
 * Used to batch-lookup vocab states after lesson load.
 */
export async function extractUniqueForms(text: string): Promise<string[]> {
  const words = await tokenizeWords(text);
  return [...new Set(words.map((w) => w.dictionaryForm))];
}
