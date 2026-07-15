/**
 * BuddyAdvice
 * Callout box that surfaces the AI's one-sentence tip for the child.
 */
export default function BuddyAdvice({ advice }) {
  if (!advice) return null;

  return (
    <div
      className="flex gap-3 rounded-2xl bg-buddy-purple-light border-2 border-buddy-purple p-4"
      role="note"
      aria-label="StoryBuddy's advice"
    >
      {/* Buddy mascot */}
      <div className="flex-shrink-0 text-3xl select-none" aria-hidden="true">
        🌟
      </div>

      <div>
        <p className="text-xs font-bold text-buddy-purple uppercase tracking-wide mb-1">
          StoryBuddy says…
        </p>
        <p className="text-sm text-gray-800 leading-relaxed">{advice}</p>
      </div>
    </div>
  );
}
