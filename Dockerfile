FROM nikolaik/python-nodejs:python3.12-nodejs20

WORKDIR /app

COPY . .

RUN cd /app/nudgeme && \
    npm ci && \
    npm run build && \
    cd /app/nudgeme-server && \
    pip install -r requirements.txt --no-cache-dir

WORKDIR /app/nudgeme-server

EXPOSE 8080

CMD gunicorn -w 4 --bind=0.0.0.0:$PORT -k uvicorn.workers.UvicornWorker app:app     