# Redis stock watchlist

This project is a real-time stock watchlist built with Redis, FastAPI, and Next.js.

It uses Redis for:

- JSON-backed stock documents
- Redis Query Engine search over stock symbols and metadata
- sets for the watchlist
- time series for trades and price bars
- Top-K for trending symbols
- pub/sub for WebSocket fanout

## Run with Docker

Copy the environment example if you want to override defaults:

```bash
cp .env.example .env
```

Then start the full app:

```bash
./scripts/docker-up.sh
```

The default runtime is replay mode, so Alpaca credentials are not required.

- UI: `http://localhost:3000`
- API: `http://localhost:8000/api/1.0`
- Redis: `redis://localhost:6379`

## Run locally

Start Redis:

```bash
docker compose up -d redis
```

Then run the local dev workflow:

```bash
./scripts/dev.sh
```

## Scripts

- `make format`
- `make test`
- `make build`
- `make dev`
- `make docker-up`
- `make docker-down`

## Live mode

Replay mode is the default. To switch the stream service to live Alpaca data, set:

```bash
MARKET_DATA_MODE=live
APCA_API_KEY_ID=...
APCA_API_SECRET_KEY=...
```

## Tests

The backend and replay tests expect Redis to be available locally. `./scripts/test.sh` starts Redis first, then runs:

- FastAPI route and store tests
- replay-mode stream tests
- frontend Vitest tests
