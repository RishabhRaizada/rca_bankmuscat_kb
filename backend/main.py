import logging
import multiprocessing
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="RCA Bank Muscat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_MAX_WORKERS = min(15, multiprocessing.cpu_count() * 2)
app.state.executor = ThreadPoolExecutor(max_workers=_MAX_WORKERS)

app.include_router(router)
