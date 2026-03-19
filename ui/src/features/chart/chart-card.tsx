"use client";

import React from "react";
import { useEffect, useRef } from "react";
import { Chart, LineController, LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip } from "chart.js";
import "chartjs-adapter-moment";

import { Panel } from "@/components/panel";
import { chartColors } from "@/lib/constants";
import { formatChange, formatCurrency } from "@/lib/format";
import type { PriceInfo, PricePoint, Stock } from "@/lib/types";

Chart.register(LineController, LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip);

export function ChartCard({
  bars,
  stock,
  stockInfo,
}: {
  bars: PricePoint[];
  stock: Stock | null;
  stockInfo?: PriceInfo;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: bars.map((point) => new Date(point[0]).toLocaleTimeString()),
        datasets: [
          {
            data: bars.map((point) => point[1]),
            borderColor: chartColors.line,
            backgroundColor: chartColors.fill,
            fill: true,
            pointRadius: 0,
            tension: 0.25,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => formatCurrency(Number(context.parsed.y)),
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: "rgba(45, 71, 84, 0.4)" },
            ticks: { color: "#8A99A0" },
          },
          y: {
            grid: { color: "rgba(45, 71, 84, 0.4)" },
            ticks: {
              color: "#8A99A0",
              callback: (value) => formatCurrency(Number(value)),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [bars]);

  return (
    <Panel
      subtitle={stock?.name ?? "Choose a stock to see the latest replayed or live price action."}
      title={stock ? `${stock.symbol} price chart` : "Price chart"}
    >
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="text-3xl font-semibold text-white">
          {stockInfo ? formatCurrency(stockInfo.lastPrice) : "$0.00"}
        </div>
        <div
          className="rounded-[5px] px-3 py-1 text-sm font-semibold text-white"
          style={{
            backgroundColor: stockInfo && stockInfo.change < 0 ? chartColors.negative : chartColors.positive,
            color: stockInfo && stockInfo.change >= 0 ? "#091A23" : "#FFFFFF",
          }}
        >
          {stockInfo ? formatChange(stockInfo.change) : "+0.00%"}
        </div>
      </div>
      <div className="h-[360px]">
        <canvas ref={canvasRef} />
      </div>
    </Panel>
  );
}
