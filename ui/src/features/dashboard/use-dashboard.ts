"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  getBars,
  getClose,
  getTrade,
  getTrending,
  getWatchlist,
  resetDemo,
  searchStocks,
  unwatch,
  watch,
} from "@/lib/api";
import { demoSymbols } from "@/lib/constants";
import { config } from "@/lib/config";
import { connectWebSocket } from "@/lib/ws";
import type { IncomingTrade, PriceInfo, PricePoint, Stock } from "@/lib/types";

interface DashboardState {
  watchlist: Stock[];
  currentStock: Stock | null;
  currentBars: PricePoint[];
  stockInfo: Record<string, PriceInfo>;
  trending: Array<string | number>;
  searchResults: Stock[];
  searchText: string;
  setSearchText: (value: string) => void;
  refreshWatchlist: () => Promise<void>;
  addToWatchlist: (symbol: string) => Promise<void>;
  clearDemo: () => Promise<void>;
  playDemo: () => Promise<void>;
  clearPending: boolean;
  demoPending: boolean;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  selectStock: (stock: Stock) => void;
}


function calculateChange(current: number, previous: number): number {
  if (!previous) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
}


export function useDashboard(): DashboardState {
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [currentStock, setCurrentStock] = useState<Stock | null>(null);
  const [currentBars, setCurrentBars] = useState<PricePoint[]>([]);
  const [stockInfo, setStockInfo] = useState<Record<string, PriceInfo>>({});
  const [trending, setTrending] = useState<Array<string | number>>([]);
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searchText, setSearchText] = useState("");
  const [clearPending, setClearPending] = useState(false);
  const [demoPending, setDemoPending] = useState(false);
  const deferredSearchText = useDeferredValue(searchText);

  const refreshWatchlist = useCallback(async () => {
    const nextWatchlist = await getWatchlist();
    setWatchlist(nextWatchlist);
    setCurrentStock((existing) => {
      if (existing) {
        return nextWatchlist.find((item) => item.symbol === existing.symbol) ?? nextWatchlist[0] ?? null;
      }
      return nextWatchlist[0] ?? null;
    });
  }, []);

  const refreshBars = useCallback(async (symbol: string) => {
    const bars = await getBars(symbol);
    setCurrentBars(bars);
  }, []);

  const refreshPrices = useCallback(async (stocks: Stock[]) => {
    const nextInfo: Record<string, PriceInfo> = {};
    for (const stock of stocks) {
      const [trade, close] = await Promise.all([getTrade(stock.symbol), getClose(stock.symbol)]);
      const tradeValue = Number(trade[1] ?? 0);
      const closeValue =
        Array.isArray(close) && close.length > 1 ? Number(close[1] ?? tradeValue) : tradeValue;
      nextInfo[stock.symbol] = {
        lastPrice: tradeValue,
        change: calculateChange(tradeValue, closeValue),
        lastClose: closeValue,
      };
    }
    setStockInfo(nextInfo);
  }, []);

  const addToWatchlist = useCallback(async (symbol: string) => {
    await watch(symbol);
    await refreshWatchlist();
  }, [refreshWatchlist]);

  const playDemo = useCallback(async () => {
    setDemoPending(true);
    try {
      await Promise.all(demoSymbols.map(async (symbol) => watch(symbol)));
      await refreshWatchlist();
    } finally {
      setDemoPending(false);
    }
  }, [refreshWatchlist]);

  const clearDemo = useCallback(async () => {
    setClearPending(true);
    try {
      await resetDemo();
      setCurrentStock(null);
      setCurrentBars([]);
      setStockInfo({});
      setTrending([]);
      setSearchResults([]);
      setSearchText("");
      await refreshWatchlist();
    } finally {
      setClearPending(false);
    }
  }, [refreshWatchlist]);

  const removeFromWatchlist = useCallback(async (symbol: string) => {
    await unwatch(symbol);
    await refreshWatchlist();
  }, [refreshWatchlist]);

  const selectStock = useCallback((stock: Stock) => {
    setCurrentStock(stock);
  }, []);

  useEffect(() => {
    void refreshWatchlist();
    void getTrending().then(setTrending);
  }, [refreshWatchlist]);

  useEffect(() => {
    if (watchlist.length > 0) {
      void refreshPrices(watchlist);
    } else {
      setStockInfo({});
    }
  }, [refreshPrices, watchlist]);

  useEffect(() => {
    if (currentStock) {
      void refreshBars(currentStock.symbol);
    } else {
      setCurrentBars([]);
    }
  }, [currentStock, refreshBars]);

  useEffect(() => {
    if (deferredSearchText.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let active = true;
    void searchStocks(deferredSearchText).then((results) => {
      if (active) {
        setSearchResults(results);
      }
    });

    return () => {
      active = false;
    };
  }, [deferredSearchText]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      return undefined;
    }

    const disconnectTrending = connectWebSocket(`${config.wsUrl}/trending`, (message) => {
      setTrending(JSON.parse(message));
    });
    const disconnectTrades = connectWebSocket(`${config.wsUrl}/trade`, (message) => {
      const tradeMessage = JSON.parse(message) as IncomingTrade;
      setStockInfo((previous) => {
        const lastClose = previous[tradeMessage.symbol]?.lastClose ?? tradeMessage.trade[1];
        return {
          ...previous,
          [tradeMessage.symbol]: {
            lastPrice: tradeMessage.trade[1],
            change: calculateChange(tradeMessage.trade[1], lastClose),
            lastClose,
          },
        };
      });
    });
    const disconnectBars = connectWebSocket(`${config.wsUrl}/bars`, (message) => {
      setCurrentStock((existing) => {
        if (existing && existing.symbol === message) {
          void refreshBars(existing.symbol);
        }
        return existing;
      });
    });

    return () => {
      disconnectTrending();
      disconnectTrades();
      disconnectBars();
    };
  }, [refreshBars]);

  return useMemo(
    () => ({
      watchlist,
      currentStock,
      currentBars,
      stockInfo,
      trending,
      searchResults,
      searchText,
      setSearchText,
      refreshWatchlist,
      addToWatchlist,
      clearDemo,
      clearPending,
      playDemo,
      demoPending,
      removeFromWatchlist,
      selectStock,
    }),
    [
      addToWatchlist,
      clearDemo,
      clearPending,
      currentBars,
      currentStock,
      demoPending,
      playDemo,
      refreshWatchlist,
      removeFromWatchlist,
      searchResults,
      searchText,
      stockInfo,
      trending,
      watchlist,
      selectStock,
    ],
  );
}
