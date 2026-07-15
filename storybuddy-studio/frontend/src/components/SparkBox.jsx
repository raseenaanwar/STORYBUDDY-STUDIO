/**
 * SparkBox
 * The child's main idea input. Debounces saves at 900 ms and
 * calls onSave(value) when the debounce fires.
 */
import { useState, useEffect, useRef } from "react";

const DEBOUNCE_MS = 900;

export default function SparkBox({ initialValue = "", onSave, saving = false, onGenerate, canGenerate = false, generating = false }) {
  const [value, setValue] = useState(initialValue);
  const [pendingSave, setPendingSave] = useState(false);
  const debounceRef = useRef(null);

  // Sync if parent updates initialValue (e.g. loaded from server)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleChange(e) {
    const newVal = e.target.value;
    setValue(newVal);
    setPendingSave(true);

    // Reset debounce timer
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave(newVal);
      setPendingSave(false);
    }, DEBOUNCE_MS);
  }

  // Clean up on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const isBusy = saving || pendingSave;

  return (
    <div className="rounded-2xl border-2 border-buddy-yellow bg-buddy-yellow-light p-4">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="spark-input"
          className="font-bold text-gray-800 flex items-center gap-2"
        >
          ✨ Your Spark Idea
        </label>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
            isBusy
              ? "bg-buddy-yellow text-gray-700 animate-pulse"
              : "bg-buddy-green-light text-buddy-green"
          }`}
          aria-live="polite"
        >
          {isBusy ? "Saving…" : "Saved"}
        </span>
      </div>

      <textarea
        id="spark-input"
        value={value}
        onChange={handleChange}
        rows={4}
        placeholder="Type your big idea here! What happens next in your story? Where do your characters go? What do they discover?"
        className="w-full resize-none rounded-xl border border-yellow-300 bg-white px-3 py-2 text-gray-800 placeholder-gray-400 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-buddy-yellow focus:border-transparent transition"
        aria-label="Story spark idea input"
      />

      <p className="text-xs text-gray-500 mt-1.5">
        StoryBuddy will expand your idea into the next chapter — keep typing!
      </p>

      {onGenerate && (
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
            generating
              ? "bg-buddy-purple text-white animate-pulse cursor-wait"
              : canGenerate
              ? "bg-buddy-purple text-white hover:bg-purple-700 active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Generate the next story chapter"
        >
          {generating ? "✨ StoryBuddy is writing…" : "✨ Generate Story"}
        </button>
      )}
    </div>
  );
}
