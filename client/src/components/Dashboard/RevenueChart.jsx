import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "../../css/dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatMonthLabel = (ym) => {
  if (ym == null || ym === "") return "";
  const parts = String(ym).split("-");
  if (parts.length >= 2) {
    const monthNum = parseInt(parts[1], 10) - 1;
    const monthName = MONTH_NAMES[monthNum] ?? parts[1];
    return `${monthName} ${parts[0]}`;
  }
  return String(ym);
};

const RevenueChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const labels = safeData.map((d) => formatMonthLabel(d?.month ?? d?._id ?? ""));
    const values = safeData.map((d) => Number(d?.revenue ?? d?.totalRevenue ?? 0) || 0);

    if (labels.length === 0) {
      labels.push("No revenue yet");
      values.push(0);
    }

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: values,
          fill: true,
          tension: 0.4,
          borderColor: "rgb(37, 99, 235)",
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return "rgba(37, 99, 235, 0.2)";
            const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(37, 99, 235, 0.35)");
            gradient.addColorStop(1, "rgba(37, 99, 235, 0.02)");
            return gradient;
          },
          pointBackgroundColor: "rgb(37, 99, 235)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `Revenue: $${ctx.raw ?? 0}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 45,
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            callback: (value) => `$${value}`,
            font: {
              size: 11,
            },
          },
        },
      },
    }),
    []
  );

  return (
    <div className="sa-revenue-chart-container">
      <div className="sa-revenue-chart-wrapper">
        <Line data={chartData} options={options} datasetIdKey="revenue" />
      </div>
    </div>
  );
};

export default RevenueChart;
