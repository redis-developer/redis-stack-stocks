#!/usr/bin/env zsh
set -euo pipefail

python3.13 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements-dev.txt -r api/requirements.txt -r stream/requirements.txt -r data/requirements.txt
python -m ruff format api data stream

cd ui
npm install
npm run format
