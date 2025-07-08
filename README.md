# ♟️ Checkers-AI-Web

🔗 **Live Demo:** [real-vs-ai-face-classifier.onrender.com](https://real-vs-ai-face-classifier.onrender.com)  
🕒 **Note:** This app is hosted on Render’s free tier.  
It may take 2-3 minutes to wake up on first visit due to cold start for backend.

Play American checkers against a **minimax AI** or another human in real-time, directly in your browser.  
The entire stack (FastAPI + React + WebSockets) is containerised and auto-deployed via GitHub Actions → Render.

---

## ✨ Features
| Area              | Details |
| ----------------- | ------- |
| **Game play**     | • Human vs AI (three depths) &nbsp;• Human vs Human (room-based WebSocket) &nbsp;• Undo (AI only) &nbsp;• Light/Dark theme |
| **AI engine**     | Classic **minimax + α-β pruning** written from scratch in Python |
| **Tech stack**    | FastAPI · Uvicorn · React (Vite) · WebSockets · Docker · GitHub Actions CI |
| **Infra-as-Code** | `docker-compose.yml`, backend/frontend `Dockerfile`s, & CI workflow |
| **Prod hosting**  | Two Render services (Docker) – **backend** on port 8000, **frontend** served via Nginx (static) |

---

## 🏗️ Project structure

```

.
├── app/                    # FastAPI backend (Python)
│   ├── main.py
│   ├── ws_manager.py
│   └── minimax/            # Board + AI logic
├── frontend/               # React client (Vite)
│   ├── src/
│   └── Dockerfile
├── requirements.txt        # backend deps
├── docker-compose.yml      # local dev stack
└── ci.yml                  # GitHub Actions – lint, test, build

````

---

## 🚀 Quick start

### 1 · Clone & run locally

```bash
git clone https://github.com/logvisionn/checkers-ai-web.git
cd checkers-ai-web

# Build + launch both containers
docker-compose up --build
# →  frontend on http://localhost:3000
# →  backend  on http://localhost:8000  (docs at /docs)
````

### 2 · Dev without Docker (optional)

```bash
# backend
pip install -r ../requirements.txt
uvicorn app.main:app --reload

# frontend (separate terminal)
cd ../frontend
npm install
npm run dev            # http://localhost:5173
```

---

## 🛠️ Continuous Integration

* **ruff** – Python lint
* **pytest** – backend unit test (`app/tests/`)
* **ESLint** + **Prettier** – React lint/format
* Running on every `push` to `main`; see **Actions** tab for badges.

---

## 🧭 Next steps

In future iterations, I plan to add:

1. **Reinforcement-Learning / Self-Play**  
   Replace the current minimax engine with a modern self-play RL agent (e.g. AlphaZero-style MCTS guided by a neural policy/value network). This will demonstrate end-to-end deep RL skills and produce more human-like, creative gameplay.


2. **Cloud-based HPO Pipeline**  
   Integrate an HPO framework (e.g. Optuna + Ray Tune) to automate tuning of network architectures and hyperparameters, with experiment tracking via Weights & Biases or similar. This showcases scalable, production-ready ML tooling.


---

## © License

MIT — free for personal and commercial use with attribution.



