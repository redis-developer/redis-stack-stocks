import os
import redis
from alpaca_trade_api.stream import Stream, Trade
from alpaca_trade_api.common import URL
from alpaca_trade_api.rest import REST
from redis import RedisError
from aredis_om.model import NotFoundError
from models import Stock, Trade as DBTrade

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
r = redis.from_url(redis_url)
# r.flushall()
try:
    r.topk().reserve('topstocks', 5, 50, 4, 0.9)
except:
    pass
api = REST()
symbols = [
    'AAPL',
    'AMC',
    'AMD',
    'AMZN',
    'CSCO',
    'FB',
    'GME',
    'GOOG',
    'MSFT',
    'QCOM',
    'SBUX',
    'TSLA',
]


async def create_ts(symbol: str):
    try:
        await r.ts().create(f"leaderboard:{symbol}:position", retention_msecs=1800000, duplicate_policy='last', labels={'symbol': symbol})
    except Exception as e:
        pass

    try:
        await r.ts().create(f"leaderboard:{symbol}:price", retention_msecs=1800000, duplicate_policy='last', labels={'symbol': symbol})
    except Exception as e:
        pass


def get_trades(symbol: str):
    return api.get_trades(symbol, "2022-03-08T14:30:00Z", "2022-03-08T14:30:01Z").df


async def trade_callback(trade: Trade):
    """
        Sample quote object:
    {
        'conditions': ['@'],
        'exchange': 'V',
        'id': 4864,
        'price': 2923.175,
        'size': 100,
        'symbol': 'AMZN',
        'tape': 'C',
        'timestamp': 1646929983060642518
    }
    """
    # await log_trade(trade)
    await create_ts(trade.symbol)
    r.ts().add(f"leaderboard:{trade.symbol}:price", str(
        int(trade.timestamp.timestamp() * 1000)), trade.price)
    response = r.topk().add('topstocks', trade.symbol)
    topItems = r.topk().list('topstocks')

    if (response[0] != None):
        r.ts().madd([
            (f"leaderboard:{symbol}:position", str(int(trade.timestamp.timestamp() * 1000)), idx) for idx, symbol in enumerate(topItems)
        ])

    print(f"\n\n")
    for idx, item in enumerate(topItems):
        price = r.ts().get(f"leaderboard:{item}:price")
        print(
            f"{idx+1}. {item} ({'N/A' if price is None else '${:,.2f}'.format(price[1])})")


# Initiate Class Instance
stream = Stream(base_url=URL('https://paper-api.alpaca.markets'),
                data_feed='iex')  # <- replace to SIP if you have PRO subscription


async def run_realtime_topk():
    # subscribing to event
    for symbol in symbols:
        stream.subscribe_trades(trade_callback, symbol)

    return await stream._run_forever()

async def log_trade(trade: Trade):
    try:
        dbStock = await Stock.get(f"{trade.symbol}:trades")
    except NotFoundError as e:
        dbStock = Stock(
            pk=f"{trade.symbol}:trades",
            symbol=trade.symbol,
            trades=[]
        )

    dbStock.trades.append(DBTrade(
        date=trade.timestamp.timestamp(),
        exchange=trade.exchange,
        price=trade.price,
        size=trade.size,
        conditions=trade.conditions,
        id=trade.id,
        tape=trade.tape
    ))

    await dbStock.save()

async def run_historical_topk():
    try:
        for symbol in symbols:
            bars = get_trades(symbol)
            trades = []
            print(f"\n{symbol}: {len(bars)}")
            for row in bars.itertuples():
                trades.append(DBTrade(
                    date=row.Index.timestamp(),
                    exchange=row.exchange,
                    price=row.price,
                    size=row.size,
                    conditions=row.conditions,
                    id=row.id,
                    tape=row.tape,
                ))
                response = r.topk().add('topstocks', symbol)

                if (response[0] != None):
                    print(f"\n{symbol} evicted {response[0]}")

            try:
                dbStock = await Stock.get(symbol)
                dbStock.trades = trades
            except NotFoundError as e:
                dbStock = Stock(
                    pk=symbol,
                    symbol=symbol,
                    trades=trades
                )

            await dbStock.save()

        print("\nTOP 5 STOCKS:\n")
        topItems = r.topk().list('topstocks')
        for item in topItems:
            print(item)

    except RedisError as e:
        print(e)

if __name__ == '__main__':
    import asyncio
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_realtime_topk())
    loop.close()
