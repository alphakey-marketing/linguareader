import { Router } from "express";
import { DictionaryLookupQueryParams } from "@workspace/api-zod";

const router = Router();

// Built-in fallback dictionary for common Japanese words (MVP without JMdict SQLite)
const COMMON_WORDS: Record<string, {
  headword: string;
  readings: string[];
  senses: Array<{ glosses: string[]; partOfSpeech: string[]; examples: string[] }>;
  jlptLevel: string | null;
  partOfSpeech: string[];
}> = {
  "する": {
    headword: "する",
    readings: ["する"],
    senses: [{ glosses: ["to do", "to carry out", "to perform"], partOfSpeech: ["Suru verb - irregular"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Suru verb - irregular"],
  },
  "ある": {
    headword: "ある",
    readings: ["ある"],
    senses: [{ glosses: ["to be", "to exist", "to have"], partOfSpeech: ["Godan verb with ru ending"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Godan verb"],
  },
  "いる": {
    headword: "いる",
    readings: ["いる"],
    senses: [{ glosses: ["to be (of animate objects)", "to exist"], partOfSpeech: ["Ichidan verb"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Ichidan verb"],
  },
  "言う": {
    headword: "言う",
    readings: ["いう"],
    senses: [{ glosses: ["to say", "to utter", "to declare"], partOfSpeech: ["Godan verb with u ending"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Godan verb"],
  },
  "見る": {
    headword: "見る",
    readings: ["みる"],
    senses: [{ glosses: ["to see", "to look", "to watch"], partOfSpeech: ["Ichidan verb"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Ichidan verb"],
  },
  "行く": {
    headword: "行く",
    readings: ["いく"],
    senses: [{ glosses: ["to go", "to move", "to proceed"], partOfSpeech: ["Godan verb with ku ending"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Godan verb"],
  },
  "来る": {
    headword: "来る",
    readings: ["くる"],
    senses: [{ glosses: ["to come", "to arrive"], partOfSpeech: ["Kuru verb - special class"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Kuru verb"],
  },
  "食べる": {
    headword: "食べる",
    readings: ["たべる"],
    senses: [{ glosses: ["to eat"], partOfSpeech: ["Ichidan verb"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Ichidan verb"],
  },
  "飲む": {
    headword: "飲む",
    readings: ["のむ"],
    senses: [{ glosses: ["to drink", "to gulp", "to swallow"], partOfSpeech: ["Godan verb"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Godan verb"],
  },
  "日本": {
    headword: "日本",
    readings: ["にほん", "にっぽん"],
    senses: [{ glosses: ["Japan"], partOfSpeech: ["Noun"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Noun"],
  },
  "人": {
    headword: "人",
    readings: ["ひと", "じん", "にん"],
    senses: [{ glosses: ["person", "human being"], partOfSpeech: ["Noun"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Noun"],
  },
  "時間": {
    headword: "時間",
    readings: ["じかん"],
    senses: [{ glosses: ["time", "hour", "period"], partOfSpeech: ["Noun"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Noun"],
  },
  "今": {
    headword: "今",
    readings: ["いま"],
    senses: [{ glosses: ["now", "the present time"], partOfSpeech: ["Noun", "Adverb"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Noun"],
  },
  "分かる": {
    headword: "分かる",
    readings: ["わかる"],
    senses: [{ glosses: ["to understand", "to comprehend", "to know"], partOfSpeech: ["Godan verb"], examples: [] }],
    jlptLevel: "N5",
    partOfSpeech: ["Godan verb"],
  },
  "思う": {
    headword: "思う",
    readings: ["おもう"],
    senses: [{ glosses: ["to think", "to consider", "to believe"], partOfSpeech: ["Godan verb"], examples: [] }],
    jlptLevel: "N4",
    partOfSpeech: ["Godan verb"],
  },
};

router.get("/dictionary/lookup", async (req, res) => {
  const parsed = DictionaryLookupQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query" });

  const { word } = parsed.data;

  // Check built-in dictionary first
  const entry = COMMON_WORDS[word];
  if (entry) {
    return res.json([entry]);
  }

  // Fallback: construct a basic entry from the word itself
  const fallback = {
    headword: word,
    readings: [word],
    senses: [
      {
        glosses: [`(${word}) — look up in a full dictionary for meaning`],
        partOfSpeech: [],
        examples: [],
      },
    ],
    jlptLevel: null,
    partOfSpeech: [],
  };

  return res.json([fallback]);
});

export default router;
