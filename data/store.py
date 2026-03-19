from __future__ import annotations

from redis.asyncio import Redis
from redis.commands.json.path import Path
from redis.commands.search.field import TextField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.exceptions import ResponseError

INDEX_NAME = "stocks:index"
STOCK_KEY_PREFIX = "stocks:"


def make_stock_key(symbol: str) -> str:
    return f"{STOCK_KEY_PREFIX}{symbol.upper()}"


async def ensure_index(db: Redis) -> None:
    try:
        await db.ft(INDEX_NAME).create_index(
            (
                TextField("$.symbol", as_name="symbol", sortable=True),
                TextField("$.name", as_name="name"),
                TextField("$.sector", as_name="sector"),
                TextField("$.industry", as_name="industry"),
            ),
            definition=IndexDefinition(
                prefix=[STOCK_KEY_PREFIX],
                index_type=IndexType.JSON,
            ),
        )
    except ResponseError as exc:
        if "Index already exists" not in str(exc):
            raise


async def save_stock(db: Redis, stock: dict) -> None:
    await db.json().set(make_stock_key(stock["symbol"]), Path.root_path(), stock)
