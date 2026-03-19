import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from connection import db_sync


async def test_watchlist_crud(client, seeded_stock):
    response = await client.post("/api/1.0/watchlist/AAPL")
    assert response.json()["status"] == "Added to watchlist"

    watchlist = await client.get("/api/1.0/watchlist")
    assert watchlist.json()[0]["symbol"] == "AAPL"

    delete_response = await client.delete("/api/1.0/watchlist/AAPL")
    assert delete_response.json()["status"] == "Removed from watchlist"


async def test_search_route(client, seeded_stock):
    response = await client.get("/api/1.0/search/AAP")

    assert response.status_code == 200
    assert response.json()[0]["symbol"] == "AAPL"


async def test_market_data_routes(client, seeded_stock):
    now = int(time.time() * 1000)

    db_sync.ts().create("stocks:AAPL:trades:price", duplicate_policy="last")
    db_sync.ts().create("stocks:AAPL:bars:close", duplicate_policy="last")
    db_sync.ts().add("stocks:AAPL:trades:price", now, 190.5)
    db_sync.ts().add("stocks:AAPL:bars:close", now, 189.25)
    db_sync.topk().reserve("trending-stocks", 12, 50, 4, 0.9)
    db_sync.topk().add("trending-stocks", "AAPL")

    bars = await client.get("/api/1.0/bars/AAPL")
    trade = await client.get("/api/1.0/trade/AAPL")
    close = await client.get("/api/1.0/close/AAPL")
    trending = await client.get("/api/1.0/trending")

    assert bars.status_code == 200
    assert trade.status_code == 200
    assert close.status_code == 200
    assert trending.status_code == 200
    assert bars.json()
    assert trade.json()[1] == 190.5
    assert close.json()[1] == 189.25
    assert trending.json()[0] == "AAPL"


async def test_reset_demo_route(client, seeded_stock):
    db_sync.sadd("watchlist", "AAPL")
    db_sync.ts().create("stocks:AAPL:trades:price", duplicate_policy="last")
    db_sync.ts().add("stocks:AAPL:trades:price", 1000, 190.5)

    stock = db_sync.json().get("stocks:AAPL")
    stock["news"] = [
        {
            "id": "aapl-1",
            "headline": "Replay headline",
            "author": "Redis Demo Feed",
            "created_at": "2026-03-18T15:30:00Z",
            "updated_at": "2026-03-18T15:30:00Z",
            "summary": "Replay-mode placeholder news for Apple.",
            "url": "https://example.com/aapl-1",
            "images": [],
            "symbols": ["AAPL"],
            "source": "replay",
        }
    ]
    db_sync.json().set("stocks:AAPL", "$", stock)

    response = await client.post("/api/1.0/demo/reset")

    assert response.status_code == 200
    assert response.json()["status"] == "Reset demo data"
    assert db_sync.smembers("watchlist") == set()
    assert db_sync.exists("stocks:AAPL:trades:price") == 0
    assert db_sync.json().get("stocks:AAPL")["news"] == []
