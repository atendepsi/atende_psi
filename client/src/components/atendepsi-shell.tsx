import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Brain,
  Cable,
  Cog,
  LayoutGrid,
  MessageCircle,
  Power,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ShellProps = {
  children: React.ReactNode;
  title?: string;
  right?: React.ReactNode;
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-muted/70 border border-border flex items-center justify-center ap-noise">
        <div className="h-5 w-5 rounded-lg bg-primary/15 border border-primary/25" />
      </div>
      <div className="leading-tight">
        <div
          className="text-[15px] font-semibold tracking-[-0.01em]"
          style={{ fontFamily: "DM Sans, var(--font-sans)" }}
          data-testid="text-brand-name"
        >
          AtendePsi
        </div>
        <div className="text-xs text-muted-foreground" data-testid="text-brand-tagline">
          Tecnologia que acolhe
        </div>
      </div>
    </div>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
};

const nav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, testId: "link-nav-dashboard" },
  { href: "/leads", label: "Leads", icon: BarChart3, testId: "link-nav-leads" },
  { href: "/connections", label: "Conexões", icon: Cable, testId: "link-nav-connections" },
  { href: "/memory", label: "Memória", icon: Brain, testId: "link-nav-memory" },
  { href: "/settings", label: "Configurações", icon: Cog, testId: "link-nav-settings" },
];

function TopBar({ title, right }: { title?: string; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20">
      <div className="pointer-events-none absolute inset-0 ap-glow" />
      <div className="pointer-events-none absolute inset-0 ap-grid" />
      <div className="relative border-b border-border/70 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div
                className="text-sm text-muted-foreground"
                data-testid="text-page-kicker"
              >
                Hoje
              </div>
              <div
                className="text-[18px] font-semibold tracking-[-0.01em]"
                style={{ fontFamily: "DM Sans, var(--font-sans)" }}
                data-testid="text-page-title"
              >
                {title ?? ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground"
                data-testid="status-whatsapp"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                WhatsApp conectado
              </div>
              {right}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AtendePsiShell({ children, title, right }: ShellProps) {
  const [location] = useLocation();
  const [aiOn, setAiOn] = React.useState(true);

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" className="border-r border-sidebar-border/70">
        <SidebarHeader className="px-3 py-4">
          <Brand />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel data-testid="text-nav-label">Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  const active = location === item.href;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "rounded-xl px-3 py-2.5 transition hover-elevate",
                          active && "bg-sidebar-accent/80 text-sidebar-foreground"
                        )}
                      >
                        <Link href={item.href} data-testid={item.testId}>
                          <Icon className="h-[18px] w-[18px] opacity-80" />
                          <span className="text-[13px]">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <div className="ap-card-soft ap-noise rounded-2xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-xs font-medium text-foreground"
                  data-testid="text-ai-title"
                >
                  IA ativa
                </div>
                <div
                  className="text-xs text-muted-foreground"
                  data-testid="text-ai-subtitle"
                >
                  Respondendo no seu tom
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Power className={cn("h-4 w-4", aiOn ? "text-emerald-600" : "text-muted-foreground")} />
                <Switch
                  checked={aiOn}
                  onCheckedChange={setAiOn}
                  data-testid="toggle-ai"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span data-testid="text-ai-hint">Sem ruído. Tudo sob controle.</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="min-h-svh bg-background">
          <TopBar title={title} right={right} />
          <div className="mx-auto w-full max-w-[1200px] px-5 py-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
