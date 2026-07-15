# StoryBuddy Studio

A child-friendly storybook co-creation app for children aged 8–12.
The AI acts as a warm creative teammate — sitting alongside the child and helping them build original stories chapter by chapter.

No external API key needed. Story generation runs through Kiro's native model environment.

---

## What's inside

```
storybuddy-studio/
├── data/                  # Live story files (written by Kiro agent)
│   ├── story_state.json   # Canvas state — title, characters, settings, spark input
│   ├── story_book.md      # The living story document
│   └── tasks.json         # Checklist + Buddy's tip
├── backend/
│   ├── main.py            # FastAPI server (port 3001)
│   └── requirements.txt   # Backend-only deps
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # Root layout (split screen)
│   │   ├── components/
│   │   │   ├── AdventureCanvas.jsx        # Left panel
│   │   │   ├── CharacterCard.jsx          # Character + modifier badge
│   │   │   ├── SparkBox.jsx               # Debounced idea input
│   │   │   ├── LivingBook.jsx             # Rendered story HTML
│   │   │   ├── TaskChecklist.jsx          # Progress checklist
│   │   │   └── BuddyAdvice.jsx            # AI tip callout
│   │   └── hooks/
│   │       └── useStorySync.js            # Polls GET /api/get-story every 2s
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── watcher.py             # File-change detector — delegates to Kiro native agent
├── requirements.txt       # Python deps (no anthropic SDK required)
└── README.md
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- Kiro IDE running (provides the native AI model — Qwen3 Coder / DeepSeek)

---

## 1 — Install Python dependencies

```bash
cd storybuddy-studio
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

---

## 2 — Install frontend dependencies

```bash
cd frontend
npm install
```

---

## 3 — Run everything

Open **three terminals** from `storybuddy-studio/`:

### Terminal 1 — Backend (FastAPI)
```bash
uvicorn backend.main:app --reload --port 3001
```

### Terminal 2 — File watcher
```bash
python watcher.py
```

### Terminal 3 — Frontend (Vite)
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## How it works

1. The child types an idea in the **Spark Box** on the left panel.
2. After 900 ms of no typing, the state is POSTed to `data/story_state.json` via the backend.
3. `watcher.py` detects the file change (900 ms debounce) and delegates to Kiro's native agent via the `on-canvas-change` hook.
4. Kiro reads `story_state.json`, applies the full StoryBuddy persona rules, and writes `data/story_book.md` and `data/tasks.json`.
5. The right panel polls `GET /api/get-story` every 2 seconds and renders the new chapter live.

---

## AI generation — no API key needed

Story generation is handled entirely by Kiro's built-in model (Qwen3 Coder / DeepSeek).
The `.kiro/hooks/on-canvas-change.json` hook fires whenever `story_state.json` is saved
and passes the full StoryBuddy persona prompt to the native model.

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/save-state` | Write story_state.json |
| `GET` | `/api/get-story` | Returns `{ html, tasks, advice }` |
| `GET` | `/api/export` | Download story_book.md |
| `GET` | `/health` | Health check |

---

## Character modifiers

Characters can carry a `modifier` field. The AI **always** honours these — no exceptions.

| Modifier | Effect |
|----------|--------|
| `speaks in rhymes` | Every dialogue line rhymes |
| `only speaks backwards` | Every word is reversed |
| `never lies` | Character cannot deceive |

---

## Story structure

Every chapter follows the five-beat structure:

**Hook → Goal → Obstacle → Attempt → Outcome**

Each chapter ends with an `> Illustration idea:` blockquote and a `### Buddy's tip:` section.
