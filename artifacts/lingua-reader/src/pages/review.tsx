import { useState } from "react";
import { useGetSrsQueue, useSubmitSrsReview, getGetSrsQueueQueryKey, getGetVocabSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Inbox, RotateCcw } from "lucide-react";

interface SrsCard {
  vocabEntry: {
    id: string;
    surface: string;
    dictionaryForm: string;
    reading: string;
    status: number;
    note?: string | null;
  };
  contextSentence: string;
  lessonTitle?: string | null;
}

export default function Review() {
  const queryClient = useQueryClient();
  const { data: queue, isLoading } = useGetSrsQueue();
  const submitReview = useSubmitSrsReview();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const cards = (queue ?? []) as SrsCard[];
  const total = cards.length;
  const current = cards[index];

  function handleRate(quality: number) {
    if (!current) return;
    submitReview.mutate(
      { data: { vocabId: current.vocabEntry.id, quality } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetVocabSummaryQueryKey() });
          if (index + 1 >= total) {
            setDone(true);
          } else {
            setIndex((i) => i + 1);
            setRevealed(false);
          }
        },
      }
    );
  }

  function handleRestart() {
    queryClient.invalidateQueries({ queryKey: getGetSrsQueueQueryKey() });
    setIndex(0);
    setRevealed(false);
    setDone(false);
  }

  function highlightWord(sentence: string, surface: string, dictForm: string): React.ReactNode {
    const pattern = new RegExp(`(${surface.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${dictForm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "g");
    const parts = sentence.split(pattern);
    return parts.map((part, i) =>
      part === surface || part === dictForm ? (
        <mark key={i} className="bg-primary/30 text-primary rounded px-0.5 font-bold">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (done || total === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4" data-testid="review-complete">
        {total === 0 ? (
          <>
            <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">No reviews due</h2>
            <p className="text-muted-foreground">You are all caught up. Keep reading to add more words to review.</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Session complete!</h2>
            <p className="text-muted-foreground">You reviewed {total} word{total !== 1 ? "s" : ""}. Great work.</p>
          </>
        )}
        <Button onClick={handleRestart} variant="outline" data-testid="button-restart-review">
          <RotateCcw className="w-4 h-4 mr-2" /> Check again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6" data-testid="review-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review</h1>
        <span className="text-muted-foreground text-sm" data-testid="review-progress">
          {index + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <Card className="min-h-[280px] flex flex-col" data-testid="review-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="text-sm text-muted-foreground">
            {current.lessonTitle && <span className="truncate block">{current.lessonTitle}</span>}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center p-6 space-y-4">
          {/* Context sentence */}
          <div
            className="text-base leading-relaxed text-center"
            style={{ fontFamily: "var(--app-font-serif)" }}
            data-testid="review-context"
          >
            {highlightWord(current.contextSentence, current.vocabEntry.surface, current.vocabEntry.dictionaryForm)}
          </div>

          {/* Word and reading (revealed) */}
          {revealed ? (
            <div className="text-center space-y-1 animate-in fade-in duration-200">
              <div className="text-4xl font-bold text-primary">{current.vocabEntry.surface}</div>
              {current.vocabEntry.reading !== current.vocabEntry.surface && (
                <div className="text-lg text-muted-foreground">{current.vocabEntry.reading}</div>
              )}
              <Badge variant="outline" className="text-xs">
                {current.vocabEntry.status === 1 ? "Learning 1" :
                 current.vocabEntry.status === 2 ? "Learning 2" :
                 current.vocabEntry.status === 3 ? "Learning 3" :
                 current.vocabEntry.status === 4 ? "Learning 4" : "Learning"}
              </Badge>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button onClick={() => setRevealed(true)} data-testid="button-show-answer">
                Show answer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating buttons */}
      {revealed && (
        <div className="grid grid-cols-4 gap-2 animate-in fade-in duration-200" data-testid="review-rating-buttons">
          <Button
            variant="outline"
            className="border-red-800/50 hover:bg-red-950 hover:text-red-300"
            onClick={() => handleRate(0)}
            disabled={submitReview.isPending}
            data-testid="button-rate-again"
          >
            Again
          </Button>
          <Button
            variant="outline"
            className="border-orange-800/50 hover:bg-orange-950 hover:text-orange-300"
            onClick={() => handleRate(2)}
            disabled={submitReview.isPending}
            data-testid="button-rate-hard"
          >
            Hard
          </Button>
          <Button
            variant="outline"
            className="border-blue-800/50 hover:bg-blue-950 hover:text-blue-300"
            onClick={() => handleRate(4)}
            disabled={submitReview.isPending}
            data-testid="button-rate-good"
          >
            Good
          </Button>
          <Button
            variant="outline"
            className="border-green-800/50 hover:bg-green-950 hover:text-green-300"
            onClick={() => handleRate(5)}
            disabled={submitReview.isPending}
            data-testid="button-rate-easy"
          >
            Easy
          </Button>
        </div>
      )}

      {/* Rating labels */}
      {revealed && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <span className="text-xs text-muted-foreground">&lt;1d</span>
          <span className="text-xs text-muted-foreground">3d</span>
          <span className="text-xs text-muted-foreground">Good</span>
          <span className="text-xs text-muted-foreground">Easy</span>
        </div>
      )}
    </div>
  );
}
