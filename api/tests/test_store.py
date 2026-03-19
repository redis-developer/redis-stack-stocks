from store import get_stock, reset_demo_data, search_stocks


async def test_searches_by_symbol(redis_client, seeded_stock):
    results = search_stocks(redis_client, "AAP")

    assert results
    assert results[0]["symbol"] == seeded_stock["symbol"]


async def test_get_stock(redis_client, seeded_stock):
    result = get_stock(redis_client, seeded_stock["symbol"])

    assert result is not None
    assert result["name"] == seeded_stock["name"]


async def test_reset_demo_data_clears_runtime_state(redis_client, seeded_stock):
    redis_client.sadd("watchlist", seeded_stock["symbol"])
    redis_client.ts().create("stocks:AAPL:trades:price", duplicate_policy="last")
    redis_client.ts().create("stocks:AAPL:bars:close", duplicate_policy="last")
    redis_client.ts().add("stocks:AAPL:trades:price", 1000, 190.5)
    redis_client.ts().add("stocks:AAPL:bars:close", 1000, 189.25)
    redis_client.topk().reserve("trending-stocks", 12, 50, 4, 0.9)
    redis_client.topk().add("trending-stocks", seeded_stock["symbol"])

    stock = get_stock(redis_client, seeded_stock["symbol"])
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
    redis_client.json().set("stocks:AAPL", "$", stock)

    reset_demo_data(redis_client)

    assert redis_client.smembers("watchlist") == set()
    assert redis_client.exists("trending-stocks") == 0
    assert redis_client.exists("stocks:AAPL:trades:price") == 0
    assert redis_client.exists("stocks:AAPL:bars:close") == 0
    assert get_stock(redis_client, seeded_stock["symbol"])["news"] == []
