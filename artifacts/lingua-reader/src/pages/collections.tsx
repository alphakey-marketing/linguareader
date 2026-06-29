import { useState } from "react";
import {
  useGetCollections,
  getGetCollectionsQueryKey,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Layers, Plus, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CollectionEntry {
  id: string;
  name: string;
  description?: string | null;
  lessonCount: number;
}

export default function Collections() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: collections, isLoading } = useGetCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CollectionEntry | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function openCreate() {
    setName("");
    setDescription("");
    setCreateOpen(true);
  }

  function openEdit(c: CollectionEntry) {
    setEditTarget(c);
    setName(c.name);
    setDescription(c.description ?? "");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createCollection.mutate(
      { data: { name, description: description || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCollectionsQueryKey() });
          setCreateOpen(false);
          toast({ title: "Collection created" });
        },
        onError: () => toast({ title: "Failed to create collection", variant: "destructive" }),
      }
    );
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !name.trim()) return;
    updateCollection.mutate(
      { id: editTarget.id, data: { name, description: description || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCollectionsQueryKey() });
          setEditTarget(null);
          toast({ title: "Collection updated" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: string, collectionName: string) {
    if (!confirm(`Delete "${collectionName}"? Lessons will not be deleted.`)) return;
    deleteCollection.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCollectionsQueryKey() });
          toast({ title: "Collection deleted" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="collections-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Collections</h1>
        <Button onClick={openCreate} data-testid="button-create-collection">
          <Plus className="w-4 h-4 mr-2" /> New Collection
        </Button>
      </div>

      {!collections?.length ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Layers className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No collections yet</h3>
          <p className="text-muted-foreground max-w-sm mt-2 mb-6">
            Organize your lessons into collections like "NHK News", "Anime Subs", or "Novels".
          </p>
          <Button onClick={openCreate} data-testid="button-create-collection-empty">
            <Plus className="w-4 h-4 mr-2" /> Create Collection
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(collections as CollectionEntry[]).map((c) => (
            <Card key={c.id} className="flex flex-col border-border/50 hover:border-border transition-colors" data-testid={`collection-card-${c.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{c.name}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)} data-testid={`button-edit-collection-${c.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id, c.name)} data-testid={`button-delete-collection-${c.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {c.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{c.lessonCount} lesson{c.lessonCount !== 1 ? "s" : ""}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-name">Name</Label>
              <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NHK Easy News" data-testid="input-collection-name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-desc">Description (optional)</Label>
              <Textarea id="create-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this collection for?" data-testid="input-collection-description" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCollection.isPending} data-testid="button-confirm-create-collection">
                {createCollection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-edit-collection-name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-desc">Description (optional)</Label>
              <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-edit-collection-description" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={updateCollection.isPending} data-testid="button-confirm-edit-collection">
                {updateCollection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
