export interface ChartDataPoint {
    name: string;
    value: number;
}

export interface MetricChange {
    value: number;
    trend: "up" | "down" | "neutral";
}

export interface DashboardMetrics {
    totalPatients: number;
    averageTime: string;
    averageTimeChange: MetricChange;
    totalMessages: string;
    totalMessagesChange: MetricChange;
    aiAutonomy: string;
    aiAutonomyChange: MetricChange;
    humanRedirects: number;
    appointments: number;
    reschedules: number;
    cancellations: number;
}

export interface DashboardData {
    greeting: {
        psychologistName: string;
        aiName: string;
    };
    metrics: DashboardMetrics;
    chartData: ChartDataPoint[];
}
