import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { ChartDataPoint } from "@/types/dashboard";

const OlaAnimation = ({ name }: { name: string }) => {
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)) 45%, transparent 65%)`,
    backgroundSize: "200% 100%",
    backgroundPosition: revealed ? "0% 0" : "100% 0",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "transparent",
    opacity: revealed ? 1 : 0,
    transition: "background-position 4.0s ease-in-out, opacity 4.0s ease-in-out",
  };

  return (
    <div className="mb-0 leading-tight py-1 pr-8">
      <span
        className="font-['Caveat'] font-bold text-[5.5rem] md:text-[6.5rem] inline-block"
        style={gradientStyle}
      >
        Olá {name}&nbsp;
      </span>
    </div>
  );
};

export default function DashboardPage() {
  const { data, loading } = useDashboardData();

  if (loading || !data) {
    return (
      <AtendePsiShell title="">
        <div className="flex flex-col gap-4 h-full overflow-hidden items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AtendePsiShell>
    );
  }

  return (
    <AtendePsiShell title="">
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        {/* Dynamic Greeting - Executive Layout */}
        <div className="shrink-0 -mt-7 animate-entry">
          <div className="flex items-center justify-between">
            <OlaAnimation name={data.greeting.psychologistName} />
          </div>

          <p className="text-[2rem] md:text-[2.5rem] text-muted-foreground leading-snug font-medium mt-0 md:-mt-6 pl-1">
            Hoje <strong className="text-[#006f9a] font-bold">{data.greeting.aiName}</strong> atendeu <strong className="text-[#006f9a] font-semibold">{data.metrics.totalPatients}</strong> pacientes.
          </p>
        </div>

        {/* Main Grid Layout - Auto fit remaining height */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 min-h-0 pb-1">

          {/* Row 1: 4 KPIs */}
          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-center animate-entry delay-100">
            <div className="text-sm font-medium text-muted-foreground">Tempo médio</div>
            <div className="mt-1 text-3xl font-bold tracking-tighter text-foreground/90">
              {data.metrics.averageTime}
            </div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <span className={`font-medium flex items-center mr-1 ${data.metrics.averageTimeChange.trend === 'down' ? 'text-emerald-600' : 'text-red-600'}`}>
                <ArrowDownRight className="h-3 w-3 mr-0.5" /> {data.metrics.averageTimeChange.value}%
              </span>
              vs ontem
            </div>
          </div>

          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-center animate-entry delay-100">
            <div className="text-sm font-medium text-muted-foreground">Mensagens</div>
            <div className="mt-1 text-3xl font-bold tracking-tighter text-foreground/90">
              {data.metrics.totalMessages}
            </div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <span className={`font-medium flex items-center mr-1 ${data.metrics.totalMessagesChange.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> {data.metrics.totalMessagesChange.value}%
              </span>
              vs ontem
            </div>
          </div>

          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-center animate-entry delay-200">
            <div className="text-sm font-medium text-muted-foreground">Autonomia IA</div>
            <div className="mt-1 text-3xl font-bold tracking-tighter text-foreground/90">
              {data.metrics.aiAutonomy}
            </div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <span className={`font-medium flex items-center mr-1 ${data.metrics.aiAutonomyChange.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> {data.metrics.aiAutonomyChange.value}%
              </span>
              vs ontem
            </div>
          </div>

          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-center animate-entry delay-200">
            <div className="text-sm font-medium text-muted-foreground">Redirecionamentos</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-[#006f9a]">{data.metrics.humanRedirects}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Para humano</div>
          </div>

          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-center animate-entry delay-200">
            <div className="text-sm font-medium text-muted-foreground">Agendamentos</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-[#006f9a]">{data.metrics.appointments}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Esta semana</div>
          </div>

          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-center animate-entry delay-200">
            <div className="text-sm font-medium text-muted-foreground">Remarcações</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-[#006f9a]">{data.metrics.reschedules}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Apenas 3% do total</div>
          </div>

          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-center animate-entry delay-200">
            <div className="text-xs font-medium text-muted-foreground">Cancelamentos</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-red-500">{data.metrics.cancellations}</div>
          </div>

          <div className="col-span-1 ap-card p-4 rounded-2xl flex flex-col justify-between animate-entry delay-200">
            <div className="mb-2">
              <span className="text-xs font-medium text-foreground leading-tight block">Seu feedback é importante pra nós</span>
            </div>
            <button className="w-full text-[10px] font-semibold bg-muted text-foreground hover:bg-muted/80 py-2 rounded-md transition-colors shadow-sm whitespace-normal leading-tight text-center px-1">
              Fale com a equipe AtendePsi via WhatsApp
            </button>
          </div>

          {/* Chart - Spans full width (4 cols) */}
          <div className="col-span-1 md:col-span-4 ap-card p-6 rounded-2xl flex flex-col justify-center min-h-[350px] animate-entry delay-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">Volume de mensagens por horário</h3>
              </div>
            </div>

            <div className="w-full flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradientExecutive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--executive-blue))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--executive-blue))" stopOpacity={0.6} />
                    </linearGradient>
                    <filter id="shadow" height="130%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                      <feOffset dx="0" dy="2" result="offsetblur" />
                      <feFlood floodColor="hsl(var(--executive-blue))" floodOpacity="0.3" />
                      <feComposite in2="offsetblur" operator="in" />
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 500 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--executive-blue) / 0.08)", radius: 8 }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover) / 0.95)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "0.5rem",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
                      padding: "12px 16px"
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 6, 6]}
                    barSize={40}
                    fill="url(#barGradientExecutive)"
                    filter="url(#shadow)"
                    animationDuration={1000}
                    name="Mensagens"
                  >
                    {data.chartData.map((entry: ChartDataPoint, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="url(#barGradientExecutive)"
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </AtendePsiShell>
  );
}
