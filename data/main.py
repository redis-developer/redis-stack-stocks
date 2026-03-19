import csv
import os

from redis.asyncio import Redis

from store import ensure_index, save_stock

# Symbol,Name,Last Sale,Net Change,% Change,Market Cap,Country,IPO Year,Volume,Sector,Industry

async def main():
    db = Redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        decode_responses=True,
    )
    await ensure_index(db)
    with open('nasdaq.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            await save_stock(db, {
                'pk': row['Symbol'],
                'symbol': row['Symbol'],
                'name': row['Name'],
                'last_sale': row['Last Sale'],
                'market_cap': row['Market Cap'],
                'country': row['Country'],
                'ipo': row['IPO Year'],
                'volume': row['Volume'],
                'sector': row['Sector'],
                'industry': row['Industry'],
                'news': [],
            })

    await db.aclose()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
