import math
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Tuple

from .minimax.board import Board, Piece
from .minimax.logic import minimax
from .ws_manager import ConnectionManager

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ─── Pydantic models ─────────────────────────────────────────
class MoveRequest(BaseModel):
    board: List[List[int]]
    player: int
    depth: int = Field(4, ge=1, le=10)

class MoveResponse(BaseModel):
    move: List[Tuple[int, int]]
    score: float

class MovesResponse(BaseModel):
    moves: List[List[Tuple[int, int]]]

# ─── FastAPI app setup ───────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── AI move endpoint ────────────────────────────────────────
@app.post("/move", response_model=MoveResponse)
def get_ai_move(req: MoveRequest):
    board = Board()
    for r in range(8):
        for c in range(8):
            board.state[r][c] = Piece(req.board[r][c])

    legal = board.get_valid_moves(req.player)
    logger.debug("AI sees %d legal moves", len(legal))

    if not legal:
        return MoveResponse(move=[], score=-1e6)

    score, move = minimax(
        board,
        depth=req.depth,
        maximizing=(req.player == 1),
        alpha=-math.inf,
        beta= math.inf,
    )
    if not math.isfinite(score):
        score = -1e6 if score < 0 else 1e6

    logger.debug("AI chooses move: %s with score %s", move, score)
    return MoveResponse(move=move or [], score=score)

# ─── All-moves endpoint ──────────────────────────────────────
@app.post("/moves", response_model=MovesResponse)
def get_valid_moves(req: MoveRequest):
    board = Board()
    for r in range(8):
        for c in range(8):
            board.state[r][c] = Piece(req.board[r][c])
    moves = board.get_valid_moves(req.player)
    return MovesResponse(moves=moves)

# ─── WebSocket multiplayer ───────────────────────────────────
manager = ConnectionManager()

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(ws: WebSocket, room_id: str):
    await manager.connect(room_id, ws)
    try:
        while True:
            data = await ws.receive_json()
            await manager.broadcast(room_id, data, sender=ws)  # <-- here
    except WebSocketDisconnect:
        manager.disconnect(room_id, ws)

# ─── HEALTH CHECK ────────────────────────────────────────
@app.get("/health")
async def health_check():
    """
    Simple no-op endpoint to let clients (or cron jobs)
    wake the service up without doing any real work.
    """
    return {"ok": True}