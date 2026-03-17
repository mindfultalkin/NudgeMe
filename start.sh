#!/bin/bash
set -e

# Production start: Gunicorn serving FastAPI app (with built frontend static)
cd nudgeme-server
exec gunicorn -w $((2 * $(nproc) + 1)) --bind=0.0.0.0:${PORT} -k uvicorn.workers.UvicornWorker app:app
