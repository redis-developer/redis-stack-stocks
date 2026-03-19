from __future__ import annotations

import datetime

import pandas_market_calendars as mcal
import pytz
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, WebSocket
from redis.exceptions import RedisError

from connection import db, db_sync
from store import get_stocks, reset_demo_data, search_stocks

router = APIRouter(prefix="/api/1.0")


def get_last_market_close() -> datetime.datetime:
    exchange = mcal.get_calendar("NASDAQ")
    today = datetime.datetime.now(pytz.timezone("US/Eastern"))
    valid_days = exchange.valid_days(
        start_date=(today - relativedelta(days=14)).strftime("%Y-%m-%d"),
        end_date=today.strftime("%Y-%m-%d"),
    )
    last_day = valid_days[-2]
    close = exchange["market_close", last_day.strftime("%Y-%m-%d")]
    return datetime.datetime(
        year=last_day.year,
        month=last_day.month,
        day=last_day.day,
        hour=close.hour,
        minute=close.minute,
        second=0,
        microsecond=0,
        tzinfo=pytz.timezone("US/Eastern"),
    )


def _normalize_series_points(points: list[tuple[int, float]] | list[list[int | float]]) -> list[list[int | float]]:
    normalized: list[list[int | float]] = []
    for timestamp, value in points:
        normalized.append([int(timestamp), float(value)])
    return normalized


def _normalize_series_value(value: tuple[int, float] | list[int | float] | None) -> list[int | float]:
    if value is None:
        return [0, 0]
    timestamp, point = value
    return [int(timestamp), float(point)]


@router.post("/watchlist/{symbol}")
async def watch(symbol: str) -> dict[str, str]:
    normalized = symbol.upper()
    if await db.sismember("watchlist", normalized):
        return {"status": "Already in watchlist"}

    await db.sadd("watchlist", normalized)
    await db.publish("watchlist-updated", normalized)
    return {"status": "Added to watchlist"}


@router.delete("/watchlist/{symbol}")
async def unwatch(symbol: str) -> dict[str, str]:
    normalized = symbol.upper()
    if await db.sismember("watchlist", normalized):
        await db.srem("watchlist", normalized)
        await db.publish("watchlist-updated", normalized)
        return {"status": "Removed from watchlist"}

    return {"status": "Not in watchlist"}


@router.get("/watchlist")
async def watchlist() -> list[dict]:
    return get_stocks(db_sync, sorted(await db.smembers("watchlist")))


@router.get("/search/{query}")
async def search(query: str) -> list[dict]:
    if not query:
        return []
    return search_stocks(db_sync, query)


@router.get("/bars/{symbol}")
async def bars(symbol: str) -> list[list[int | float]]:
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now - relativedelta(days=7)

    try:
        values = db_sync.ts().range(
            f"stocks:{symbol.upper()}:bars:close",
            str(int(start.timestamp() * 1000)),
            str(int(now.timestamp() * 1000)),
            count=30,
        )
    except RedisError:
        return []

    return _normalize_series_points(values)


@router.get("/close/{symbol}")
async def close(symbol: str) -> list[int | float]:
    time = get_last_market_close()

    try:
        results = db_sync.ts().range(
            f"stocks:{symbol.upper()}:bars:close",
            str(int((time - relativedelta(days=3)).timestamp() * 1000)),
            str(int(time.timestamp() * 1000)),
        )
    except RedisError:
        results = []

    if not results:
        try:
            latest = db_sync.ts().get(f"stocks:{symbol.upper()}:bars:close")
        except RedisError:
            return []
        return [] if latest is None else _normalize_series_value(latest)

    return _normalize_series_value(results[-1])


@router.get("/trade/{symbol}")
async def trade(symbol: str) -> list[int | float]:
    try:
        value = db_sync.ts().get(f"stocks:{symbol.upper()}:trades:price")
    except RedisError:
        return [0, 0]

    return _normalize_series_value(value)


@router.get("/trending")
def trending() -> list[str | int]:
    try:
        return db_sync.topk().list("trending-stocks")
    except RedisError:
        return []


@router.post("/demo/reset")
async def reset_demo() -> dict[str, str]:
    reset_demo_data(db_sync)
    db_sync.publish("watchlist-updated", "reset")
    db_sync.publish("trending-stocks", "updated")
    return {"status": "Reset demo data"}


@router.websocket_route("/trending")
async def trending_stocks_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    pubsub = db.pubsub()
    await pubsub.subscribe("trending-stocks")

    async for event in pubsub.listen():
        if event["type"] == "subscribe":
            continue

        try:
            payload = db_sync.topk().list("trending-stocks", withcount=True)
        except RedisError:
            payload = []
        await websocket.send_json(payload)


@router.websocket_route("/trade")
async def trades_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    pubsub = db.pubsub()
    await pubsub.subscribe("trade")

    async for event in pubsub.listen():
        if event["type"] == "subscribe":
            continue

        symbol = str(event["data"]).upper()
        await websocket.send_json(
            {
                "symbol": symbol,
                "trade": await trade(symbol),
            }
        )


@router.websocket_route("/bars")
async def bars_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    pubsub = db.pubsub()
    await pubsub.subscribe("bar")

    async for event in pubsub.listen():
        if event["type"] == "subscribe":
            continue

        await websocket.send_text(str(event["data"]))
