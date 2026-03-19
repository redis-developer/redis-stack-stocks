import React from "react";
import { Panel } from "@/components/panel";
import type { Stock } from "@/lib/types";

export function NewsCard({ stock }: { stock: Stock | null }) {
  return (
    <Panel
      subtitle={stock ? `Latest stored headlines for ${stock.symbol}.` : "Select a stock to see related news."}
      title="News"
    >
      {stock?.news.length ? (
        <ul className="space-y-4">
          {stock.news.slice(0, 8).map((item) => (
            <li className="rounded-[5px] border border-dusk-90 p-4" key={item.id}>
              <a className="font-semibold text-white hover:text-volt" href={item.url} rel="noreferrer" target="_blank">
                {item.headline}
              </a>
              <p className="mt-2 text-sm text-dusk-30">{item.summary || item.source}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[5px] px-5 py-10 text-sm text-dusk-30">
          News appears once the replay feed or live mode seeds stories for a tracked symbol.
        </p>
      )}
    </Panel>
  );
}
