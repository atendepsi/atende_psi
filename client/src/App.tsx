import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";

import DashboardPage from "./pages/dashboard";
import LeadsPage from "./pages/leads";
import ConnectionsPage from "./pages/connections";
import MemoryPage from "./pages/memory";
import SettingsPage from "./pages/settings";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/connections" component={ConnectionsPage} />
      <Route path="/memory" component={MemoryPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
