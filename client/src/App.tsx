import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";

import DashboardPage from "./pages/dashboard";
import LeadsPage from "./pages/leads";
import ConnectionsPage from "./pages/connections";
import MemoryPage from "./pages/memory";
import SettingsPage from "./pages/settings";
import AuthPage from "./pages/auth";
import ActivatePage from "./pages/activate";
import NotFound from "./pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Or a spinner component
  if (!user) return <AuthPage />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/activate" component={ActivatePage} />
      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/leads">
        <ProtectedRoute component={LeadsPage} />
      </Route>
      <Route path="/connections">
        <ProtectedRoute component={ConnectionsPage} />
      </Route>
      <Route path="/memory">
        <ProtectedRoute component={MemoryPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
