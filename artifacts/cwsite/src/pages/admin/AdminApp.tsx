import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { useSession } from "./session";
import LoginPage from "./LoginPage";
import DashboardLayout from "./DashboardLayout";
import OverviewPage from "./OverviewPage";
import PagesListPage from "./pages/PagesListPage";
import NewPage from "./pages/NewPage";
import EditPage from "./pages/EditPage";
import SectionsIndexPage from "./sections/SectionsIndexPage";
import SectionEditorPage from "./sections/SectionEditorPage";
import AssessmentsListPage from "./assessments/AssessmentsListPage";
import AssessmentEditorPage from "./assessments/AssessmentEditorPage";
import BooksPage from "./books/BooksPage";
import MediaPage from "./media/MediaPage";
import LeadsPage from "./leads/LeadsPage";
import SettingsPage from "./settings/SettingsPage";
import NotificationsPage from "./notifications/NotificationsPage";
import ApiKeysPage from "./api-keys/ApiKeysPage";
import NotFound from "@/pages/not-found";

/**
 * Replaces the Next.js middleware: everything outside /login requires an admin
 * session. The admin account is provisioned from the ADMIN_EMAIL / ADMIN_PASSWORD
 * secrets, so there is no in-app claim flow — unauthenticated users go to /login.
 */
function Guarded({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const session = useSession();

  useEffect(() => {
    if (!session.data) return;
    if (session.data.session) return;
    navigate("/login", { replace: true });
  }, [session.data, navigate]);

  if (session.isLoading || !session.data?.session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">
          Loading…
        </p>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function AdminApp() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      {/* The claim/setup flow is retired; keep the old URL working by redirecting. */}
      <Route path="/setup">
        <Redirect to="/login" replace />
      </Route>
      <Route path="/">
        <Guarded>
          <OverviewPage />
        </Guarded>
      </Route>
      <Route path="/pages">
        <Guarded>
          <PagesListPage />
        </Guarded>
      </Route>
      <Route path="/pages/new">
        <Guarded>
          <NewPage />
        </Guarded>
      </Route>
      <Route path="/pages/:id">
        {(params) => (
          <Guarded>
            <EditPage id={params.id} />
          </Guarded>
        )}
      </Route>
      <Route path="/sections">
        <Guarded>
          <SectionsIndexPage />
        </Guarded>
      </Route>
      <Route path="/sections/:type">
        {(params) => (
          <Guarded>
            <SectionEditorPage type={params.type} />
          </Guarded>
        )}
      </Route>
      <Route path="/assessments">
        <Guarded>
          <AssessmentsListPage />
        </Guarded>
      </Route>
      <Route path="/assessments/:slug">
        {(params) => (
          <Guarded>
            <AssessmentEditorPage slug={params.slug} />
          </Guarded>
        )}
      </Route>
      <Route path="/books">
        <Guarded>
          <BooksPage />
        </Guarded>
      </Route>
      <Route path="/media">
        <Guarded>
          <MediaPage />
        </Guarded>
      </Route>
      <Route path="/leads">
        <Guarded>
          <LeadsPage />
        </Guarded>
      </Route>
      <Route path="/settings">
        <Guarded>
          <SettingsPage />
        </Guarded>
      </Route>
      <Route path="/notifications">
        <Guarded>
          <NotificationsPage />
        </Guarded>
      </Route>
      <Route path="/api-keys">
        <Guarded>
          <ApiKeysPage />
        </Guarded>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}
