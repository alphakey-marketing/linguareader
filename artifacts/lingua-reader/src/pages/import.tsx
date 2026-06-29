import { useState } from "react";
import { useLocation } from "wouter";
import { useImportText, useImportUrl, useImportYoutube, useGetCollections, getGetLessonsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Link, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Import() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: collections } = useGetCollections();

  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [textCollection, setTextCollection] = useState("");

  const [urlInput, setUrlInput] = useState("");
  const [urlCollection, setUrlCollection] = useState("");

  const [ytUrl, setYtUrl] = useState("");
  const [ytCollection, setYtCollection] = useState("");

  const importText = useImportText();
  const importUrl = useImportUrl();
  const importYoutube = useImportYoutube();

  function onSuccess(lessonId: string) {
    queryClient.invalidateQueries({ queryKey: getGetLessonsQueryKey() });
    setLocation(`/lessons/${lessonId}`);
  }

  function handleTextImport(e: React.FormEvent) {
    e.preventDefault();
    if (!textTitle.trim() || !textBody.trim()) {
      toast({ title: "Please fill in both title and text", variant: "destructive" });
      return;
    }
    importText.mutate(
      { data: { title: textTitle, text: textBody, collectionId: textCollection || null } },
      {
        onSuccess: (lesson) => onSuccess(lesson.id),
        onError: () => toast({ title: "Import failed", variant: "destructive" }),
      }
    );
  }

  function handleUrlImport(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast({ title: "Please enter a URL", variant: "destructive" });
      return;
    }
    importUrl.mutate(
      { data: { url: urlInput, collectionId: urlCollection || null } },
      {
        onSuccess: (lesson) => onSuccess(lesson.id),
        onError: () => toast({ title: "Import failed", variant: "destructive" }),
      }
    );
  }

  function handleYtImport(e: React.FormEvent) {
    e.preventDefault();
    if (!ytUrl.trim()) {
      toast({ title: "Please enter a YouTube URL", variant: "destructive" });
      return;
    }
    importYoutube.mutate(
      { data: { url: ytUrl, collectionId: ytCollection || null } },
      {
        onSuccess: (lesson) => onSuccess(lesson.id),
        onError: () => toast({ title: "Import failed", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="import-page">
      <div>
        <h1 className="text-3xl font-bold">Import Content</h1>
        <p className="text-muted-foreground mt-1">Add Japanese text to your library to read and study.</p>
      </div>

      <Tabs defaultValue="text">
        <TabsList className="w-full">
          <TabsTrigger value="text" className="flex-1" data-testid="tab-text">
            <FileText className="w-4 h-4 mr-2" /> Paste Text
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1" data-testid="tab-url">
            <Link className="w-4 h-4 mr-2" /> Web URL
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex-1" data-testid="tab-youtube">
            <Youtube className="w-4 h-4 mr-2" /> YouTube
          </TabsTrigger>
        </TabsList>

        {/* Paste Text */}
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Paste Japanese Text</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTextImport} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="text-title">Lesson Title</Label>
                  <Input
                    id="text-title"
                    placeholder="e.g. NHK News Article"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    data-testid="input-text-title"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="text-body">Japanese Text</Label>
                  <Textarea
                    id="text-body"
                    placeholder="今日は良い天気ですね..."
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    className="min-h-[180px] font-serif text-base leading-relaxed"
                    data-testid="textarea-text-body"
                  />
                </div>
                {collections && collections.length > 0 && (
                  <div className="space-y-1">
                    <Label>Collection (optional)</Label>
                    <Select value={textCollection} onValueChange={setTextCollection}>
                      <SelectTrigger data-testid="select-text-collection">
                        <SelectValue placeholder="Select collection..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No collection</SelectItem>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" disabled={importText.isPending} className="w-full" data-testid="button-import-text">
                  {importText.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</> : "Create Lesson"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* URL Import */}
        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle>Import from URL</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlImport} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="url-input">Web URL</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://www3.nhk.or.jp/news/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    data-testid="input-url"
                  />
                  <p className="text-xs text-muted-foreground">The main article text will be extracted automatically.</p>
                </div>
                {collections && collections.length > 0 && (
                  <div className="space-y-1">
                    <Label>Collection (optional)</Label>
                    <Select value={urlCollection} onValueChange={setUrlCollection}>
                      <SelectTrigger data-testid="select-url-collection">
                        <SelectValue placeholder="Select collection..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No collection</SelectItem>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" disabled={importUrl.isPending} className="w-full" data-testid="button-import-url">
                  {importUrl.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching...</> : "Import Article"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* YouTube Import */}
        <TabsContent value="youtube">
          <Card>
            <CardHeader>
              <CardTitle>Import YouTube Subtitles</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleYtImport} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="yt-url">YouTube URL</Label>
                  <Input
                    id="yt-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    data-testid="input-youtube-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Japanese subtitles will be fetched. Requires yt-dlp installed on the server.
                  </p>
                </div>
                {collections && collections.length > 0 && (
                  <div className="space-y-1">
                    <Label>Collection (optional)</Label>
                    <Select value={ytCollection} onValueChange={setYtCollection}>
                      <SelectTrigger data-testid="select-yt-collection">
                        <SelectValue placeholder="Select collection..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No collection</SelectItem>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" disabled={importYoutube.isPending} className="w-full" data-testid="button-import-youtube">
                  {importYoutube.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</> : "Import Subtitles"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
