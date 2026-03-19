#!/usr/bin/env zsh
set -euo pipefail

python3.13 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements-dev.txt -r api/requirements.txt -r stream/requirements.txt -r data/requirements.txt

docker compose up -d redis

trap 'kill 0' EXIT

(cd data && python main.py)
(cd api && uvicorn main:app --reload --host 0.0.0.0 --port 8000) &
(cd stream && python main.py) &
(cd ui && npm install && npm run dev) &

wait
