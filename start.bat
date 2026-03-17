@echo off
cd nudgeme-server
gunicorn -w %NUMBER_OF_PROCESSORS%*2+1 --bind=0.0.0.0:%PORT% -k uvicorn.workers.UvicornWorker app:app
