from __future__ import annotations

from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from redis.commands.json.path import Path
from redis.exceptions import ResponseError

STOCK_KEY_PREFIX = "stocks:"


def make_stock_key(symbol: str) -> str:
    return f"{STOCK_KEY_PREFIX}{symbol.upper()}"


async def get_watchlist(db: AsyncRedis) -> list[str]:
    return sorted(await db.smembers("watchlist"))


async def add_news(db: AsyncRedis, symbol: str, items: list[dict]) -> None:
    key = make_stock_key(symbol)
    document = await db.json().get(key)
    if not document:
        return

    existing_news = document.get("news", [])
    seen_ids = {item["id"] for item in existing_news if "id" in item}
    for item in items:
        if item["id"] not in seen_ids:
            existing_news.append(item)
            seen_ids.add(item["id"])

    document["news"] = existing_news
    await db.json().set(key, Path.root_path(), document)


def ensure_price_series(db_sync: Redis, symbol: str) -> None:
    keys = [
        f"stocks:{symbol}:trades:price",
        f"stocks:{symbol}:trades:size",
        f"stocks:{symbol}:bars:open",
        f"stocks:{symbol}:bars:high",
        f"stocks:{symbol}:bars:low",
        f"stocks:{symbol}:bars:close",
        f"stocks:{symbol}:bars:volume",
    ]
    ts = db_sync.ts()

    for key in keys:
        if db_sync.exists(key):
            continue
        ts.create(key, duplicate_policy="last", labels={"symbol": symbol})


def reset_trending(db_sync: Redis) -> None:
    if db_sync.exists("trending-stocks"):
        db_sync.delete("trending-stocks")
    db_sync.topk().reserve("trending-stocks", 12, 50, 4, 0.9)


def ensure_trending(db_sync: Redis) -> None:
    if not db_sync.exists("trending-stocks"):
        reset_trending(db_sync)


def record_trade(db_sync: Redis, symbol: str, timestamp_ms: int, price: float, size: int) -> None:
    ensure_price_series(db_sync, symbol)
    db_sync.ts().madd(
        [
            (f"stocks:{symbol}:trades:price", str(timestamp_ms), price),
            (f"stocks:{symbol}:trades:size", str(timestamp_ms), size),
        ]
    )
    ensure_trending(db_sync)
    try:
        db_sync.topk().add("trending-stocks", symbol)
    except ResponseError:
        reset_trending(db_sync)
        db_sync.topk().add("trending-stocks", symbol)


def record_bar(
    db_sync: Redis,
    symbol: str,
    timestamp_ms: int,
    open_price: float,
    high: float,
    low: float,
    close: float,
    volume: int,
) -> None:
    ensure_price_series(db_sync, symbol)
    db_sync.ts().madd(
        [
            (f"stocks:{symbol}:bars:open", str(timestamp_ms), open_price),
            (f"stocks:{symbol}:bars:high", str(timestamp_ms), high),
            (f"stocks:{symbol}:bars:low", str(timestamp_ms), low),
            (f"stocks:{symbol}:bars:close", str(timestamp_ms), close),
            (f"stocks:{symbol}:bars:volume", str(timestamp_ms), volume),
        ]
    )
