import state from "@state";
import { formatValue } from "@utils";
import React, { useState } from "react";
import SearchModal from "./header/SearchModal";

function TrendingCard() {
  const currentStock = state.hooks.useCurrentStock();
  const watchList = state.hooks.useWatchList();
  const watchListTrades = state.hooks.useStockTrades();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <div className="col-span-full xl:col-span-10 bg-white shadow-lg rounded-sm border border-slate-200">
      <header className="px-5 py-4 border-b border-slate-100 flex items-center">
        <h2 className="font-semibold text-slate-800">Watchlist</h2>
        <button
          className={`w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition duration-150 rounded-full ml-3 ${
            searchModalOpen && "bg-slate-200"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSearchModalOpen(true);
          }}
          aria-controls="search-modal"
        >
          <span className="sr-only">Search</span>
          <svg
            className="w-4 h-4"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="fill-current text-slate-500"
              d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
            />
            <path
              className="fill-current text-slate-400"
              d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
            />
          </svg>
        </button>
        <SearchModal
          id="search-modal"
          searchId="search"
          modalOpen={searchModalOpen}
          setModalOpen={setSearchModalOpen}
        />
      </header>
      <div className="p-3">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-slate-400 bg-slate-50">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Actions</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Symbol</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Name</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Price</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm divide-y divide-slate-100">
              {watchList?.map((stock) => {
                return (
                  <tr
                    key={stock.pk}
                    className={`cursor-pointer hover:bg-slate-200${stock.symbol === currentStock?.symbol ? ' bg-cyan-200' : ''}`}
                  >
                    <td
                      className="p-2 whitespace-nowrap"
                      onClick={() => {
                        state.unwatch(stock.symbol);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="font-medium text-slate-800 text-2xl">
                          ⮾
                        </div>
                      </div>
                    </td>
                    <td
                      className="p-2 whitespace-nowrap"
                      onClick={() => {
                        state.setCurrentStock(stock);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="font-medium text-slate-800">
                          {stock.symbol}
                        </div>
                      </div>
                    </td>
                    <td
                      className="p-2 whitespace-nowrap"
                      onClick={() => {
                        state.setCurrentStock(stock);
                      }}
                    >
                      <div className="text-left">{stock.name}</div>
                    </td>
                    <td
                      className="p-2 whitespace-nowrap"
                      onClick={() => {
                        state.setCurrentStock(stock);
                      }}
                    >
                      <div className="text-left">
                        {watchListTrades &&
                          formatValue(watchListTrades[stock.symbol]?.[1])}
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
