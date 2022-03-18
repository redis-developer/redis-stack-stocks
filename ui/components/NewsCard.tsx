import state from "@state";
import React from "react";

function NewsCard() {
  const stock = state.hooks.useCurrentStock();

  return (
    <div className="col-span-full xl:col-span-6 bg-white shadow-lg rounded-sm border border-slate-200">
      <header className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">
          Recent News about {stock?.symbol}
        </h2>
      </header>
      <div className="p-3">
        {/* Card content */}
        {/* "Today" group */}
        <div>
          <ul className="my-1">
            {/* Item */}
            {stock?.news.slice(0, 10).map((news) => {
              return (
                <li key={news.id} className="flex px-2">
                  <div className="grow flex items-center border-b border-slate-100 text-sm py-2">
                    <div className="grow flex justify-between">
                      <div className="self-center">
                        <a
                          className="font-medium text-slate-800 hover:text-slate-900"
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {news.headline}
                        </a>
                      </div>
                      <div className="shrink-0 self-end ml-2">
                        <a
                          className="font-medium text-indigo-500 hover:text-indigo-600"
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View<span className="hidden sm:inline"> -&gt;</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NewsCard;
