import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutDashboard, Map, BarChart3, List, Bot, FileText } from "lucide-react";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import IncidentsPage from "@/pages/incidents";
import AnalyticsPage from "@/pages/analytics";
import MapPage from "@/pages/map";
import AgentPage from "@/pages/agent";
import DocumentsPage from "@/pages/documents";

const queryClient = new QueryClient();

function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/incidents", label: "Incidents", icon: List },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/map", label: "Hotspots", icon: Map },
    { href: "/agent", label: "AI Agent", icon: Bot },
    { href: "/documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight">CRIMELAB OS</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Command Center</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/incidents" component={IncidentsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/map" component={MapPage} />
        <Route path="/agent" component={AgentPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Ensure dark mode is active by default
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

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
