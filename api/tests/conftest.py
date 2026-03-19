from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from redis import Redis

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app
from store import ensure_index, save_stock


@pytest.fixture()
async def redis_client() -> Redis:
    client = Redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )
    ensure_index(client)
    keys = client.keys("stocks:*")
    if keys:
        client.delete(*keys)
    client.delete("watchlist", "trending-stocks")
    yield client
    keys = client.keys("stocks:*")
    if keys:
        client.delete(*keys)
    client.delete("watchlist", "trending-stocks")
    client.close()


@pytest.fixture()
async def seeded_stock(redis_client: Redis) -> dict:
    stock = {
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
    }
    save_stock(redis_client, stock)
    return stock


@pytest.fixture()
async def client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as http_client:
        yield http_client
