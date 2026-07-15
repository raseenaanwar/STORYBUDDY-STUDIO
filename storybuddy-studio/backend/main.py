"""
StoryBuddy Studio — FastAPI backend
Serves story state, story content, and handles file exports.
"""

import json
import os
from pathlib import Path

import aiofiles
import markdown
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

STORY_STATE_PATH = DATA_DIR / "story_state.json"
STORY_BOOK_PATH = DATA_DIR / "story_book.md"
TASKS_PATH = DATA_DIR / "tasks.json"

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="StoryBuddy Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Character(BaseModel):
    id: str
    name: str
    description: str
    modifier: str = ""


class Setting(BaseModel):
    id: str
    name: str
    description: str


class StoryState(BaseModel):
    title: str
    characters: list[Character]
    settings: list[Setting]
    raw_input: str
    completed_tasks: list[str]
    chapter_count: int
    last_updated: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/get-state")
async def get_state():
    """Return the current story_state.json so the frontend can hydrate on load."""
    if not STORY_STATE_PATH.exists():
        raise HTTPException(status_code=404, detail="story_state.json not found")
    async with aiofiles.open(STORY_STATE_PATH, "r", encoding="utf-8") as f:
        raw = await f.read()
    return JSONResponse(json.loads(raw))


@app.post("/api/save-state")
async def save_state(state: StoryState):
    """Write the full story state to data/story_state.json."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = state.model_dump()

    from datetime import datetime, timezone
    payload["last_updated"] = datetime.now(timezone.utc).isoformat()

    async with aiofiles.open(STORY_STATE_PATH, "w", encoding="utf-8") as f:
        await f.write(json.dumps(payload, indent=2))

    return {"ok": True, "last_updated": payload["last_updated"]}


@app.post("/api/generate")
async def generate_story():
    """
    Build the full StoryBuddy prompt from current story_state.json
    and write it to data/generate_prompt.md so the Kiro hook can
    pick it up and run generation with the native model.
    Returns the prompt so the frontend can display a status.
    """
    if not STORY_STATE_PATH.exists():
        raise HTTPException(status_code=404, detail="story_state.json not found")

    async with aiofiles.open(STORY_STATE_PATH, "r", encoding="utf-8") as f:
        raw = await f.read()
    state = json.loads(raw)

    title       = state.get("title", "My Adventure")
    raw_input   = state.get("raw_input", "")
    chapter_num = state.get("chapter_count", 0) + 1
    completed   = state.get("completed_tasks", [])

    if not raw_input.strip():
        raise HTTPException(status_code=400, detail="raw_input is empty")

    # Build character block
    char_lines = []
    for c in state.get("characters", []):
        line = f"- {c['name']}: {c['description']}"
        if c.get("modifier"):
            line += f"  ⚠ MODIFIER (NEVER BREAK): {c['modifier']}"
        char_lines.append(line)
    chars_block = "\n".join(char_lines) or "- No characters defined yet"

    # Build settings block
    setting_lines = [
        f"- {s['name']}: {s['description']}"
        for s in state.get("settings", [])
    ]
    settings_block = "\n".join(setting_lines) or "- No settings defined yet"

    # Read existing story for context
    existing_story = ""
    if STORY_BOOK_PATH.exists():
        async with aiofiles.open(STORY_BOOK_PATH, "r", encoding="utf-8") as f:
            existing_story = await f.read()
        # Don't include welcome placeholder
        if "Welcome to StoryBuddy Studio" in existing_story:
            existing_story = ""
        elif len(existing_story) > 2000:
            existing_story = "...[earlier chapters]...\n\n" + existing_story[-2000:]

    prompt = f"""You are StoryBuddy, a warm and enthusiastic co-author writing alongside children aged 8-12.
You are a teammate sitting next to the child — never a chatbot.

HOW YOU WRITE:
- Vivid, sensory language with short punchy sentences
- Every paragraph makes the child want to read the next one
- No words a 10-year-old would need to look up

THE GOLDEN RULE: The child's raw_input is sacred. Expand it, never replace it.

CHARACTER MODIFIER ENFORCEMENT — CRITICAL. Zero exceptions:
  "speaks in rhymes"      → every dialogue line for that character must rhyme, always
  "only speaks backwards" → reverse every word they say
  "never lies"            → that character cannot deceive, ever

STORY STRUCTURE: every chapter follows Hook → Goal → Obstacle → Attempt → Outcome

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STORY: {title}
WRITING: Chapter {chapter_num}
COMPLETED TASKS: {', '.join(completed) if completed else 'none yet'}

CHARACTERS:
{chars_block}

SETTINGS:
{settings_block}

CHILD'S RAW INPUT (expand it — never replace it):
{raw_input}

EXISTING STORY SO FAR:
{existing_story if existing_story else "(no chapters yet — this is chapter 1)"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write Chapter {chapter_num} now. Then write the updated tasks.

Output EXACTLY this structure — no preamble, no commentary:

--- STORY_BOOK_MD ---
# {title}

## Chapter {chapter_num}: [Exciting chapter title]

[3-5 paragraphs of vivid narrative prose]

> Illustration idea: [one sentence describing the key visual moment]

---

### Buddy's tip:
[One specific exciting thing the child can do next]

--- TASKS_JSON ---
{{
  "tasks": [
    {{"id": "1", "label": "task description", "done": true}},
    {{"id": "2", "label": "task description", "done": false}}
  ],
  "advice": "one encouraging tip for the child"
}}
"""

    # Write prompt to a file — the PostFileSave hook fires when THIS file
    # is written by the Kiro agent tool, triggering story generation.
    prompt_path = DATA_DIR / "generate_prompt.md"
    async with aiofiles.open(prompt_path, "w", encoding="utf-8") as f:
        await f.write(prompt)

    return {"ok": True, "chapter": chapter_num, "prompt_written": True}


@app.get("/api/get-story")
async def get_story():
    """
    Read story_book.md and tasks.json.
    Returns { html: str, tasks: list, advice: str }.
    """
    # Story HTML
    html = ""
    if STORY_BOOK_PATH.exists():
        async with aiofiles.open(STORY_BOOK_PATH, "r", encoding="utf-8") as f:
            md_text = await f.read()
        html = markdown.markdown(
            md_text,
            extensions=["extra", "nl2br"],
        )

    # Tasks
    tasks = []
    advice = ""
    if TASKS_PATH.exists():
        async with aiofiles.open(TASKS_PATH, "r", encoding="utf-8") as f:
            raw = await f.read()
        try:
            data = json.loads(raw)
            tasks = data.get("tasks", [])
            advice = data.get("advice", "")
        except json.JSONDecodeError:
            pass

    return JSONResponse({"html": html, "tasks": tasks, "advice": advice})


@app.get("/api/export")
async def export_story():
    """Return story_book.md as a downloadable file."""
    if not STORY_BOOK_PATH.exists():
        raise HTTPException(status_code=404, detail="story_book.md not found")

    return FileResponse(
        path=str(STORY_BOOK_PATH),
        media_type="text/markdown",
        filename="story_book.md",
        headers={"Content-Disposition": "attachment; filename=story_book.md"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
