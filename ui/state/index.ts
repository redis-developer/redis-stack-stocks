import isServerSide from "@utils/isServerSide";
import { createStateHook } from "react-tates";
import tates from "tates";

export interface Image {
  size: string;
  url: string;
}

export interface News {
  id: string;
  headline: string;
  author: string;
  created_at: string;
  updated_at: string;
  summary: string;
  url: string;
  images: Image[];
  symbols: string[];
  source: string;
}

export interface Stock {
  pk: string;
  symbol: string;
  name: string;
  last_sale: string;
  market_cap: string;
  country: string;
  ipo: string;
  volume: string;
  sector: string;
  industry: string;
  news: News[];
}

export interface Notification {
  text: string | string[] | ArrayLike<string>;
  label?: string;
  severity?: "warning" | "danger" | "success" | "info";
}

export interface State {
  watchlist: Stock[] | null;
  searchResults: Stock[] | null;
  notification: Notification | null;
  currentStock: Stock | null;
  trending: (string | number)[] | null;
  trades: [[number, number], [number, number]] | null;
  stockTrades: Record<string, [number, number]> | null;
  currentStockBars: [number, number][] | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const tate = tates<State>();
const { state, subscribe, clone } = tate;

const props = {
  TRENDING: "trending",
  WATCH_LIST: "watchlist",
  SEARCH_RESULTS: "searchResults",
  NOTIFICATION: "notification",
  CURRENT_STOCK: "currentStock",
  TRADES: "trades",
  STOCK_TRADES: "stockTrades",
  CURRENT_STOCK_BARS: "currentStockBars",
};

if (!isServerSide()) {
  const trendingWs = new WebSocket(`${WS_URL}/trending`);
  trendingWs.onmessage = async (ev) => {
    let data = ev.data;

    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    state.trending = data;
  };

  const tradeWs = new WebSocket(`${WS_URL}/trade`);
  tradeWs.onmessage = async (ev) => {
    if (!state.currentStock) {
      return;
    }

    if (ev.data === state.currentStock.pk) {
      await actor.getStockTrades(state.currentStock.pk);
    }

    await actor.updateWatchlistTrades();
  };

  const barWs = new WebSocket(`${WS_URL}/bars`);
  barWs.onmessage = async (ev) => {
    if (!state.currentStock) {
      return;
    }

    if (ev.data === state.currentStock.pk) {
      await actor.getCurrentStockBars(state.currentStock.pk);
    }
  };
}

const actions = {
  async getTrendingStocks() {
    const response = await fetch(`${API_URL}/trending`);
    const json: string[] = await response.json();
    state.trending = json;
  },
  async getCurrentStockBars(symbol: string) {
    const response = await fetch(`${API_URL}/bars/${symbol}`);
    const json: [number, number][] = await response.json();
    state.currentStockBars = json;
  },
  async getStockTrades(symbol: string) {
    const response = await fetch(`${API_URL}/trade/${symbol}`);
    const json: [number, number] = await response.json();
    let lastTrade: [number, number] = [0, 0];

    if (state.currentStockBars && state.currentStockBars.length > 0) {
      lastTrade = state.currentStockBars[state.currentStockBars.length - 1];
    }

    state.trades = [lastTrade, json];
  },
  async updateWatchlistTrades(watchlist?: Stock[] | null) {
    watchlist = watchlist ?? state.watchlist;

    if (!watchlist) {
      return;
    }

    const stockTrades: Record<string, [number, number]> = {};

    for (let i = 0; i < watchlist.length; i++) {
      const stock = watchlist[i];
      const response = await fetch(`${API_URL}/trade/${stock.symbol}`);
      const json: [number, number] = await response.json();

      stockTrades[stock.symbol] = json;
    }

    state.stockTrades = stockTrades;
  },
  async getWatchList() {
    const response = await fetch(`${API_URL}/watchlist`);
    const json: Stock[] = await response.json();
    await actor.updateWatchlistTrades(json);
    state.watchlist = json;

    if (!state.currentStock && Array.isArray(json)) {
      await actor.setCurrentStock(json[0]);
    }
  },
  async watch(symbol: string) {
    await fetch(`${API_URL}/watchlist/${symbol}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    void this.getWatchList();
  },
  async unwatch(symbol: string) {
    await fetch(`${API_URL}/watchlist/${symbol}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    void this.getWatchList();
  },
  async search(query: string) {
    if (!query || query.length < 3) {
      state.searchResults = [];

      return;
    }

    const response = await fetch(`${API_URL}/search/${query}`);
    const json: Stock[] = await response.json();

    state.searchResults = json;
  },
  async setCurrentStock(stock: Stock) {
    state.currentStock = stock;
    actions.getCurrentStockBars(stock.symbol);
    actions.getStockTrades(stock.symbol);
  },
};

const hooks = {
  useTrendingStocks: createStateHook<(string | number)[], typeof tate, any>({
    tate,
    property: props.TRENDING,
    action: actions.getTrendingStocks,
  }),
  useTrades: createStateHook<
    [[number, number], [number, number]],
    typeof tate,
    any
  >({
    tate,
    property: props.TRADES,
  }),
  useStockTrades: createStateHook<
    Record<string, [number, number]>,
    typeof tate,
    any
  >({
    tate,
    property: props.STOCK_TRADES,
  }),
  useCurrentStockBars: createStateHook<[number, number][], typeof tate, any>({
    tate,
    property: props.CURRENT_STOCK_BARS,
  }),
  useWatchList: createStateHook<Stock[], typeof tate, any>({
    tate,
    property: props.WATCH_LIST,
    action: actions.getWatchList,
  }),
  useSearchResults: createStateHook<Stock[], typeof tate, any>({
    tate,
    property: props.SEARCH_RESULTS,
  }),
  useCurrentStock: createStateHook<Stock, typeof tate, any>({
    tate,
    property: props.CURRENT_STOCK,
  }),
};

const actor = {
  get state() {
    return clone() as typeof state;
  },
  ...actions,
  subscribe,
  props,
  hooks,
};

export default actor;
