import os
from alpaca_trade_api.stream import Stream, Trade
from alpaca_trade_api.common import URL
from alpaca_trade_api.rest import REST

api = REST()
ALPACA_API_KEY = os.getenv("APCA_API_KEY_ID")
ALPACA_SECRET_KEY = os.getenv("APCA_API_SECRET_KEY")

symbols = [
    'AAPL',
    'GOOG',
]


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
    print(f'Trade: {trade}')

# Initiate Class Instance
stream = Stream(ALPACA_API_KEY,
              ALPACA_SECRET_KEY,
              base_url=URL('https://paper-api.alpaca.markets'),
              data_feed='iex')


async def run_realtime_topk():
    # subscribing to event
    for symbol in symbols:
        stream.subscribe_trades(trade_callback, symbol)

    return await stream._run_forever()

if __name__ == '__main__':
    import asyncio
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_realtime_topk())
    loop.close()
