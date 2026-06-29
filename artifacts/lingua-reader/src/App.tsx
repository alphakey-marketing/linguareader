import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Lessons from "@/pages/lessons";
import LessonReader from "@/pages/lesson-reader";
import Review from "@/pages/review";
import Vocab from "@/pages/vocab";
import Collections from "@/pages/collections";
import Import from "@/pages/import";

const queryClient = new QueryClient();

function RedirectToDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={RedirectToDashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/lessons" component={Lessons} />
        <Route path="/lessons/:id" component={LessonReader} />
        <Route path="/review" component={Review} />
        <Route path="/vocab" component={Vocab} />
        <Route path="/collections" component={Collections} />
        <Route path="/import" component={Import} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
