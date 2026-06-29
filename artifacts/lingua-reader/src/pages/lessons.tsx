import { useGetLessons } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Link as LinkIcon, Youtube, Headphones, BookOpen } from "lucide-react";

export default function Lessons() {
  const { data: lessons, isLoading } = useGetLessons();

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "text": return <FileText className="w-4 h-4" />;
      case "url": return <LinkIcon className="w-4 h-4" />;
      case "youtube": return <Youtube className="w-4 h-4" />;
      case "audio": return <Headphones className="w-4 h-4" />;
      case "epub": return <BookOpen className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">Lessons</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lessons</h1>
        <Link href="/import" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors">
          New Lesson
        </Link>
      </div>

      {!lessons?.length ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No lessons yet</h3>
          <p className="text-muted-foreground max-w-md mt-2 mb-6">
            Import text, a webpage, or a YouTube video to start learning Japanese.
          </p>
          <Link href="/import" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors">
            Import Content
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer flex flex-col group border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {lesson.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    {getSourceIcon(lesson.sourceType)}
                    <span className="capitalize">{lesson.sourceType}</span>
                  </div>
                  <p>{lesson.wordCount} words</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Badge variant={lesson.status === 'completed' ? 'secondary' : lesson.status === 'in_progress' ? 'default' : 'outline'}>
                    {lesson.status.replace('_', ' ')}
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
