/**
 * App.jsx — StoryBuddy Studio root
 *
 * Layout: fixed header + two-panel split screen
 *   Left  → AdventureCanvas  (characters, settings, spark input)
 *   Right → LivingBook + BuddyAdvice + TaskChecklist + export button
 *
 * Generation flow:
 *   1. Child edits canvas → debounced POST /api/save-state (900ms)
 *   2. Child clicks "✨ Generate Story" → POST /api/generate
 *      → backend writes data/generate_prompt.md
 *      → Kiro PostFileSave hook fires on generate_prompt.md
 *      → Kiro native model writes story_book.md + tasks.json
 *   3. useStorySync polls GET /api/get-story every 2s → renders result
 */
import { useState, useCallback, useRef, useEffect } from "react";
import AdventureCanvas from "./components/AdventureCanvas.jsx";
import LivingBook from "./components/LivingBook.jsx";
import BuddyAdvice from "./components/BuddyAdvice.jsx";
import TaskChecklist from "./components/TaskChecklist.jsx";
import { useStorySync } from "./hooks/useStorySync.js";

// ---------------------------------------------------------------------------
// Fallback initial state (used until server state loads)
// ---------------------------------------------------------------------------
const BLANK_STATE = {
  title: "My Amazing Adventure",
  characters: [],
  settings: [],
  raw_input: "",
  completed_tasks: [],
  chapter_count: 0,
  last_updated: "",
};

const SAVE_DEBOUNCE_MS = 900;

// ---------------------------------------------------------------------------
export default function App() {
  const [storyState, setStoryState] = useState(BLANK_STATE);
  const [stateLoaded, setStateLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [generateOk, setGenerateOk] = useState(false);
  const saveTimerRef = useRef(null);

  // Live story polling
  const { html, tasks, advice, loading, error: syncError } = useStorySync();

  // -------------------------------------------------------------------------
  // Load saved state from server on first mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch("/api/get-state");
        if (!res.ok) return; // fall back to blank state silently
        const data = await res.json();
        if (data && data.title) {
          setStoryState(data);
        }
      } catch {
        // server not ready yet — blank state is fine
      } finally {
        setStateLoaded(true);
      }
    }
    loadState();
  }, []);

  // -------------------------------------------------------------------------
  // Debounced save to POST /api/save-state
  // -------------------------------------------------------------------------
  const scheduleSave = useCallback((nextState) => {
    clearTimeout(saveTimerRef.current);
    setSaving(true);
    setSaveError(null);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextState),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail ?? `Save failed (${res.status})`);
        }
      } catch (err) {
        setSaveError(err.message);
      } finally {
        setSaving(false);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // -------------------------------------------------------------------------
  // Called by AdventureCanvas whenever anything changes
  // -------------------------------------------------------------------------
  function handleStateChange(partial) {
    setStoryState((prev) => {
      const next = { ...prev, ...partial };
      scheduleSave(next);
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Task toggle
  // -------------------------------------------------------------------------
  function handleTaskToggle(taskId) {
    setStoryState((prev) => {
      const already = prev.completed_tasks.includes(taskId);
      const completed_tasks = already
        ? prev.completed_tasks.filter((id) => id !== taskId)
        : [...prev.completed_tasks, taskId];
      const next = { ...prev, completed_tasks };
      scheduleSave(next);
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Generate — save first, then POST /api/generate
  // -------------------------------------------------------------------------
  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setGenerateOk(false);

    // Flush any pending save first
    clearTimeout(saveTimerRef.current);
    try {
      const saveRes = await fetch("/api/save-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyState),
      });
      if (!saveRes.ok) throw new Error("Could not save state before generating");

      const genRes = await fetch("/api/generate", { method: "POST" });
      if (!genRes.ok) {
        const body = await genRes.json().catch(() => ({}));
        throw new Error(body.detail ?? `Generate failed (${genRes.status})`);
      }

      setGenerateOk(true);
      setTimeout(() => setGenerateOk(false), 4000);

      // Bump local chapter count to match what backend expects next time
      setStoryState((prev) => ({
        ...prev,
        chapter_count: prev.chapter_count + 1,
      }));
    } catch (err) {
      setGenerateError(err.message);
      setTimeout(() => setGenerateError(null), 6000);
    } finally {
      setSaving(false);
      setGenerating(false);
    }
  }

  // -------------------------------------------------------------------------
  // Export / download
  // -------------------------------------------------------------------------
  async function handleExport() {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "story_book.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Could not export: ${err.message}`);
    }
  }

  // Merge server task done-state with local completed_tasks
  const mergedTasks = tasks.map((t) => ({
    ...t,
    done: t.done || storyState.completed_tasks.includes(t.id),
  }));

  const canGenerate = storyState.raw_input.trim().length > 0 && !generating && !saving;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-3 bg-buddy-purple shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" aria-hidden="true">📚</span>
          <h1 className="text-white font-bold text-lg tracking-tight">
            StoryBuddy Studio
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
              saveError
                ? "bg-red-500 text-white"
                : saving
                ? "bg-purple-400 text-white animate-pulse"
                : "bg-purple-800 text-purple-200"
            }`}
            aria-live="polite"
          >
            {saveError ? `⚠ ${saveError}` : saving ? "Saving…" : "✓ Saved"}
          </span>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`flex items-center gap-2 font-semibold text-sm px-4 py-1.5 rounded-xl transition-all ${
              generateOk
                ? "bg-buddy-green text-white"
                : generateError
                ? "bg-red-500 text-white"
                : generating
                ? "bg-purple-400 text-white animate-pulse cursor-wait"
                : canGenerate
                ? "bg-white text-buddy-purple hover:bg-purple-50"
                : "bg-purple-800 text-purple-400 cursor-not-allowed"
            }`}
            aria-label="Generate the next story chapter"
            title={!canGenerate && !generating ? "Type a spark idea first" : ""}
          >
            {generating ? "✨ Writing…" : generateOk ? "✓ Chapter ready!" : generateError ? "⚠ Error" : "✨ Generate Story"}
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-buddy-yellow hover:bg-yellow-400 text-gray-900 font-semibold text-sm px-4 py-1.5 rounded-xl transition-colors"
            aria-label="Download your story as a Markdown file"
          >
            ⬇ Export Story
          </button>
        </div>
      </header>

      {/* Generate error banner */}
      {generateError && (
        <div className="bg-red-50 border-b border-red-200 px-5 py-2 text-sm text-red-700 flex-shrink-0" role="alert">
          ⚠ {generateError}
        </div>
      )}

      {/* ── Split screen body ── */}
      <main className="flex flex-1 overflow-hidden">
        {/* LEFT — Adventure Canvas */}
        <aside
          className="w-[420px] flex-shrink-0 border-r-2 border-buddy-purple-light bg-white overflow-y-auto story-scroll"
          aria-label="Adventure Canvas — build your story"
        >
          {stateLoaded && (
            <AdventureCanvas
              state={storyState}
              onStateChange={handleStateChange}
              saving={saving}
              onGenerate={handleGenerate}
              canGenerate={canGenerate}
              generating={generating}
            />
          )}
        </aside>

        {/* RIGHT — Living Book */}
        <section
          className="flex-1 flex flex-col overflow-hidden bg-gray-50"
          aria-label="Living Book — your story in progress"
        >
          <div className="flex-1 overflow-y-auto story-scroll">
            <LivingBook html={html} loading={loading} error={syncError} generating={generating} />
          </div>

          {(advice || mergedTasks.length > 0) && (
            <div className="flex-shrink-0 border-t-2 border-buddy-purple-light bg-white px-5 py-4 space-y-3 max-h-72 overflow-y-auto story-scroll">
              <BuddyAdvice advice={advice} />
              <TaskChecklist tasks={mergedTasks} onToggle={handleTaskToggle} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
