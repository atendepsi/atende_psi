import { useState, useEffect } from "react";
import { DashboardData } from "@/types/dashboard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

const DEFAULT_DATA: DashboardData = {
    greeting: {
        psychologistName: "Doutor(a)",
        aiName: "Assistente",
    },
    metrics: {
        totalPatients: 0,
        averageTime: "0min",
        averageTimeChange: { value: 0, trend: "neutral" },
        totalMessages: "0",
        totalMessagesChange: { value: 0, trend: "neutral" },
        aiAutonomy: "0%",
        aiAutonomyChange: { value: 0, trend: "neutral" },
        humanRedirects: 0,
        appointments: 0,
        reschedules: 0,
        cancellations: 0,
    },
    chartData: Array.from({ length: 24 }, (_, i) => ({
        name: `${i.toString().padStart(2, '0')}h`,
        value: 0
    })),
};

export const useDashboardData = () => {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // 1. Fetch Profile for Names
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, ai_name')
                    .eq('id', user.id)
                    .single();

                // 2. Fetch Metrics for Today AND Yesterday
                // Fix: Use local date to avoid UTC rollover issues (Brazil is UTC-3)
                const getLocalDateStr = (date: Date) => {
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    return localDate.toISOString().split('T')[0];
                };

                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const todayStr = getLocalDateStr(today);
                const yesterdayStr = getLocalDateStr(yesterday);

                // Fetch Dashboard Metrics (Soft fail if table missing)
                let todayMetrics: any = null;
                let yesterdayMetrics: any = null;

                try {
                    const { data: metricsData } = await supabase
                        .from('dashboard_metrics')
                        .select('*')
                        .eq('user_id', user.id)
                        .in('day', [todayStr, yesterdayStr]);

                    if (metricsData) {
                        todayMetrics = metricsData.find(m => m.day === todayStr);
                        yesterdayMetrics = metricsData.find(m => m.day === yesterdayStr);
                    }
                } catch (metricErr) {
                    console.warn("Dashboard metrics table missing or empty", metricErr);
                    // Continue execution to at least show Leads data
                }

                // 3. Fetch Leads Counts (Reliable Source)
                // Active Patients Today (Leads with messages today)
                const { count: activeLeadsToday } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('last_message_at', `${todayStr}T00:00:00`);

                // Leads Today (Created today)
                const { count: leadsToday } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('created_at', `${todayStr}T00:00:00`)
                    .lte('created_at', `${todayStr}T23:59:59`);

                // Leads Yesterday
                const { count: leadsYesterday } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('created_at', `${yesterdayStr}T00:00:00`)
                    .lte('created_at', `${yesterdayStr}T23:59:59`);


                // Helper for trends
                const calcTrend = (curr: number, prev: number) => {
                    if (!prev) return { value: 0, trend: "neutral" as const };
                    const diff = ((curr - prev) / prev) * 100;
                    return {
                        value: Math.abs(Math.round(diff)),
                        trend: diff > 0 ? "up" as const : diff < 0 ? "down" as const : "neutral" as const
                    };
                };

                // Messages
                const msgsToday = todayMetrics?.sent || 0;
                const msgsYesterday = yesterdayMetrics?.sent || 0;
                const msgsChange = calcTrend(msgsToday, msgsYesterday);

                // Response Time
                const timeToday = todayMetrics?.response_time || 0;
                const timeYesterday = yesterdayMetrics?.response_time || 0;
                const timeChange = calcTrend(timeToday, timeYesterday);

                // Leads Growth
                const leadsChange = calcTrend(leadsToday || 0, leadsYesterday || 0);

                // Construct Dashboard Data
                const dashboardData: DashboardData = {
                    greeting: {
                        psychologistName: profile?.full_name?.split(' ')[0] || "Doutor(a)",
                        aiName: profile?.ai_name || "Assistente",
                    },
                    metrics: {
                        totalPatients: activeLeadsToday || 0, // Sourced from REAL Leads table
                        averageTime: timeToday ? `${timeToday}s` : "0s",
                        averageTimeChange: timeChange,
                        totalMessages: msgsToday.toString(),
                        totalMessagesChange: msgsChange,
                        aiAutonomy: "100%",
                        aiAutonomyChange: { value: 0, trend: "neutral" },
                        humanRedirects: todayMetrics?.redirects || 0,
                        appointments: todayMetrics?.appointments || 0,
                        reschedules: todayMetrics?.reschedules || 0,
                        cancellations: todayMetrics?.cancellations || 0,
                    },
                    chartData: todayMetrics?.hourly
                        ? JSON.parse(todayMetrics.hourly as string).map((val: string, idx: number) => ({
                            name: `${idx.toString().padStart(2, '0')}h`,
                            value: parseInt(val) || 0
                        }))
                        : DEFAULT_DATA.chartData
                };

                setData(dashboardData);

            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
                setError("Failed to fetch dashboard data");
                setData(DEFAULT_DATA); // Fallback
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    return { data, loading, error };
};
