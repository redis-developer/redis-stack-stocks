import React from "react";
import { Panel } from "@/components/panel";

export function TrendingCard({ trending }: { trending: Array<string | number> }) {
  const rows: Array<{ symbol: string; score: number }> = [];

  for (let index = 0; index < trending.length; index += 2) {
    rows.push({
      symbol: String(trending[index] ?? ""),
      score: Number(trending[index + 1] ?? 0),
    });
  }

  return (
    <Panel
      subtitle="Top-K ranking of the most active symbols in the watchlist over the last minute."
      title="Trending symbols"
    >
      {rows.length === 0 ? (
        <p className="rounded-[5px] px-5 py-10 text-sm text-dusk-30">
          Trending symbols will appear after the replay or live feed starts writing trades.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li
              className="flex items-center justify-between rounded-[5px] border border-dusk-90 px-4 py-3"
              key={`${row.symbol}-${index}`}
            >
              <span className="font-semibold text-white">{row.symbol}</span>
              <span className="text-sm text-dusk-50">{row.score}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
