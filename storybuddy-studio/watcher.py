"""
StoryBuddy Studio — watcher (informational only)

Story generation is handled entirely by the Kiro agent hook:
  .kiro/hooks/on-canvas-change.json

That hook fires automatically inside Kiro whenever
data/story_state.json is saved, and instructs Kiro's native model
(Qwen3 Coder / DeepSeek) to write story_book.md and tasks.json.

This script is kept for local development diagnostics only.
Run it to tail the data files and confirm the hook is working:

    python watcher.py

It will print a line every time story_state.json changes,
showing you what the hook is about to receive.
"""

import asyncio
import json
import time
from pathlib import Path

from watchfiles import awatch

BASE_DIR         = Path(__file__).resolve().parent
DATA_DIR         = BASE_DIR / "data"
STORY_STATE_PATH = DATA_DIR / "story_state.json"
DEBOUNCE_SECONDS = 0.9


async def watch_loop() -> None:
    print("=" * 60)
    print("  StoryBuddy Studio — diagnostic watcher")
    print("  Story generation is handled by Kiro's on-canvas-change hook.")
    print(f"  Watching: {STORY_STATE_PATH}")
    print("  Press Ctrl+C to stop.")
    print("=" * 60 + "\n")

    last_triggered: float = 0.0

    async for _changes in awatch(str(STORY_STATE_PATH)):
        now = time.monotonic()
        if now - last_triggered < DEBOUNCE_SECONDS:
            continue
        last_triggered = now

        try:
            state = json.loads(STORY_STATE_PATH.read_text(encoding="utf-8"))
            chapter = state.get("chapter_count", 0) + 1
            title   = state.get("title", "?")
            chars   = [c["name"] for c in state.get("characters", [])]
            spark   = state.get("raw_input", "")[:80]
            print(f"[change detected]")
            print(f"  title      : {title}")
            print(f"  characters : {', '.join(chars) if chars else 'none'}")
            print(f"  next chapter: {chapter}")
            print(f"  spark input: {spark!r}")
            print(f"  → Kiro hook will generate chapter {chapter} now.\n")
        except Exception as e:
            print(f"[watcher] Could not read story_state.json: {e}")


if __name__ == "__main__":
    asyncio.run(watch_loop())
