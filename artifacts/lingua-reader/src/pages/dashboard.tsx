import { useGetDashboardStats, useGetStatsHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Headphones, Clock, BrainCircuit, Inbox } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: dailyStats } = useGetStatsHistory({ days: 30 });

  const chartData = (dailyStats ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    known: d.knownWordsTotal,
    words: d.wordsRead,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="dashboard">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Known Words</CardTitle>
            <BrainCircuit className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-known-words">{stats.totalKnownWords.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Words Read</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-words-read">{stats.totalWordsRead.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Listening Time</CardTitle>
            <Headphones className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalListeningMinutes / 60).toFixed(1)} hrs</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Time</CardTitle>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalStudyMinutes / 60).toFixed(1)} hrs</div>
          </CardContent>
        </Card>
      </div>

      {/* Known words growth chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Known Words — 30 Day Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradKnown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220, 80%, 55%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(220, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 18%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(230, 15%, 65%)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  tick={{ fill: "hsl(230, 15%, 65%)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230, 25%, 13%)",
                    border: "1px solid hsl(230, 25%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="known"
                  name="Known words"
                  stroke="hsl(220, 80%, 55%)"
                  strokeWidth={2}
                  fill="url(#gradKnown)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lessons Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium" data-testid="stat-in-progress">{stats.lessonsInProgress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">{stats.lessonsCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Lessons</span>
                <span className="font-medium">{stats.totalLessons}</span>
              </div>
              <Link href="/lessons">
                <Button variant="outline" size="sm" className="w-full mt-2">View Lessons</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="text-5xl font-bold text-primary mb-2" data-testid="stat-due-review">{stats.dueForReview}</div>
              <p className="text-muted-foreground mb-4">Items due for review</p>
              {stats.dueForReview > 0 && (
                <Link href="/review">
                  <Button data-testid="button-start-review">
                    <Inbox className="w-4 h-4 mr-2" /> Start Review
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
