import state from "@state";
import React from "react";
import Info from "@components/Info";

function TrendingCard() {
  const trending = state.hooks.useTrendingStocks();

  return (
    <div className="flex flex-col col-span-full xl:col-span-2 bg-white shadow-lg rounded-sm border border-slate-200">
      <header className="px-5 py-4 border-b border-slate-100 flex items-center">
        <h2 className="font-semibold text-slate-800">Trending Stocks</h2>
        <Info className="ml-2" containerClassName="min-w-44">
          <div className="text-sm text-center">
            Keeps track of the most frequently traded stocks in your watchlist
            over the last 60 seconds.
          </div>
        </Info>
      </header>
      <div className="p-3">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-slate-400 bg-slate-50">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Symbol</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Score</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm divide-y divide-slate-100">
              {trending?.map((symbol, index) => {
                if (index % 2 === 1) {
                  return;
                }

                const colors = ["bg-green-200", "bg-blue-200", "bg-yellow-200"];
                let color = colors[0];

                if (index < 4) {
                    color = colors[0];
                } else if (index < 8) {
                    color = colors[1];
                } else {
                    color = colors[2];
                }

                return (
                  <tr key={symbol} className={color}>
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-semibold text-slate-800">
                          {symbol}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-slate-800">
                          {trending[index + 1]}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TrendingCard;
