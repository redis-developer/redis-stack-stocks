import asyncio
import datetime
import logging
import os
import time
import dateutil.parser as dp
from dateutil.relativedelta import relativedelta
from alpaca_trade_api.stream import Stream, Trade, Bar, Quote, NewsV2
from alpaca_trade_api.common import URL
from alpaca_trade_api.rest import REST, TimeFrame, TimeFrameUnit
from models import Stock
from connection import db, db_sync


### This is a workaround to eliminate the threadsafe issue with the Alpaca SDK
def noop(*args, **kws):
    return None


def run_coroutine_threadsafe(coro, loop):
    logging.log(logging.INFO, 'test')
    asyncio.create_task(coro)
    return type('obj', (object,), {'result': noop})

asyncio.run_coroutine_threadsafe = run_coroutine_threadsafe
### End Alpaca SDK workaround


# define APCA_API_SECRET_KEY and APCA_API_KEY environment variables
api = REST()

ALPACA_API_KEY = os.getenv("APCA_API_KEY_ID")
ALPACA_SECRET_KEY = os.getenv("APCA_API_SECRET_KEY")


def get_historical_news(symbol):
    now = datetime.datetime.now(datetime.timezone.utc)
    end = now - relativedelta(minutes=16)
    start = now - relativedelta(days=8)
    values = api.get_news(symbol, start.isoformat(), end.isoformat(), limit=50)
    return [x._raw for x in values]


def get_historical_trades(symbol):
    now = datetime.datetime.now(datetime.timezone.utc)
    end = now - relativedelta(minutes=16)
    start = now - relativedelta(minutes=76)
    values = api.get_trades(symbol, start.isoformat(),
                            end.isoformat(), limit=50)

    return [{
        "date": dp.parse(x._raw["t"]).timestamp(),
        "exchange": x._raw["x"],
        "price": x._raw["p"],
        "size": x._raw["s"],
        "conditions": x._raw["c"],
        "id": x._raw["i"],
        "tape": x._raw["z"]
    } for x in values]


def get_historical_bars(symbol):
    now = datetime.datetime.now(datetime.timezone.utc)
    end = now - relativedelta(minutes=16)
    start = now - relativedelta(minutes=76)
    values = api.get_bars(symbol, TimeFrame(
        1, TimeFrameUnit.Minute), start.isoformat(), end.isoformat(), limit=1000)
    return [{
        "date": dp.parse(x._raw["t"]).timestamp(),
        "open": x._raw["o"],
        "high": x._raw["h"],
        "low": x._raw["l"],
        "close": x._raw["c"],
        "volume": x._raw["v"],
    } for x in values]


def get_historical_quotes(symbol):
    now = datetime.datetime.now(datetime.timezone.utc)
    end = now - relativedelta(minutes=16)
    start = now - relativedelta(minutes=76)
    values = api.get_quotes(symbol, start.isoformat(),
                            end.isoformat(), limit=1000)
    return [{
        "date": dp.parse(x._raw["t"]).timestamp(),
        "ask_exchange": x._raw["ax"],
        "ask_price": x._raw["ap"],
        "ask_size": x._raw["as"],
        "bid_exchange": x._raw["bx"],
        "bid_price": x._raw["bp"],
        "bid_size": x._raw["bs"],
        "conditions": x._raw["c"],
    } for x in values]


async def update_trade(trade: Trade):
    """
        Sample trade object:
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
    logging.log(logging.INFO, f'New trade for {trade.symbol}')
    logging.log(logging.DEBUG, str(trade))
    ts = db_sync.ts()
    timestamp = str(int(trade.timestamp.timestamp() * 1000))
    ts.madd([
        (
            f"stocks:{trade.symbol}:trades:price",
            timestamp,
            trade.price
        ),
        (
            f"stocks:{trade.symbol}:trades:size",
            timestamp,
            trade.size
        )])

    if (db_sync.exists('trending-stocks')):
        db_sync.topk().add('trending-stocks', trade.symbol)
        await db.publish('trending-stocks', 'updated')

    await db.publish('trade', trade.symbol)


async def incoming_trade(trade: Trade):
    asyncio.create_task(update_trade(trade))


async def update_bar(bar: Bar):
    """
        Sample bar object:
    {
        'close': 150.76,
        'high': 150.78,
        'low': 150.61,
        'open': 150.61,
        'symbol': 'AAPL',
        'timestamp': 1647282120000000000,
        'trade_count': 27,
        'volume': 2199,
        'vwap': 150.71078
    }
    """
    logging.log(logging.INFO, f'New bar for {bar.symbol}')
    logging.log(logging.DEBUG, str(bar))
    ts = db_sync.ts()
    timestamp = str(int(bar.timestamp / 1000000))
    ts.madd([
        (
            f"stocks:{bar.symbol}:bars:close",
            timestamp,
            bar.close
        ),
        (
            f"stocks:{bar.symbol}:bars:high",
            timestamp,
            bar.high
        ),
        (
            f"stocks:{bar.symbol}:bars:open",
            timestamp,
            bar.open
        ),
        (
            f"stocks:{bar.symbol}:bars:low",
            timestamp,
            bar.low
        ),
        (
            f"stocks:{bar.symbol}:bars:volume",
            timestamp,
            bar.volume
        )])

    await db.publish('bar', bar.symbol)


async def incoming_bar(bar: Bar):
    asyncio.create_task(update_bar(bar))


async def incoming_news(news: NewsV2):
    logging.log(logging.INFO, f'New news for {news.symbol}')
    logging.log(logging.DEBUG, str(news))
    try:
        await Stock.add_news(news.symbol, **news)
    except:
        pass


async def incoming_quote(quote: Quote):
    """
        Sample quote object:
    {
        'ask_exchange': 'V',
        'ask_price': 150.74,
        'ask_size': 4,
        'bid_exchange': 'V',
        'bid_price': 150.4,
        'bid_size': 2,
        'conditions': ['R'],
        'symbol': 'AAPL',
        'tape': 'C',
        'timestamp': 1647282073919284035
    }
    """
    logging.log(logging.INFO, f'New quote for {quote.symbol}')
    logging.log(logging.DEBUG, str(quote))
    ts = db_sync.ts()
    timestamp = str(int(quote.timestamp.timestamp() * 1000))
    ts.madd([
        (
            f"stocks:{quote.symbol}:quotes:ask_price",
            timestamp,
            quote.ask_price
        ),
        (
            f"stocks:{quote.symbol}:quotes:ask_size",
            timestamp,
            quote.ask_size
        ),
        (
            f"stocks:{quote.symbol}:quotes:bid_price",
            timestamp,
            quote.bid_price
        ),
        (
            f"stocks:{quote.symbol}:quotes:bid_size",
            timestamp,
            quote.bid_size
        )])


async def initialize_stock(symbol: str):
    stock = await Stock.get(symbol)

    if len(stock.news) == 0:
        stock.news = get_historical_news(symbol)

        await stock.save()

    trades = get_historical_trades(symbol)
    bars = get_historical_bars(symbol)
    ts = db_sync.ts()
    ts_keys = [
        f"stocks:{symbol}:trades:price",
        f"stocks:{symbol}:trades:size",
        f"stocks:{symbol}:bars:open",
        f"stocks:{symbol}:bars:high",
        f"stocks:{symbol}:bars:low",
        f"stocks:{symbol}:bars:close",
        f"stocks:{symbol}:bars:volume",
    ]

    for key in ts_keys:
        if db_sync.exists(key):
            continue
        ts.create(key, duplicate_policy='last', labels={'symbol': symbol})

    queries = [(f"stocks:{symbol}:trades:price", str(
        int(trade['date'] * 1000)), trade['price']) for trade in trades]
    queries += [(f"stocks:{symbol}:trades:size",
                 str(int(trade['date'] * 1000)), trade['size']) for trade in trades]
    queries += [(f"stocks:{symbol}:bars:open",
                 str(int(bar['date'] * 1000)), bar['open']) for bar in bars]
    queries += [(f"stocks:{symbol}:bars:high",
                 str(int(bar['date'] * 1000)), bar['high']) for bar in bars]
    queries += [(f"stocks:{symbol}:bars:low",
                 str(int(bar['date'] * 1000)), bar['low']) for bar in bars]
    queries += [(f"stocks:{symbol}:bars:close",
                 str(int(bar['date'] * 1000)), bar['close']) for bar in bars]
    queries += [(f"stocks:{symbol}:bars:volume",
                 str(int(bar['date'] * 1000)), bar['volume']) for bar in bars]

    ts.madd(queries)

    return stock

conn = Stream(ALPACA_API_KEY,
              ALPACA_SECRET_KEY,
              base_url=URL('https://paper-api.alpaca.markets'),
              data_feed='iex')


def connect():
    global conn

    logging.log(logging.INFO, "Connecting to Alpaca")
    try:
        conn.run()
    except Exception as e:
        print(e)


async def aioconnect():
    global conn
    logging.log(logging.INFO, "Connecting to Alpaca")

    try:
        await conn._run_forever()
    except Exception as e:
        print(e)


async def unsubscribe(*symbols: str):
    global conn
    conn.unsubscribe_trades(*symbols)
    conn.unsubscribe_bars(*symbols)


async def subscribe(*symbols: str):
    global conn
    logging.log(logging.INFO, f'Subscribing to {symbols}')
    for symbol in symbols:
        await initialize_stock(symbol)
    conn.subscribe_trades(incoming_trade, *symbols)
    conn.subscribe_bars(incoming_bar, *symbols)
    logging.log(logging.INFO, f'Subscribed to {symbols}')


watch_list = []


async def sync_watchlist():
    try:
        global watch_list
        new_watch_list = await db.smembers('watchlist')

        unsubs = [s.decode('utf-8').upper()
                  for s in set(watch_list) - set(new_watch_list)]
        subs = [s.decode('utf-8').upper()
                for s in set(new_watch_list) - set(watch_list)]

        if len(unsubs) > 0:
            await unsubscribe(*unsubs)
            time.sleep(3)

        if len(subs) > 0:
            await subscribe(*subs)
            time.sleep(3)

        watch_list = new_watch_list
    except Exception as e:
        print(e)
