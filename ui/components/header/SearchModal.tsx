import useLayoutEffect from "@utils/useLayoutEffect";
import React, { useRef, useState } from "react";
import Link from "next/link";
import Transition from "@components/Transition";
import state from "@state";

export interface SearchModelProps {
  id: string;
  searchId: string;
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
}

function SearchModal({
  id,
  searchId,
  modalOpen,
  setModalOpen,
}: SearchModelProps) {
  const modalContent = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchResults = state.hooks.useSearchResults();

  // close on click outside
  useLayoutEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!modalOpen || modalContent.current?.contains(target as Node)) return;
      setModalOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useLayoutEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!modalOpen || !(key === "Esc" || key === "Escape")) return;
      setModalOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useLayoutEffect(() => {
    modalOpen && searchInput.current?.focus();
  }, [modalOpen]);

  return (
    <>
      {/* Modal backdrop */}
      <Transition
        className="fixed inset-0 bg-slate-900 bg-opacity-30 z-50 transition-opacity"
        show={modalOpen}
        enter="transition ease-out duration-200"
        enterStart="opacity-0"
        enterEnd="opacity-100"
        leave="transition ease-out duration-100"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
        aria-hidden="true"
      />
      {/* Modal dialog */}
      <Transition
        id={id}
        className="fixed inset-0 z-50 overflow-hidden flex items-start top-20 mb-4 justify-center transform px-4 sm:px-6"
        role="dialog"
        aria-modal="true"
        show={modalOpen}
        enter="transition ease-in-out duration-200"
        enterStart="opacity-0 translate-y-4"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-in-out duration-200"
        leaveStart="opacity-100 translate-y-0"
        leaveEnd="opacity-0 translate-y-4"
      >
        <div
          ref={modalContent}
          className="bg-white overflow-auto max-w-2xl w-full max-h-full rounded shadow-lg"
        >
          {/* Search form */}
          <form
            className="border-b border-slate-200"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="relative">
              <label htmlFor={searchId} className="sr-only">
                Search
              </label>
              <input
                id={searchId}
                name={searchId}
                className="w-full border-0 focus:ring-transparent placeholder-slate-400 appearance-none py-3 pl-10 pr-4"
                type="search"
                placeholder="Search for a symbol (e.g. AAPL)"
                ref={searchInput}
                onChange={async (e) => {
                  e.preventDefault();
                  const searchValue = e.target.value;
                  void state.search(searchValue as string);
                }}
              />
              <button
                className="absolute inset-0 right-auto group"
                type="submit"
                aria-label="Search"
              >
                <svg
                  className="w-4 h-4 shrink-0 fill-current text-slate-400 group-hover:text-slate-500 ml-4 mr-2"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                  <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
                </svg>
              </button>
            </div>
          </form>
          <div className="py-4 px-2">
            {/* Recent searches */}
            <div className="mb-3 last:mb-0">
              <div className="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">
                Suggestions
              </div>
              <ul className="text-sm">
                {searchResults?.map((stock) => {
                  return (
                    <li key={stock.pk}>
                      <Link href="/">
                        <a
                          className="flex items-center p-2 text-slate-800 hover:text-white hover:bg-indigo-500 rounded group"
                          onClick={() => {
                            state.watch(stock.symbol);
                          }}
                        >
                          <span>
                            <strong>{stock.symbol}</strong>: {stock.name}
                          </span>
                          <span className="text-slate-400 ml-auto">
                            Click to add to watchlist
                          </span>
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
}

export default SearchModal;
