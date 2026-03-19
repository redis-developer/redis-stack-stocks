#!/usr/bin/env zsh
set -euo pipefail

python3 -m compileall api data stream
(cd ui && npm install && npm run build)
docker compose build
