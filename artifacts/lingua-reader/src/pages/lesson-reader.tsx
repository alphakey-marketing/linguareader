import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetLesson,
  getGetLessonQueryKey,
  useGetLessonStats,
  getGetLessonStatsQueryKey,
  useLookupVocab,
  useUpsertVocab,
  useDictionaryLookup,
  getGetVocabSummaryQueryKey,
  getDictionaryLookupQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Loader2, X, BookOpen, CheckCheck, Ban } from "lucide-react";

interface Token {
  surface: string;
  dictionaryForm: string;
  reading: string;
}

interface VocabState {
  id: string;
  status: number;
  reading: string;
  note?: string | null;
}

function tokenizeText(text: string): Token[] {
  const pattern = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u2e80-\u2eff]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+|[a-zA-Z0-9]+|[^\s\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff]/g;
  const matches: string[] = text.match(pattern) ?? [];
  return matches
    .filter((s) => s.trim())
    .map((s) => ({ surface: s, dictionaryForm: s, reading: s }));
}

function getTokenClass(status: number): string {
  const base = "vocab-token";
  if (status === 0) return `${base} vocab-token-0`;
  if (status === 1) return `${base} vocab-token-1`;
  if (status === 2) return `${base} vocab-token-2`;
  if (status === 3) return `${base} vocab-token-3`;
  if (status === 4) return `${base} vocab-token-4`;
  if (status === 5) return `${base} vocab-token-5`;
  if (status === 99) return `${base} vocab-token-99`;
  return `${base} vocab-token-0`;
}

interface WordPopupProps {
  token: Token;
  vocabState: VocabState | null;
  onClose: () => void;
  onUpdateStatus: (status: number) => void;
  lessonId: string;
}

function WordPopup({ token, vocabState, onClose, onUpdateStatus }: WordPopupProps) {
  const { data: entries, isLoading } = useDictionaryLookup(
    { word: token.dictionaryForm },
    { query: { queryKey: getDictionaryLookupQueryKey({ word: token.dictionaryForm }) } }
  );

  const currentStatus = vocabState?.status ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" data-testid="word-popup">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div>
            <div className="text-2xl font-bold text-foreground">{token.surface}</div>
            {token.reading !== token.surface && (
              <div className="text-sm text-muted-foreground mt-0.5">{token.reading}</div>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1" data-testid="button-close-popup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : entries && entries.length > 0 ? (
            entries.slice(0, 2).map((entry, i) => (
              <div key={i} className="space-y-1">
                {entry.readings && entry.readings.length > 0 && (
                  <div className="text-xs text-primary font-medium">{entry.readings.join(" / ")}</div>
                )}
                {entry.senses?.slice(0, 3).map((sense, j) => (
                  <div key={j} className="text-sm text-foreground">
                    {j + 1}. {sense.glosses?.join("; ")}
                    {sense.partOfSpeech && sense.partOfSpeech.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">({sense.partOfSpeech[0]})</span>
                    )}
                  </div>
                ))}
                {entry.jlptLevel && (
                  <Badge variant="outline" className="text-xs">{entry.jlptLevel}</Badge>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No dictionary entry found.</p>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Status</div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={currentStatus >= 1 && currentStatus <= 4 ? "default" : "outline"}
              onClick={() => {
                const next = Math.min(4, (currentStatus === 0 || currentStatus === 99 ? 0 : currentStatus) + 1);
                onUpdateStatus(next === 0 ? 1 : next);
              }}
              data-testid="button-mark-learning"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Learning {currentStatus >= 1 && currentStatus <= 4 ? `(${currentStatus}/4)` : ""}
            </Button>
            <Button
              size="sm"
              variant={currentStatus === 5 ? "default" : "outline"}
              onClick={() => onUpdateStatus(5)}
              data-testid="button-mark-known"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Known
            </Button>
            <Button
              size="sm"
              variant={currentStatus === 99 ? "secondary" : "ghost"}
              onClick={() => onUpdateStatus(99)}
              data-testid="button-mark-ignored"
            >
              <Ban className="w-3 h-3 mr-1" />
              Ignore
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LessonReader() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showFurigana, setShowFurigana] = useState(true);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [vocabStates, setVocabStates] = useState<Record<string, VocabState>>({});
  const [vocabLoaded, setVocabLoaded] = useState(false);

  const { data: lesson, isLoading: lessonLoading } = useGetLesson(id!, {
    query: { queryKey: getGetLessonQueryKey(id!) },
  });
  const { data: stats } = useGetLessonStats(id!, {
    query: { queryKey: getGetLessonStatsQueryKey(id!) },
  });

  const lookupVocab = useLookupVocab();
  const upsertVocab = useUpsertVocab();

  const tokens: Token[] = lesson?.tokens
    ? (() => {
        try {
          return JSON.parse(lesson.tokens) as Token[];
        } catch {
          return tokenizeText(lesson.rawText);
        }
      })()
    : lesson?.rawText
    ? tokenizeText(lesson.rawText)
    : [];

  // Load vocab states once when lesson and tokens are available
  useEffect(() => {
    if (!lesson || vocabLoaded || tokens.length === 0) return;
    const dictionaryForms = [...new Set(tokens.map((t) => t.dictionaryForm))];
    lookupVocab.mutate(
      { data: { dictionaryForms } },
      {
        onSuccess: (data) => {
          setVocabStates(data as Record<string, VocabState>);
          setVocabLoaded(true);
        },
        onError: () => setVocabLoaded(true),
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  const handleTokenClick = useCallback((token: Token) => {
    // Skip punctuation
    if (/^[。、！？「」（）\s\n\r,.\-_]+$/.test(token.surface)) return;
    setSelectedToken(token);
  }, []);

  const handleUpdateStatus = useCallback(
    (status: number) => {
      if (!selectedToken) return;
      upsertVocab.mutate(
        {
          data: {
            surface: selectedToken.surface,
            dictionaryForm: selectedToken.dictionaryForm,
            reading: selectedToken.reading,
            status,
            sourceLessonId: id,
          },
        },
        {
          onSuccess: (updated) => {
            setVocabStates((prev) => ({
              ...prev,
              [updated.dictionaryForm]: updated,
            }));
            queryClient.invalidateQueries({ queryKey: getGetVocabSummaryQueryKey() });
          },
        }
      );
    },
    [selectedToken, id, upsertVocab, queryClient]
  );

  if (lessonLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Lesson not found.</p>
        <Button onClick={() => setLocation("/lessons")} className="mt-4">
          Back to Lessons
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="lesson-reader">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/lessons")} data-testid="button-back-lessons">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{lesson.title}</h1>
            {stats && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">{stats.percentKnown}% known</span>
                <span className="text-sm text-muted-foreground">{stats.totalTokens} words</span>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFurigana(!showFurigana)}
          data-testid="button-toggle-furigana"
        >
          {showFurigana ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="ml-1 text-xs">Ruby</span>
        </Button>
      </div>

      {/* Vocab status legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { label: "Unknown", cls: "vocab-token-0 vocab-token" },
          { label: "Learning", cls: "vocab-token-2 vocab-token" },
          { label: "Near known", cls: "vocab-token-4 vocab-token" },
          { label: "Known", cls: "vocab-token-5 vocab-token text-muted-foreground" },
          { label: "Ignored", cls: "vocab-token-99 vocab-token" },
        ].map(({ label, cls }) => (
          <span key={label} className={`px-2 py-0.5 rounded ${cls}`}>
            {label}
          </span>
        ))}
        {!vocabLoaded && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading vocab states...
          </span>
        )}
      </div>

      {/* Reader */}
      <div
        className="leading-relaxed text-lg bg-card rounded-xl border border-border p-6 min-h-[40vh]"
        style={{ fontFamily: "var(--app-font-serif)", lineHeight: "2.5" }}
        data-testid="reader-content"
      >
        {tokens.map((token, idx) => {
          const state = vocabStates[token.dictionaryForm];
          const status = state?.status ?? 0;
          const isPunct = /^[。、！？「」（）\s\n\r,.\-_]+$/.test(token.surface);

          if (token.surface === "\n") return <br key={idx} />;

          if (isPunct) {
            return (
              <span key={idx} className="text-foreground/60">
                {token.surface}
              </span>
            );
          }

          if (showFurigana && token.reading && token.reading !== token.surface && /[\u4e00-\u9fff]/.test(token.surface)) {
            return (
              <ruby
                key={idx}
                className={getTokenClass(status)}
                onClick={() => handleTokenClick(token)}
                data-testid={`token-${idx}`}
              >
                {token.surface}
                <rt className="text-xs opacity-80">{token.reading}</rt>
              </ruby>
            );
          }

          return (
            <span
              key={idx}
              className={getTokenClass(status)}
              onClick={() => handleTokenClick(token)}
              data-testid={`token-${idx}`}
            >
              {token.surface}
            </span>
          );
        })}
      </div>

      {/* Word popup */}
      {selectedToken && (
        <WordPopup
          token={selectedToken}
          vocabState={vocabStates[selectedToken.dictionaryForm] ?? null}
          onClose={() => setSelectedToken(null)}
          onUpdateStatus={handleUpdateStatus}
          lessonId={id!}
        />
      )}
    </div>
  );
}
