/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import Square from "./components/Square";
import Piece from "./components/Piece";
import { initialBoard } from "./utils/gameConstants";
import { applyMove } from "./utils/applyMove";
import { useWebSocketState } from "./hooks/useWebSocket";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default function App() {
  // ─── BACKEND HEALTH PING ───────────────────────────────
  const [backendReady, setBackendReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/health`);
        if (res.ok) {
          if (!cancelled) setBackendReady(true);
        } else {
          throw new Error("not ready");
        }
      } catch {
        if (!cancelled) setTimeout(ping, 3000);
      }
    };
    ping();
    return () => { cancelled = true; };
  }, []);

  // ─── THEME & TITLE ───────────────────────────────────
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
    document.title = "Checkers Online";
  }, [theme]);

  // ─── CORE GAME STATE ──────────────────────────────────
  const [board, setBoard] = useState(initialBoard);
  const [player, setPlayer] = useState(1);
  const [turn, setTurn] = useState("human");
  const [depth, setDepth] = useState(4);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [selected, setSelected] = useState(null);
  const [possibleDestinations, setPD] = useState([]);
  const [lastMove, setLastMove] = useState([]);
  const [history, setHistory] = useState([]);

  // ─── MULTIPLAYER / AI & WS ──────────────────────────
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [socketUrl, setSocketUrl] = useState(null);
  const { readyState, lastMessage, sendMessage } = useWebSocketState(socketUrl);
  const [currentMove, setCurrentMove] = useState(null);

  // ─── TRACK START & JOINS ────────────────────────────
  const [joinCount, setJoinCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // ─── WIZARD MODAL ───────────────────────────────────
  const [showModal, setShowModal] = useState(true);
  const [modalStep, setModalStep] = useState(1);
  const [userSide, setUserSide] = useState(null);

  // ─── RESET WIZARD MODAL ─────────────────────────────
  useEffect(() => {
    if (showModal) {
      setModalStep(1);
      setGameMode(null);
      setUserSide(null);
      setRoomId("");
      setSocketUrl(null);
      setConnecting(false);
      setJoinCount(0);
      setGameStarted(false);
    }
  }, [showModal]);

  // ─── AUTO-ADVANCE to side-select once WS is open ─────
  useEffect(() => {
    if (
      gameMode === "multiplayer" &&
      socketUrl &&
      readyState === WebSocket.OPEN
    ) {
      setModalStep(2);
    }
  }, [readyState, gameMode, socketUrl]);

  // ─── HANDLE incoming WS messages ─────────────────────
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "joined") {
      setJoinCount(lastMessage.count);
    }
    if (
      lastMessage.type === "start" &&
      !gameStarted &&
      gameMode === "multiplayer"
    ) {
      const theirSide = lastMessage.side;
      const mySide = theirSide === "white" ? "black" : "white";
      setUserSide(mySide);
      doStartGame(mySide, false);
    }
    if (lastMessage.type === "move" && gameMode === "multiplayer") {
      const m = lastMessage.move;
      setBoard((prev) => {
        let cur = prev;
        for (let i = 1; i < m.length; i++) {
          cur = applyMove(cur, m[i - 1], m[i]);
        }
        return cur;
      });
      setLastMove([m[m.length - 2], m[m.length - 1]]);
      setTurn((p) => (p === "human" ? "opponent" : "human"));
    }
  }, [lastMessage, gameMode, gameStarted]);

  // ─── JOIN / CREATE room ─────────────────────────────
  const joinRoom = () => {
    if (!roomId.trim()) return;
    setConnecting(true);
    setGameMode("multiplayer");
    setSocketUrl(`${import.meta.env.VITE_WS_URL}/ws/${roomId}`);
  };

  // ─── START GAME (AI or Multiplayer) ─────────────────
  const doStartGame = (side, broadcast = true) => {
    const pl = side === "white" ? 1 : -1;
    setPlayer(pl);
    setBoard(initialBoard);
    setLastMove([]);
    setGameOver(null);
    setHistory([]);
    setLoading(false);
    setTurn(
      gameMode === "ai"
        ? pl === 1
          ? "human"
          : "ai"
        : pl === 1
        ? "human"
        : "opponent"
    );
    setShowModal(false);
    setGameStarted(true);
    if (broadcast) sendMessage({ type: "start", side });
  };
  const startGame = () => {
    if (!userSide) return;
    let side = userSide;
    if (side === "random") {
      side = Math.random() < 0.5 ? "white" : "black";
    }
    doStartGame(side, true);
  };

  // ─── UNDO ───────────────────────────────────────────
  const snapshot = () =>
    setHistory((h) => [
      ...h,
      { board: JSON.parse(JSON.stringify(board)), turn, gameOver, lastMove },
    ]);
  const undo = () =>
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h.pop();
      setBoard(prev.board);
      setTurn(prev.turn);
      setGameOver(prev.gameOver);
      setLastMove(prev.lastMove);
      return [...h];
    });

  // ─── FETCH LEGAL MOVES WHEN IT’S YOUR TURN ───────────
  useEffect(() => {
    if (turn !== "human") return;
    fetch(`${import.meta.env.VITE_API_URL}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board, player, depth }),
    })
      .then((r) => r.json())
      .then(({ moves }) => {
        setValidMoves(moves);
        if (!moves.length) setGameOver("lose");
        setSelected(null);
        setPD([]);
      })
      .catch(() => {
        setValidMoves([]);
      });
  }, [turn, board, player, depth, gameMode]);

  // ─── GAME OVER CHECK ──────────────────────────────────
  const checkGameOverAfter = async (bd, pl) => {
    const { moves } = await fetch(
      `${import.meta.env.VITE_API_URL}/moves`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: bd, player: pl, depth }),
      }
    ).then((r) => r.json());
    if (!moves.length) {
      setGameOver(pl === 1 ? "lose" : "win");
      return true;
    }
    return false;
  };

  // ─── CLICK HANDLER ───────────────────────────────────
  const onSquareClick = async (r, c) => {
    if (turn !== "human" || loading || gameOver) return;

    if (!selected) {
      // pick up
      const picks = validMoves.filter(
        (m) => m[0][0] === r && m[0][1] === c
      );
      if (!picks.length) return;
      setCurrentMove(null);
      const jumps = picks.filter((m) => Math.abs(m[1][0] - m[0][0]) === 2);
      setSelected([r, c]);
      setPD((jumps.length ? jumps : picks).map((m) => m[1]));
      return;
    }

    // drop
    const seg = validMoves.find(
      (m) =>
        m[0][0] === selected[0] &&
        m[0][1] === selected[1] &&
        m[1][0] === r &&
        m[1][1] === c
    );
    if (!seg) {
      setSelected(null);
      setPD([]);
      setCurrentMove(null);
      return;
    }

    // accumulate and apply
    const newPath = currentMove ? [...currentMove, seg[1]] : [seg[0], seg[1]];
    setCurrentMove(newPath);
    snapshot();
    const newBoard = applyMove(board, seg[0], seg[1]);
    setBoard(newBoard);
    setLastMove([seg[0], seg[1]]);

    // chain captures?
    if (Math.abs(seg[1][0] - seg[0][0]) === 2) {
      const cont = await fetch(`${import.meta.env.VITE_API_URL}/moves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: newBoard, player, depth }),
      })
        .then((r) => r.json())
        .then((j) => j.moves)
        .catch(() => []);
      const land = seg[1];
      const more = cont.filter(
        (m) =>
          m[0][0] === land[0] &&
          m[0][1] === land[1] &&
          Math.abs(m[1][0] - m[0][0]) === 2
      );
      if (more.length) {
        setValidMoves(cont);
        setSelected(land);
        setPD(more.map((m) => m[1]));
        return;
      }
    }

    // done
    setSelected(null);
    setPD([]);

    if (gameMode === "multiplayer") {
      sendMessage({ type: "move", move: newPath });
      setTurn((p) => (p === "human" ? "opponent" : "human"));
      setCurrentMove(null);
    } else {
      setTurn("ai");
      setLoading(true);
      const over = await checkGameOverAfter(newBoard, -player);
      if (over) setLoading(false);
    }
  };

  // ─── AI AUTO-PLAY ────────────────────────────────────
  useEffect(() => {
    if (turn !== "ai") return;
    (async () => {
      setLoading(true);
      await sleep(800);
      const { moves: aiMoves } = await fetch(
        `${import.meta.env.VITE_API_URL}/moves`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ board, player: -player, depth }),
        }
      ).then((r) => r.json());
      if (!aiMoves.length) {
        setGameOver("win");
        setLoading(false);
        return;
      }
      const { move: aiMove = [] } = await fetch(
        `${import.meta.env.VITE_API_URL}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ board, player: -player, depth }),
        }
      )
        .then((r) => r.json())
        .catch(() => ({}));
      if (!aiMove.length) {
        setGameOver("win");
        setLoading(false);
        return;
      }
      let cur = board;
      for (let i = 1; i < aiMove.length; i++) {
        cur = applyMove(cur, aiMove[i - 1], aiMove[i]);
        setBoard(cur);
        setLastMove([aiMove[i - 1], aiMove[i]]);
        await sleep(300);
      }
      setLoading(false);
      setTurn("human");
      await checkGameOverAfter(cur, player);
    })();
  }, [turn]);

  const isWaiting =
    gameMode === "multiplayer" &&
    gameStarted &&
    joinCount < 2 &&
    readyState === WebSocket.OPEN;

  // ─── RENDER ─────────────────────────────────────────
  // 1) while we’re pinging backend, show full-screen “please wait”
  if (!backendReady) {
    return (
      <div className="wait-screen">
        <div className="wait-modal">
          <h2>Waking up server…</h2>
          <p>This can take 10–20 s on first visit. Thanks for your patience!</p>
        </div>
      </div>
    );
  }
  
  // 2) once ready, show the normal wizard or board
  return (
    <div className={`app-container ${theme}`}>
      {showModal ? (
        /* ─── WIZARD ───────────────────────────────────── */
        <div className="modal-overlay">
          <div className="modal-content wizard">
            <h2 className="modal-title">
              {modalStep===1 ? "Choose Mode" : "Choose Side"}
            </h2>
            <div className="modal-body">
              {modalStep===1 ? (
                <>
                  <label className="wizard-option">
                    <input type="radio" name="mode" value="ai"
                      checked={gameMode==="ai"}
                      onChange={()=>setGameMode("ai")}
                    /> Single-player (AI)
                  </label>
                  <label className="wizard-option">
                    <input type="radio" name="mode" value="multiplayer"
                      checked={gameMode==="multiplayer"}
                      onChange={()=>setGameMode("multiplayer")}
                    /> Multiplayer
                  </label>
                  {gameMode==="multiplayer" && (
                    <div className="multiplayer-setup">
                      <input
                        className="input-room"
                        placeholder="Room ID"
                        value={roomId}
                        onChange={e=>setRoomId(e.target.value)}
                      />
                      <button
                        className="btn"
                        onClick={joinRoom}
                        disabled={!roomId.trim() || !!socketUrl}
                      >
                        {connecting ? "Connecting…" : "Join / Create"}
                      </button>
                      <p className="status">
                        {connecting
                          ? "🔄 Connecting…"
                          : socketUrl
                            ? (readyState===WebSocket.OPEN
                                ? "🟢 Connected"
                                : "🔴 Disconnected")
                            : ""
                        }
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label className="wizard-option">
                    <input type="radio" name="side" value="white"
                      checked={userSide==="white"}
                      onChange={e=>setUserSide(e.target.value)}
                    /> White
                  </label>
                  <label className="wizard-option">
                    <input type="radio" name="side" value="black"
                      checked={userSide==="black"}
                      onChange={e=>setUserSide(e.target.value)}
                    /> Black
                  </label>
                  <label className="wizard-option">
                    <input type="radio" name="side" value="random"
                      checked={userSide==="random"}
                      onChange={e=>setUserSide(e.target.value)}
                    /> Random
                  </label>
                </>
              )}
            </div>
            <div className="modal-footer wizard-footer">
              {modalStep===2 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setModalStep(1);
                    setRoomId("");
                    setSocketUrl(null);
                    setConnecting(false);
                    setJoinCount(0);
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                className="btn"
                onClick={()=>{ 
                  if(modalStep===1) setModalStep(2);
                  else startGame(); 
                }}
                disabled={
                  modalStep===1
                    ? (gameMode==="multiplayer"
                        ? !roomId.trim()||!connecting
                        : !gameMode)
                    : !userSide
                }
              >
                {modalStep===1 ? "Next →" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── PLAY AREA ─────────────────────────────────── */
        <>
          <header>
            <div className="controls">
              <button
                className="btn toggle-btn"
                onClick={()=>setTheme(theme==="dark"?"light":"dark")}
              >
                {theme==="dark"?"🌞 Light":"🌙 Dark"}
              </button>
              <button
                className="btn"
                onClick={undo}
                disabled={gameMode==="multiplayer" || !history.length}
              >
                Undo
              </button>
              <label className={`btn btn-select ${gameMode==="multiplayer"?"disabled":""}`}>
                Difficulty:
                <select
                  value={depth}
                  onChange={e=>setDepth(+e.target.value)}
                  disabled={gameMode==="multiplayer"}
                >
                  <option value={2}>Easy</option>
                  <option value={4}>Normal</option>
                  <option value={6}>Hard</option>
                </select>
              </label>
              <button
                className="btn"
                onClick={()=>{
                  setShowModal(true);
                  setModalStep(1);
                  setGameMode(null);
                  setRoomId("");
                  setSocketUrl(null);
                  setConnecting(false);
                  setJoinCount(0);
                  setGameStarted(false);
                }}
              >
                {gameMode==="ai" ? "Restart" : "New Room"}
              </button>
            </div>
            {gameMode==="multiplayer" && readyState===WebSocket.OPEN && (
              <div className="room-indicator">
                Room: <strong>{roomId}</strong>
              </div>
            )}
          </header>

          <div className="banner">
            {isWaiting
              ? "⏳ Waiting for opponent to join..."
              : gameOver
                ? (gameOver==="win" ? "You win!" : gameOver==="lose" ? "You lose!" : "Draw!")
                : loading
                  ? (turn==="ai"?"AI thinking…":"Opponent thinking…")
                  : (turn==="human"?"Your turn":"Opponent's turn")
            }
          </div>

          <div className="board-wrapper">
            <div className="board-grid">
              {board.map((row,r) =>
                row.map((cell,c) => {
                  const isSel = selected?.[0]===r && selected?.[1]===c;
                  const isPos = possibleDestinations.some(([pr,pc])=>pr===r&&pc===c);
                  return (
                    <Square
                      key={`${r}-${c}`}
                      row={r} col={c}
                      highlighted={isSel}
                      lastMove={lastMove}
                      possible={isPos}
                      onClick={()=>turn==="human" && onSquareClick(r,c)}
                    >
                      <Piece value={cell}/>
                    </Square>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
