
from alpaca import sync_watchlist, aioconnect
from connection import db, db_sync
import asyncio
import logging


async def reserve_topk():
    db_sync.topk().reserve('trending-stocks', 12, 50, 4, 0.9)
    await db.expire('trending-stocks', 60)


async def listen_for_events():
    await db.config_set('notify-keyspace-events', 'KEsx')
    pubsub = db.pubsub()
    await pubsub.subscribe('__keyspace@0__:trending-stocks')
    await pubsub.subscribe('__keyspace@0__:watchlist')

    async for ev in pubsub.listen():
        if ev['type'] == 'subscribe':
            continue

        if ev['data'] == b'expired':
            logging.log(logging.DEBUG, 'trending-stocks expired')
            await reserve_topk()
        elif ev['channel'] == b'__keyspace@0__:watchlist':
            logging.log(logging.DEBUG, 'watchlist updated')
            await sync_watchlist()


async def main():
    asyncio.create_task(aioconnect())
    await asyncio.sleep(5)

    await db.delete('trending-stocks')
    await reserve_topk()
    await sync_watchlist()
    asyncio.create_task(listen_for_events())
    while 1:
        await asyncio.sleep(60)


if __name__ == '__main__':
    logging.basicConfig(format='%(asctime)s %(levelname)s %(message)s',
                        level=logging.INFO)

    logging.log(logging.INFO, 'Starting up...')
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main())
        loop.close()
    except KeyboardInterrupt:
        pass
