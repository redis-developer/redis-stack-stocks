#!/usr/bin/env zsh
set -euo pipefail

python3.13 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements-dev.txt -r api/requirements.txt -r stream/requirements.txt -r data/requirements.txt

docker compose up -d redis

(cd api && pytest tests)
(cd stream && pytest tests)
(cd ui && npm install && npm run test)
