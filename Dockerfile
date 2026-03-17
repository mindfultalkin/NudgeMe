# ── Base image with both Node and Python ──
FROM nikolaik/python-nodejs:python3.12-nodejs20

WORKDIR /app

# Copy everything
COPY . .

# ── Build React frontend ──
WORKDIR /app/nudgeme
RUN npm ci
RUN npm run build
RUN cp -r dist ../nudgeme-server/static

# ── Install Python dependencies ──
WORKDIR /app/nudgeme-server
RUN pip install -r requirements.txt --no-cache-dir

# ── Start server ──
EXPOSE $PORT
CMD gunicorn -w 4 --bind=0.0.0.0:$PORT -k uvicorn.workers.UvicornWorker app:app