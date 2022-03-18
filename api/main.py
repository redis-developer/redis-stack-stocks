import os
from aredis_om.model import Migrator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

app.include_router(router)

procs = []

@app.on_event("startup")
async def startup():
    print("Starting API")
    await Migrator().run()