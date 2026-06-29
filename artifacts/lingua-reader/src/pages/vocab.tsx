import { useState } from "react";
import { useGetVocab, useGetVocabSummary, getGetVocabQueryKey, getGetVocabSummaryQueryKey, useUpdateVocabEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, BookOpen, HelpCircle, EyeOff } from "lucide-react";

const STATUS_LABELS: Record<number, string> = {
  0: "Unknown",
  1: "Learning 1",
  2: "Learning 2",
  3: "Learning 3",
  4: "Learning 4",
  5: "Known",
  99: "Ignored",
};

const STATUS_CLASSES: Record<number, string> = {
  0: "vocab-token vocab-token-0",
  1: "vocab-token vocab-token-1",
  2: "vocab-token vocab-token-2",
  3: "vocab-token vocab-token-3",
  4: "vocab-token vocab-token-4",
  5: "vocab-token vocab-token-5",
  99: "vocab-token vocab-token-99",
};

export default function Vocab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const filterStatus = statusFilter === "all" ? undefined : parseInt(statusFilter);
  const vocabParams = filterStatus !== undefined
    ? { status: filterStatus, limit: LIMIT, offset }
    : { limit: LIMIT, offset };
  const { data: entries, isLoading } = useGetVocab(
    vocabParams,
    { query: { queryKey: getGetVocabQueryKey(vocabParams) } }
  );

  const { data: summary } = useGetVocabSummary();
  const updateVocab = useUpdateVocabEntry();

  function handleStatusChange(id: string, newStatus: number) {
    updateVocab.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetVocabQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetVocabSummaryQueryKey() });
        },
      }
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="vocab-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vocabulary</h1>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BrainCircuit className="w-3 h-3" /> Known
              </div>
              <div className="text-2xl font-bold text-foreground" data-testid="count-known">{summary.known}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BookOpen className="w-3 h-3" /> Learning
              </div>
              <div className="text-2xl font-bold text-foreground" data-testid="count-learning">{summary.learning}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <HelpCircle className="w-3 h-3" /> Unknown
              </div>
              <div className="text-2xl font-bold text-foreground" data-testid="count-unknown">{summary.unknown}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <EyeOff className="w-3 h-3" /> Ignored
              </div>
              <div className="text-2xl font-bold text-foreground" data-testid="count-ignored">{summary.ignored}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setOffset(0); }}>
          <SelectTrigger className="w-48" data-testid="select-vocab-filter">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All words</SelectItem>
            <SelectItem value="0">Unknown</SelectItem>
            <SelectItem value="1">Learning 1</SelectItem>
            <SelectItem value="2">Learning 2</SelectItem>
            <SelectItem value="3">Learning 3</SelectItem>
            <SelectItem value="4">Learning 4</SelectItem>
            <SelectItem value="5">Known</SelectItem>
            <SelectItem value="99">Ignored</SelectItem>
          </SelectContent>
        </Select>
        {entries && (
          <span className="text-sm text-muted-foreground">{entries.length} words shown</span>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : !entries?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No vocabulary entries yet.</p>
          <p className="text-sm mt-1">Tap words while reading to add them here.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Word</TableHead>
                <TableHead>Reading</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seen</TableHead>
                <TableHead>Next Review</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} data-testid={`vocab-row-${entry.id}`} className="hover:bg-muted/30">
                  <TableCell>
                    <span className={`text-base px-1.5 py-0.5 rounded ${STATUS_CLASSES[entry.status] || ""}`}>
                      {entry.surface}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{entry.reading}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[entry.status] ?? `Status ${entry.status}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{entry.timesSeen}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {entry.nextReview
                      ? new Date(entry.nextReview).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={String(entry.status)}
                      onValueChange={(v) => handleStatusChange(entry.id, parseInt(v))}
                    >
                      <SelectTrigger className="h-7 text-xs w-28" data-testid={`select-vocab-status-${entry.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {entries && entries.length === LIMIT && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0} data-testid="button-vocab-prev">
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(offset + LIMIT)} data-testid="button-vocab-next">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
