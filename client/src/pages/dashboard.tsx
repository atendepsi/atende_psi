import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AtendePsiShell } from "@/components/atendepsi-shell";

type HourPoint = { hour: string; value: number };

const data: HourPoint[] = [
  { hour: "08h", value: 6 },
  { hour: "09h", value: 12 },
  { hour: "10h", value: 18 },
  { hour: "11h", value: 15 },
  { hour: "12h", value: 10 },
  { hour: "13h", value: 8 },
  { hour: "14h", value: 14 },
  { hour: "15h", value: 19 },
  { hour: "16h", value: 22 },
  { hour: "17h", value: 16 },
  { hour: "18h", value: 11 },
];

function dynamicTop(points: { value: number }[]) {
  const max = Math.max(...points.map((p) => p.value));
  const pad = Math.max(4, Math.ceil(max * 0.35));
  return max + pad;
}

function KpiCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className="ap-card ap-kpi ap-noise rounded-2xl p-5">
      <div className="text-xs text-muted-foreground" data-testid={`label-${testId}`}>
        {label}
      </div>
      <div
        className="mt-2 text-[34px] leading-none tracking-[-0.02em] text-foreground"
        style={{ fontFamily: "DM Sans, var(--font-sans)" }}
        data-testid={`kpi-${testId}`}
      >
        {value}
      </div>
    </div>
  );
}

function SecondaryKpi({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className="ap-card-soft rounded-2xl p-4">
      <div className="text-xs text-muted-foreground" data-testid={`label-${testId}`}>
        {label}
      </div>
      <div
        className="mt-1 text-xl font-semibold tracking-[-0.01em]"
        style={{ fontFamily: "DM Sans, var(--font-sans)" }}
        data-testid={`kpi-${testId}`}
      >
        {value}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ap-card-soft rounded-2xl px-3 py-2">
      <div className="text-xs text-muted-foreground" data-testid="text-tooltip-label">
        {label}
      </div>
      <div className="text-sm font-medium" data-testid="text-tooltip-value">
        {payload[0]?.value} mensagens
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const top = dynamicTop(data);

  return (
    <AtendePsiShell title="Calma para atender. Clareza para decidir.">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <KpiCard label="Agendamentos" value="18" testId="agendamentos" />
          <KpiCard label="Tempo médio de resposta" value="1m 24s" testId="tempo-resposta" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SecondaryKpi label="Mensagens enviadas" value="324" testId="mensagens" />
          <SecondaryKpi label="Redirecionamentos" value="9" testId="redirecionamentos" />
          <SecondaryKpi label="Qualidade da triagem" value="92%" testId="qualidade" />
        </div>

        <div className="mt-6 ap-card ap-noise rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className="text-sm font-semibold tracking-[-0.01em]"
                style={{ fontFamily: "DM Sans, var(--font-sans)" }}
                data-testid="text-chart-title"
              >
                Atividade por horário
              </div>
              <div className="mt-1 text-xs text-muted-foreground" data-testid="text-chart-subtitle">
                Volume de mensagens por horário (hoje)
              </div>
            </div>
            <div className="text-xs text-muted-foreground" data-testid="text-chart-legend">
              Mensagens
            </div>
          </div>

          <div className="mt-4 h-[320px]" data-testid="chart-activity">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: 10, right: 12, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="apBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.7)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, top]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} />
                <Bar
                  dataKey="value"
                  radius={[12, 12, 12, 12]}
                  fill="url(#apBar)"
                  stroke="hsl(var(--primary) / 0.35)"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </AtendePsiShell>
  );
}
