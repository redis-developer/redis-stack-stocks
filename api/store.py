from __future__ import annotations

import re

from redis import Redis
from redis.commands.json.path import Path
from redis.commands.search.field import TextField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from redis.exceptions import ResponseError

from schemas import News, Stock

INDEX_NAME = "stocks:index"
STOCK_KEY_PREFIX = "stocks:"
MAX_SEARCH_RESULTS = 100
SEARCH_ESCAPE = re.compile(r"([^A-Z0-9])")


def make_stock_key(symbol: str) -> str:
    return f"{STOCK_KEY_PREFIX}{symbol.upper()}"


def _normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper()


def _escape_search_term(query: str) -> str:
    return SEARCH_ESCAPE.sub(r"\\\1", query.strip().upper())


def ensure_index(db: Redis) -> None:
    try:
        db.ft(INDEX_NAME).create_index(
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


def save_stock(db: Redis, stock_data: dict | Stock) -> Stock:
    stock = stock_data if isinstance(stock_data, Stock) else Stock.model_validate(stock_data)
    db.json().set(
        make_stock_key(stock.symbol),
        Path.root_path(),
        stock.model_dump(mode="json"),
    )
    return stock


def get_stock(db: Redis, symbol: str) -> dict | None:
    document = db.json().get(make_stock_key(symbol))
    if not document:
        return None
    return Stock.model_validate(document).model_dump(mode="json")


def get_stocks(db: Redis, symbols: list[str]) -> list[dict]:
    stocks: list[dict] = []
    for symbol in sorted({_normalize_symbol(symbol) for symbol in symbols if symbol}):
        stock = get_stock(db, symbol)
        if stock:
            stocks.append(stock)
    return stocks


def search_stocks(db: Redis, query: str) -> list[dict]:
    normalized = _escape_search_term(query)
    if not normalized:
        return []

    search = (
        Query(f"@symbol:{normalized}*")
        .sort_by("symbol", asc=True)
        .paging(0, MAX_SEARCH_RESULTS)
    )
    results = db.ft(INDEX_NAME).search(search)
    stocks: list[dict] = []

    for result in results.docs:
        stock = get_stock(db, result.id.removeprefix(STOCK_KEY_PREFIX))
        if stock:
            stocks.append(stock)

    return stocks


def add_news(db: Redis, symbol: str, items: list[dict | News]) -> dict | None:
    stock_data = get_stock(db, symbol)
    if stock_data is None:
        return None

    stock = Stock.model_validate(stock_data)
    seen_ids = {news.id for news in stock.news}
    for item in items:
        news_item = item if isinstance(item, News) else News.model_validate(item)
        if news_item.id not in seen_ids:
            stock.news.append(news_item)
            seen_ids.add(news_item.id)

    save_stock(db, stock)
    return stock.model_dump(mode="json")


def reset_demo_data(db: Redis) -> None:
    series_keys = list(db.scan_iter(match="stocks:*:*"))
    if series_keys:
        db.delete(*series_keys)

    db.delete("watchlist", "trending-stocks")

    for key in db.scan_iter(match="stocks:*"):
        if key.count(":") != 1:
            continue
        document = db.json().get(key)
        if not document:
            continue
        if document.get("news"):
            document["news"] = []
            db.json().set(key, Path.root_path(), document)
