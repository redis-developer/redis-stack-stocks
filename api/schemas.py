from __future__ import annotations

from pydantic import BaseModel, Field


class Image(BaseModel):
    size: str = ""
    url: str = ""


class News(BaseModel):
    id: str
    headline: str
    author: str = ""
    created_at: str = ""
    updated_at: str = ""
    summary: str = ""
    url: str = ""
    images: list[Image] = Field(default_factory=list)
    symbols: list[str] = Field(default_factory=list)
    source: str = ""


class Stock(BaseModel):
    pk: str
    symbol: str
    name: str
    last_sale: str = ""
    market_cap: str = ""
    country: str = ""
    ipo: str = ""
    volume: str = ""
    sector: str = ""
    industry: str = ""
    news: list[News] = Field(default_factory=list)
