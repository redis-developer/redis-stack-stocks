import datetime
import redis
from dateutil.relativedelta import relativedelta
from typing import List
from fastapi import APIRouter, WebSocket
from models import Stock
from connection import db, db_sync

router = APIRouter(prefix='/api/1.0')


@router.post('/watchlist/{symbol}')
async def watch(symbol: str):
    if await db.sismember('watchlist', symbol):
        return {"status": "Already in watchlist"}
    else:
        await db.sadd('watchlist', symbol)
        return {"status": "Added to watchlist"}


@router.delete('/watchlist/{symbol}')
async def unwatch(symbol: str):
    if await db.sismember('watchlist', symbol):
        await db.srem('watchlist', symbol)
        return {"status": "Removed from watchlist"}
    else:
        return {"status": "Not in watchlist"}


@router.get('/watchlist')
async def watchlist():
    members: List[str] = await db.smembers('watchlist')

    findQuery = Stock.find((
        Stock.symbol << [m.decode('utf-8').upper() for m in members]
    ))

    findQuery.limit = 9000
    return await findQuery.sort_by('symbol').all()


@router.get('/search/{query}')
async def search(query: str):
    if not query:
        return []

    findQuery = Stock.find((
        Stock.symbol % f'{query}*'
    ))

    findQuery.limit = 9000
    return await findQuery.sort_by('symbol').all()


@router.get('/bars/{symbol}')
async def bars(symbol: str):
    now = datetime.datetime.now(datetime.timezone.utc)
    end = now - relativedelta(minutes=1)
    start = now - relativedelta(minutes=30)

    try:
        return db_sync.ts().range(f'stocks:{symbol.upper()}:bars:close', str(int(
            start.timestamp() * 1000)), str(int(end.timestamp() * 1000)))
    except:
        return []


@router.get('/trade/{symbol}')
async def trade(symbol: str):
    try:
        return db_sync.ts().get(f'stocks:{symbol.upper()}:trades:price')
    except:
        return [0, 0]


@router.get('/trending')
def trending():
    try:
        return db_sync.topk().list('trending-stocks')
    except redis.exceptions.ResponseError as e:
        return []


@router.websocket_route('/trending')
async def trending_stocks_ws(websocket: WebSocket):
    await websocket.accept()
    pubsub = db.pubsub()
    await pubsub.subscribe('trending-stocks')

    async for ev in pubsub.listen():
        if ev['type'] == 'subscribe':
            continue

        trending: List[str] = db_sync.topk().list('trending-stocks', withcount=True)
        await websocket.send_json(trending)


@router.websocket_route('/trade')
async def trades_ws(websocket: WebSocket):
    await websocket.accept()
    pubsub = db.pubsub()
    await pubsub.subscribe('trade')

    async for ev in pubsub.listen():
        if ev['type'] == 'subscribe':
            continue

        symbol = ev['data'].decode('utf-8').upper()
        trade = db_sync.ts().get(f'stocks:{symbol.upper()}:trades:price')
        await websocket.send_json({
            'symbol': symbol,
            'trade': trade
        })


@router.websocket_route('/bars')
async def bars_ws(websocket: WebSocket):
    await websocket.accept()
    pubsub = db.pubsub()
    await pubsub.subscribe('bar')

    async for ev in pubsub.listen():
        if ev['type'] == 'subscribe':
            continue

        await websocket.send_text(ev['data'].decode('utf-8'))
