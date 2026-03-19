from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from redis import Redis
from redis.asyncio import Redis as AsyncRedis

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from replay import ReplayFeed
from store import reset_trending


async def test_replay_emits_trade_bar_and_news():
    db = AsyncRedis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )
    db_sync = Redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )

    await db.json().set(
        "stocks:AAPL",
        "$",
        {
            "pk": "AAPL",
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "last_sale": "$191.00",
            "market_cap": "1",
            "country": "United States",
            "ipo": "1980",
            "volume": "10",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "news": [],
        },
    )
    await db.sadd("watchlist", "AAPL")
    reset_trending(db_sync)

    feed = ReplayFeed()
    await feed.emit(db, db_sync, "AAPL", int(time.time() * 1000))

    trade = db_sync.ts().get("stocks:AAPL:trades:price")
    bar = db_sync.ts().get("stocks:AAPL:bars:close")
    stock = await db.json().get("stocks:AAPL")

    assert trade is not None
    assert bar is not None
    assert stock["news"]

    keys = await db.keys("stocks:AAPL*")
    if keys:
        await db.delete(*keys)
    await db.delete("watchlist", "trending-stocks")
    await db.aclose()


async def test_replay_recreates_trending_key_when_missing():
    db = AsyncRedis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )
    db_sync = Redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )

    await db.json().set(
        "stocks:AAPL",
        "$",
        {
            "pk": "AAPL",
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "last_sale": "$191.00",
            "market_cap": "1",
            "country": "United States",
            "ipo": "1980",
            "volume": "10",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "news": [],
        },
    )
    await db.sadd("watchlist", "AAPL")
    reset_trending(db_sync)
    await db.delete("trending-stocks")

    feed = ReplayFeed()
    await feed.emit(db, db_sync, "AAPL", int(time.time() * 1000))

    assert db_sync.topk().list("trending-stocks")

    keys = await db.keys("stocks:AAPL*")
    if keys:
        await db.delete(*keys)
    await db.delete("watchlist", "trending-stocks")
    await db.aclose()
