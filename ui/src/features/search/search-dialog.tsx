"use client";

import React from "react";
import type { Stock } from "@/lib/types";

export function SearchDialog({
  open,
  onClose,
  onSearchTextChange,
  searchText,
  results,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onSearchTextChange: (value: string) => void;
  searchText: string;
  results: Stock[];
  onAdd: (symbol: string) => Promise<void>;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-[5px] border border-dusk-90 bg-midnight p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Add stocks</h3>
          <button className="text-sm text-dusk-30 transition hover:text-white" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <input
          className="mt-4 w-full rounded-[5px] border border-dusk-90 px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-dusk-50 focus:border-hyper-05"
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder="Search by stock symbol"
          type="search"
          value={searchText}
        />
        <div className="mt-4 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="rounded-[5px] px-4 py-6 text-sm text-dusk-30">
              Start typing a symbol like AAPL or MSFT.
            </p>
          ) : (
            <ul className="space-y-3">
              {results.map((stock) => (
                <li
                  className="flex items-center justify-between rounded-[5px] border border-dusk-90 px-4 py-3"
                  key={stock.symbol}
                >
                  <div>
                    <div className="font-semibold text-white">{stock.symbol}</div>
                    <div className="text-sm text-dusk-30">{stock.name}</div>
                  </div>
                  <button
                    className="rounded-[5px] border border-hyper-05 bg-hyper-10 px-4 py-2 text-sm font-medium text-white transition hover:bg-hyper-09"
                    onClick={() => {
                      void onAdd(stock.symbol);
                      onClose();
                    }}
                    type="button"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
