---
inclusion: always
---

# Tech Stack

## Stack
- **Runtime**: Python 3.11+
- **Primary language**: Python
- **AI integration**: LLM API calls for story generation (provider TBD)
- **Package manager**: pip / venv

## Key data formats
- `story_book.md` — Markdown; the canonical story output file.
- `tasks.json` — JSON; tracks task completion and surfaces advice to the child.

## Output schema for tasks.json
```json
{
  "tasks": [
    { "id": "string", "label": "string", "done": true }
  ],
  "advice": "string"
}
```

## Common commands

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the app
python main.py

# Run tests
pytest

# Freeze dependencies
pip freeze > requirements.txt
```
