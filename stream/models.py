from typing import List
from aredis_om import Field, JsonModel, EmbeddedJsonModel


class Image(EmbeddedJsonModel):
    size: str
    url: str


class News(EmbeddedJsonModel):
    id: str
    headline: str
    author: str
    created_at: str
    updated_at: str
    summary: str
    url: str
    images: List[Image]
    symbols: List[str]
    source: str


class Stock(JsonModel):
    @staticmethod
    async def add_news(symbol: str, news: News):
        stock = await Stock.get(symbol)

        if (stock is None):
            return

        stock.news.append(news)

        await stock.save()

    symbol: str = Field(index=True, full_text_search=True, sortable=True)
    name: str = Field(index=True, full_text_search=True)
    last_sale: str
    market_cap: str
    country: str
    ipo: str
    volume: str
    sector: str = Field(index=True, full_text_search=True)
    industry: str = Field(index=True, full_text_search=True)
    news: List[News]

    @classmethod
    def make_key(cls, part: str):
        return f"stocks:{part}"

    class Meta:
        index_name = "stocks:index"
