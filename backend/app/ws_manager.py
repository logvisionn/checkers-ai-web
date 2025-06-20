from fastapi import WebSocket
from typing import Dict, List, Any


class ConnectionManager:
    """
    Keeps a list of sockets per room **and** the last `"start"` message so
    late-joining players immediately get the side assignment.
    """

    def __init__(self):
        # room_id ➔ {"sockets": [WebSocket,…], "start": dict|None}
        self.rooms: Dict[str, Dict[str, Any]] = {}

    # ──────────────────────────────────────────────────────
    async def connect(self, room_id: str, ws: WebSocket):
        await ws.accept()

        room = self.rooms.setdefault(room_id, {"sockets": [], "start": None})
        room["sockets"].append(ws)

        # notify everyone of new player count
        await self.broadcast(room_id, {"type": "joined", "count": len(room["sockets"])})

        # if a game has already started, replay the cached “start” msg
        if room["start"]:
            await ws.send_json(room["start"])

    # ──────────────────────────────────────────────────────
    def disconnect(self, room_id: str, ws: WebSocket):
        room = self.rooms.get(room_id)
        if not room:
            return
        if ws in room["sockets"]:
            room["sockets"].remove(ws)

        # if nobody left, drop the room state entirely
        if not room["sockets"]:
            self.rooms.pop(room_id, None)

    # ──────────────────────────────────────────────────────
    async def broadcast(self, room_id: str, message: dict, sender: WebSocket | None = None):
        """Send message to every socket in the room, except `sender`."""
        room = self.rooms.setdefault(room_id, {"sockets": [], "start": None})

        if message.get("type") == "start":
            room["start"] = message        # remember last 'start'

        for ws in list(room["sockets"]):
            if ws is sender:               # <<< skip origin
                continue
            await ws.send_json(message)

            