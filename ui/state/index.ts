import isServerSide from "@utils/isServerSide";
import { createKeyedStateHook, createStateHook } from "react-tates";
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

export interface PriceInfo {
  lastPrice: number;
  change: number;
  lastClose: number;
}

export interface IncomingTrade {
  symbol: string;
  trade: [number, number];
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
  stockInfo: Record<string, PriceInfo> | null;
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
  STOCK_INFO: "stockInfo",
  CURRENT_STOCK_BARS: "currentStockBars",
};

function change(current: number, previous: number) {
  return ((current - previous) / previous) * 100;
}

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
    let incomingTrade: IncomingTrade = ev.data;

    if (typeof incomingTrade === "string") {
      incomingTrade = JSON.parse(ev.data);
    }

    if (!state.stockInfo) {
      return;
    }

    const stockInfo = state.stockInfo[incomingTrade.symbol];
    state.stockInfo[incomingTrade.symbol] = {
      lastPrice: incomingTrade.trade[1],
      change: change(incomingTrade.trade[1], stockInfo.lastClose),
      lastClose: stockInfo.lastClose,
    };
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
  async updateWatchlistTrades(watchlist?: Stock[] | null) {
    watchlist = watchlist ?? state.watchlist;

    if (!watchlist) {
      return;
    }

    const stockInfo: Record<string, PriceInfo> = {};

    for (let i = 0; i < watchlist.length; i++) {
      const stock = watchlist[i];
      const [tradesResponse, closeResponse] = await Promise.all([
        fetch(`${API_URL}/trade/${stock.symbol}`),
        fetch(`${API_URL}/close/${stock.symbol}`),
      ]);
      const [trades, close]: [[number, number], [number, number]] =
        await Promise.all([tradesResponse.json(), closeResponse.json()]);

      const lastPrice = trades[1];
      const lastClose = close[1];
      const change =
        (((lastPrice as number) - (lastClose as number)) /
          (lastClose as number)) *
        100;

      stockInfo[stock.symbol] = {
        lastPrice,
        change,
        lastClose,
      };
    }

    state.stockInfo = stockInfo;
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
  },
};

const hooks = {
  useTrendingStocks: createStateHook<(string | number)[], typeof tate, any>({
    tate,
    property: props.TRENDING,
    action: actions.getTrendingStocks,
  }),
  useStockInfo: createKeyedStateHook<
    PriceInfo,
    typeof tate,
    any
  >({
    tate,
    property: props.STOCK_INFO,
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
