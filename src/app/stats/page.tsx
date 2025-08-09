"use client";
import useSWR from "swr";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, ChartTooltip, Legend);

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StatsPage() {
  const { data } = useSWR<{
    totalVisits: number;
    uniqueVisitors: number;
    byCountry: { label: string; count: number }[];
    byPath: { label: string; count: number }[];
    dailyHits: { day: string; count: number }[];
  }>("/api/stats", fetcher, { refreshInterval: 60000 });

  const total = data?.totalVisits ?? 0;
  const unique = data?.uniqueVisitors ?? 0;

  const dailyData = {
    labels: (data?.dailyHits ?? []).map((d) => d.day),
    datasets: [
      {
        label: "Visits",
        data: (data?.dailyHits ?? []).map((d) => d.count),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.25)",
        tension: 0.25,
      },
    ],
  };

  const countryData = {
    labels: (data?.byCountry ?? []).map((d) => d.label),
    datasets: [
      {
        label: "By Country",
        data: (data?.byCountry ?? []).map((d) => d.count),
        backgroundColor: "rgba(34,197,94,0.5)",
      },
    ],
  };

  const pathData = {
    labels: (data?.byPath ?? []).map((d) => d.label),
    datasets: [
      {
        label: "By Path",
        data: (data?.byPath ?? []).map((d) => d.count),
        backgroundColor: "rgba(251,146,60,0.6)",
      },
    ],
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Visitor Stats</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm text-foreground/70">Total Visits</div>
          <div className="text-3xl font-semibold">{total}</div>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm text-foreground/70">Unique Visitors</div>
          <div className="text-3xl font-semibold">{unique}</div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <div className="text-sm mb-2">Daily Visits</div>
        <div className="h-72 w-full">
          <Line data={dailyData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm mb-2">Top Countries</div>
          <div className="h-60 w-full">
            <Bar data={countryData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm mb-2">Top Paths</div>
          <div className="h-60 w-full">
            <Bar data={pathData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}
