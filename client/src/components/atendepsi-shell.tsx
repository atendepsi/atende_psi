import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Brain,
  Cable,
  Cog,
  LayoutDashboard,
  Users,
  Zap,
  Database,
  Settings,
  LayoutGrid,
  MessageCircle,
  Power,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

import logoUrl from "@/assets/logo.png";

function Brand() {
  return (
    <div className="flex items-center w-full justify-center">
      {/* Maximized logo: scaled up to crop whitespace and fill width */}
      <img
        src={logoUrl}
        alt="AtendePsi"
        className="h-[140px] w-full object-contain"
      />
    </div>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
};

import dashboardIcon from "@/assets/icons/dashboard.png";
import leadsIcon from "@/assets/icons/leads.png";
import connectionsIcon from "@/assets/icons/connections.png";
import memoryIcon from "@/assets/icons/memory.png";
import settingsIcon from "@/assets/icons/settings.png";

function IconDashboard({ className }: { className?: string }) {
  return <img src={dashboardIcon} className={className} alt="Dashboard" />;
}

function IconLeads({ className }: { className?: string }) {
  return <img src={leadsIcon} className={className} alt="Contatos" />;
}

function IconConnections({ className }: { className?: string }) {
  return <img src={connectionsIcon} className={className} alt="Conexões" />;
}

function IconMemory({ className }: { className?: string }) {
  return <img src={memoryIcon} className={className} alt="Memória" />;
}

function IconSettings({ className }: { className?: string }) {
  return <img src={settingsIcon} className={className} alt="Configurações" />;
}

const nav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: IconDashboard, testId: "link-nav-dashboard" },
  { href: "/leads", label: "Contatos", icon: IconLeads, testId: "link-nav-leads" },
  { href: "/connections", label: "Conexões", icon: IconConnections, testId: "link-nav-connections" },
  { href: "/memory", label: "Memória", icon: IconMemory, testId: "link-nav-memory" },
  { href: "/settings", label: "Configurações", icon: IconSettings, testId: "link-nav-settings" },
];

function BreathingAnimation() {
  const [phase, setPhase] = React.useState(0);
  // 0: Init, 1: Reveal "Respire.", 2: Pause, 3: Reveal rest

  React.useEffect(() => {
    // Sequence
    const t1 = setTimeout(() => setPhase(1), 500); // Start "Respire."
    // Part 1 takes 1.5s. Ends at 2000ms.
    // Pause for 1s.
    const t2 = setTimeout(() => setPhase(2), 2000); // Finished "Respire."
    const t3 = setTimeout(() => setPhase(3), 3000); // Start "Estamos..."

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Utility for gradient reveal
  const getGradientStyle = (isRevealed: boolean) => ({
    // Soft edge: color until 45%, fades to transparent by 55%
    backgroundImage: `linear-gradient(90deg, #000000 0%, #000000 45%, transparent 55%)`,
    backgroundSize: "250% 100%", // Increased size to accommodate softer edge
    backgroundPosition: isRevealed ? "0% 0" : "100% 0",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "transparent",
    transition: "background-position linear",
  });

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none hidden md:block w-full text-center">
      <div className="text-3xl leading-relaxed whitespace-nowrap text-black antialiased opacity-90">
        {/* Part 1: Respire. (Cursive) */}
        <span
          className="font-['Pacifico']"
          style={{
            ...getGradientStyle(phase >= 1),
            transitionDuration: "1.5s"
          }}
        >
          Respire.
        </span>

        {/* Part 2: Rest of text (Sans-serif - Inter) */}
        <span
          className="font-['Inter'] text-lg font-medium tracking-wide ml-2"
          style={{
            ...getGradientStyle(phase >= 3),
            transitionDuration: "4.2s",
          }}
        >
          Estamos organizando tudo por você.
        </span>
      </div>
    </div>
  );
}

function TopBar({ title, right }: { title?: string; right?: React.ReactNode }) {
  const [location] = useLocation();
  const showAnimation = location === "/";

  return (
    <div className="sticky top-0 z-20">
      {/* Warm Gray Background - Darkened further */}
      <div className="relative border-b border-border/50 bg-[#e7e5e4] backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-8 relative">

          {/* Centered Animation - Only on Dashboard */}
          {showAnimation && <BreathingAnimation />}

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div>
              {/* Removed "Hoje" kicker */}
              <div
                className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90"
                data-testid="text-page-title"
              >
                {title ?? ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Removed WhatsApp status from here */}
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
    <SidebarProvider defaultOpen style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <Sidebar variant="inset" className="border-r border-sidebar-border/70">
        <SidebarHeader className="px-1 py-6 overflow-hidden">
          <Brand />
        </SidebarHeader>

        <SidebarContent className="px-3">
          <SidebarGroup>
            <SidebarGroupLabel data-testid="text-nav-label" className="px-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {nav.map((item) => {
                  const active = location === item.href;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "rounded-xl px-4 py-3 transition-all hover-elevate group h-auto",
                          active
                            ? "bg-[#e6f4f9] text-[#006f9a] shadow-sm ring-1 ring-[#006f9a]/20"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Link href={item.href} data-testid={item.testId}>
                          <Icon className={cn(
                            "h-[22px] w-[22px] transition-all",
                            active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                          )} />
                          <span className={cn(
                            "text-[15px] ml-3 font-medium tracking-wide",
                            active ? "font-semibold" : "font-medium"
                          )}>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 mt-auto">
          {/* Contact Block - Updated Copy */}

        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex h-full flex-col bg-background overflow-hidden relative">
          <div className="flex-1 min-h-0 mx-auto w-full max-w-[1200px] px-5 py-6 overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
