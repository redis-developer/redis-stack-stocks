from __future__ import annotations

import json
import math
from pathlib import Path

from store import add_news, record_bar, record_trade

DEFAULT_FIXTURE_PATH = Path(__file__).with_name("fixtures").joinpath("replay.json")


class ReplayFeed:
    def __init__(self, fixture_path: str | None = None) -> None:
        path = Path(fixture_path) if fixture_path else DEFAULT_FIXTURE_PATH
        with path.open("r", encoding="utf-8") as fixture:
            self.fixture = json.load(fixture)
        self.tick = 0

    def symbols(self) -> list[str]:
        return list(self.fixture["symbols"].keys())

    async def ensure_news(self, db, symbol: str) -> None:
        symbol_data = self.fixture["symbols"].get(symbol, {})
        news = symbol_data.get("news", [])
        if news:
            await add_news(db, symbol, news)

    async def emit(self, db, db_sync, symbol: str, timestamp_ms: int) -> None:
        symbol_data = self.fixture["symbols"][symbol]
        base_price = float(symbol_data["basePrice"])
        cycle = self.tick % 16
        delta = math.sin(cycle / 2) * 1.6
        price = round(base_price + delta, 2)
        open_price = round(price - 0.4, 2)
        high = round(price + 0.6, 2)
        low = round(price - 0.7, 2)
        size = 100 + cycle * 10
        volume = 1000 + cycle * 25

        record_trade(db_sync, symbol, timestamp_ms, price, size)
        record_bar(db_sync, symbol, timestamp_ms, open_price, high, low, price, volume)

        await db.publish("trade", symbol)
        await db.publish("bar", symbol)
        await db.publish("trending-stocks", "updated")
        await self.ensure_news(db, symbol)

    def advance(self) -> None:
        self.tick += 1
