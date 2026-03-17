# Production Readiness for Railway Single-Service Deploy (Backend serves Frontend)

## Current Progress: Step 9/12

## Steps:
1. [x] Create root .gitignore
2. [x] Create nudgeme-server/Procfile, runtime.txt, .env.example
3. [x] Update nudgeme-server/requirements.txt (add gunicorn)
4. [x] Update nudgeme/vite.config.js (base='/', outDir='../nudgeme-server/static/build')
5. [x] Update nudgeme/src/utils/constants.js (SERVER='/api')
6. [x] Update nudgeme-server/app.py (CORS prod, logging, StaticFiles('/static'), API prefix?)
7. [x] Replace print() in nudgeme-server/controllers/api.py with logging
8. [x] Replace print() in nudgeme-server/services/scheduler_service.py with logging
9. [x] Create root/railway.json
10. [x] Update README.md (deploy guide)
11. [ ] Test local: Build FE & run `cd nudgeme-server && python app.py`
12. [ ] Deploy to Railway: `railway up`
