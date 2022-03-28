import React, { useState, useEffect } from "react";
import Info from "@components/Info";
import RealtimeChart from "@components/RealtimeChart";

// Import utilities
import { tailwindConfig, hexToRGB } from "@utils";
import state from "@state";
import { ChartData } from "chart.js";

function ChartCard() {
  const stock = state.hooks.useCurrentStock();
  const bars = state.hooks.useCurrentStockBars();
  const stockInfo = state.hooks.useStockInfo({
    key: stock?.symbol,
  });

  const slicedData = bars?.map((bar) => bar[1]) ?? [];
  const slicedLabels = bars?.map((bar) => new Date(bar[0])) ?? [];

  const chartData: ChartData = {
    labels: slicedLabels,
    datasets: [
      // Indigo line
      {
        data: slicedData,
        fill: true,
        backgroundColor: `rgba(${hexToRGB(
          (tailwindConfig()?.theme?.colors as any)?.blue[500]
        )}, 0.08)`,
        borderColor: (tailwindConfig()?.theme?.colors as any)?.indigo[500],
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: (tailwindConfig()?.theme?.colors as any)
          ?.indigo[500],
        clip: 20
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white shadow-lg rounded-sm border border-slate-200">
      <header className="px-5 py-4 border-b border-slate-100 flex items-center">
        <h2 className="font-semibold text-slate-800">{stock?.symbol}</h2>
        <Info className="ml-2" containerClassName="min-w-44">
          <div className="text-sm text-center">{stock?.name}</div>
        </Info>
      </header>
      {/* Chart built with Chart.js 3 */}
      {/* Change the height attribute to adjust the chart height */}
      <RealtimeChart stockInfo={stockInfo} data={chartData} width={595} height={496} />
    </div>
  );
}

export default ChartCard;
