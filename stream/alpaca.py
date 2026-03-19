from __future__ import annotations

import asyncio
import datetime
import logging
import os
from collections.abc import Iterable

import dateutil.parser as dp
from alpaca_trade_api.common import URL
from alpaca_trade_api.rest import REST, TimeFrame, TimeFrameUnit
from alpaca_trade_api.stream import Stream
from dateutil.relativedelta import relativedelta

from connection import db, db_sync
from store import add_news, get_watchlist, record_bar, record_trade

LOGGER = logging.getLogger(__name__)

ALPACA_API_KEY = os.getenv("APCA_API_KEY_ID")
ALPACA_SECRET_KEY = os.getenv("APCA_API_SECRET_KEY")

api = REST()
stream = Stream(
    ALPACA_API_KEY,
    ALPACA_SECRET_KEY,
    base_url=URL("https://paper-api.alpaca.markets"),
    data_feed="iex",
)
watch_list: set[str] = set()


def _news_symbol(payload: object) -> str | None:
    raw = getattr(payload, "_raw", {})
    if "symbols" in raw and raw["symbols"]:
        return str(raw["symbols"][0]).upper()
    if hasattr(payload, "symbol"):
        return str(payload.symbol).upper()
    return None


async def _seed_news(symbol: str) -> None:
    now = datetime.datetime.now(datetime.timezone.utc)
    values = api.get_news(
        symbol,
        (now - relativedelta(days=8)).isoformat(),
        (now - relativedelta(minutes=16)).isoformat(),
        limit=10,
    )
    news_items = []
    for item in values:
        raw = item._raw
        news_items.append(
            {
                "id": str(raw.get("id", "")),
                "headline": raw.get("headline", ""),
                "author": raw.get("author", ""),
                "created_at": raw.get("created_at", ""),
                "updated_at": raw.get("updated_at", ""),
                "summary": raw.get("summary", ""),
                "url": raw.get("url", ""),
                "images": raw.get("images", []),
                "symbols": raw.get("symbols", [symbol]),
                "source": raw.get("source", "alpaca"),
            }
        )
    if news_items:
        await add_news(db, symbol, news_items)


async def bootstrap_symbol(symbol: str) -> None:
    now = datetime.datetime.now(datetime.timezone.utc)
    trade_values = api.get_trades(
        symbol,
        (now - relativedelta(minutes=76)).isoformat(),
        (now - relativedelta(minutes=16)).isoformat(),
        limit=50,
    )
    bar_values = api.get_bars(
        symbol,
        TimeFrame(1, TimeFrameUnit.Minute),
        (now - relativedelta(minutes=76)).isoformat(),
        (now - relativedelta(minutes=16)).isoformat(),
        limit=200,
    )

    for trade in trade_values:
        raw = trade._raw
        record_trade(
            db_sync,
            symbol,
            int(dp.parse(raw["t"]).timestamp() * 1000),
            float(raw["p"]),
            int(raw["s"]),
        )

    for bar in bar_values:
        raw = bar._raw
        record_bar(
            db_sync,
            symbol,
            int(dp.parse(raw["t"]).timestamp() * 1000),
            float(raw["o"]),
            float(raw["h"]),
            float(raw["l"]),
            float(raw["c"]),
            int(raw["v"]),
        )

    await _seed_news(symbol)


async def update_trade(trade: object) -> None:
    symbol = str(getattr(trade, "symbol")).upper()
    timestamp = int(getattr(trade, "timestamp").timestamp() * 1000)
    record_trade(
        db_sync,
        symbol,
        timestamp,
        float(getattr(trade, "price")),
        int(getattr(trade, "size")),
    )
    await db.publish("trade", symbol)
    await db.publish("trending-stocks", "updated")


async def update_bar(bar: object) -> None:
    symbol = str(getattr(bar, "symbol")).upper()
    timestamp_ns = int(getattr(bar, "timestamp"))
    record_bar(
        db_sync,
        symbol,
        timestamp_ns // 1_000_000,
        float(getattr(bar, "open")),
        float(getattr(bar, "high")),
        float(getattr(bar, "low")),
        float(getattr(bar, "close")),
        int(getattr(bar, "volume")),
    )
    await db.publish("bar", symbol)


async def update_news(news: object) -> None:
    symbol = _news_symbol(news)
    if not symbol:
        return
    raw = getattr(news, "_raw", {})
    await add_news(
        db,
        symbol,
        [
            {
                "id": str(raw.get("id", "")),
                "headline": raw.get("headline", ""),
                "author": raw.get("author", ""),
                "created_at": raw.get("created_at", ""),
                "updated_at": raw.get("updated_at", ""),
                "summary": raw.get("summary", ""),
                "url": raw.get("url", ""),
                "images": raw.get("images", []),
                "symbols": raw.get("symbols", [symbol]),
                "source": raw.get("source", "alpaca"),
            }
        ],
    )


async def subscribe(symbols: Iterable[str]) -> None:
    normalized = [symbol.upper() for symbol in symbols]
    if not normalized:
        return

    LOGGER.info("Subscribing to %s", normalized)
    for symbol in normalized:
        await bootstrap_symbol(symbol)
    stream.subscribe_trades(update_trade, *normalized)
    stream.subscribe_bars(update_bar, *normalized)
    stream.subscribe_news(update_news, *normalized)


async def unsubscribe(symbols: Iterable[str]) -> None:
    normalized = [symbol.upper() for symbol in symbols]
    if not normalized:
        return

    LOGGER.info("Unsubscribing from %s", normalized)
    stream.unsubscribe_trades(*normalized)
    stream.unsubscribe_bars(*normalized)
    stream.unsubscribe_news(*normalized)


async def sync_watchlist() -> None:
    global watch_list
    new_watch_list = set(await get_watchlist(db))
    removed = sorted(watch_list - new_watch_list)
    added = sorted(new_watch_list - watch_list)

    if removed:
        await unsubscribe(removed)
    if added:
        await subscribe(added)

    watch_list = new_watch_list


async def listen_for_watchlist_updates() -> None:
    pubsub = db.pubsub()
    await pubsub.subscribe("watchlist-updated")

    async for event in pubsub.listen():
        if event["type"] == "subscribe":
            continue
        await sync_watchlist()


async def run_live() -> None:
    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        raise RuntimeError("Live mode requires Alpaca credentials")

    await sync_watchlist()
    asyncio.create_task(listen_for_watchlist_updates())
    await stream._run_forever()
