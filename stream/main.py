from __future__ import annotations

import asyncio
import logging
import os
import time

from alpaca import run_live
from connection import db, db_sync
from replay import ReplayFeed
from store import get_watchlist, reset_trending

LOGGER = logging.getLogger(__name__)


async def reset_trending_loop(interval_seconds: int = 60) -> None:
    while True:
        reset_trending(db_sync)
        await asyncio.sleep(interval_seconds)


async def replay_loop() -> None:
    feed = ReplayFeed(os.getenv("REPLAY_FIXTURE_PATH"))
    speed = max(float(os.getenv("REPLAY_SPEED", "1")), 0.1)
    loop = os.getenv("REPLAY_LOOP", "true").lower() != "false"

    while True:
        watchlist = await get_watchlist(db)
        timestamp_ms = int(time.time() * 1000)

        for symbol in watchlist:
            if symbol in feed.symbols():
                await feed.emit(db, db_sync, symbol, timestamp_ms)

        feed.advance()
        await asyncio.sleep(1 / speed)

        if not loop and feed.tick > 32:
            break


async def run_replay() -> None:
    asyncio.create_task(reset_trending_loop())
    await replay_loop()


async def main() -> None:
    mode = os.getenv("MARKET_DATA_MODE", "replay").lower()
    reset_trending(db_sync)

    if mode == "live":
        await run_live()
        return

    LOGGER.info("Starting replay mode")
    await run_replay()


if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s %(levelname)s %(message)s",
        level=logging.INFO,
    )

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        LOGGER.info("Shutting down stream service")
