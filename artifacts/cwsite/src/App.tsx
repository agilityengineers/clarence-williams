import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import PublicPage from "@/pages/site/PublicPage";
import AssessmentPage from "@/pages/site/AssessmentPage";
import AdminApp from "@/pages/admin/AdminApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicPage slug="home" />
      </Route>
      <Route path="/assessment/:slug">
        {(params) => <AssessmentPage slug={params.slug} />}
      </Route>
      <Route path="/admin" nest>
        <AdminApp />
      </Route>
      <Route path="/:slug">
        {(params) => <PublicPage slug={params.slug} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
