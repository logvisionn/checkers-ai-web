import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.minimax.board import Board, Piece
from app.minimax.logic import compute_best_move

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Checkers AI API",
    description="Play checkers vs. AI or via WebSockets",
    version="1.0.0",
)

# allow all origins in dev; lock down in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# your existing endpoints below…
@app.post("/moves")
async def all_moves(payload: dict):
    # …
    logging.info(f"Received /moves: depth={payload['depth']}")
    # …

@app.post("/move")
async def best_move(payload: dict):
    # …
    logging.info(f"Received /move: depth={payload['depth']}")
    # …
