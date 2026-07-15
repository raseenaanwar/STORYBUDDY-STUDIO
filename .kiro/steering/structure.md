---
inclusion: always
---

# Project Structure

```
kirochallenge/
├── .kiro/
│   └── steering/
│       ├── story-partner.md   # AI persona rules and output format specs
│       ├── product.md         # Product summary and audience constraints
│       ├── tech.md            # Tech stack and build commands
│       └── structure.md       # This file
└── storybuddy-studio/         # Main application source (currently empty)
```

## Conventions

### Output files
- `story_book.md` lives at the story session root; one file per story.
- `tasks.json` lives alongside `story_book.md`; updated as story milestones are completed.

### Story chapters
- Each chapter is a `## Chapter [N]: [Title]` heading inside `story_book.md`.
- Chapters always follow the five-beat structure: Hook → Goal → Obstacle → Attempt → Outcome.
- Every chapter ends with an `> Illustration idea:` blockquote and a `### Buddy's tip:` section.

### Character cards
- Characters are defined with a `modifier` field where applicable.
- Modifiers are hard constraints — never ignored, never softened.
- Keep character definitions close to where they are used (inline in session context or a `characters.json` at session root).

### Naming
- Files use `snake_case`.
- Story titles use title case in the `# [Story title]` heading.
