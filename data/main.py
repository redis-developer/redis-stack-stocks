import csv
from models import Stock
from aredis_om.model import Migrator

# Symbol,Name,Last Sale,Net Change,% Change,Market Cap,Country,IPO Year,Volume,Sector,Industry

async def main():
    await Migrator().run()
    with open('nasdaq.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            await Stock(
                pk=row['Symbol'],
                symbol=row['Symbol'],
                name=row['Name'],
                last_sale=row['Last Sale'],
                market_cap=row['Market Cap'],
                country=row['Country'],
                ipo=row['IPO Year'],
                volume=row['Volume'],
                sector=row['Sector'],
                industry=row['Industry'],
                news=[]
            ).save()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
