/**
 * LivingBook
 * Right-panel story viewer. Renders HTML from the backend
 * (converted from story_book.md) with story-prose styling.
 * Shows a loading shimmer and an error state.
 */
export default function LivingBook({ html, loading, error, generating = false }) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <span className="text-4xl" aria-hidden="true">⚠️</span>
        <p className="text-gray-500 text-sm">
          Couldn't connect to StoryBuddy. Make sure the backend is running on port 3001.
        </p>
        <code className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg">{error}</code>
      </div>
    );
  }

  if (loading && !html) {
    return (
      <div className="p-6 space-y-4 animate-pulse" aria-label="Loading story…">
        <div className="h-8 bg-gray-200 rounded-xl w-2/3" />
        <div className="h-4 bg-gray-100 rounded-lg w-full" />
        <div className="h-4 bg-gray-100 rounded-lg w-5/6" />
        <div className="h-4 bg-gray-100 rounded-lg w-4/6" />
        <div className="h-4 bg-gray-100 rounded-lg w-full mt-4" />
        <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
      </div>
    );
  }

  // Generating shimmer overlay on top of existing content
  if (generating) {
    return (
      <div className="relative">
        {html && (
          <article
            className="story-prose px-6 py-4 opacity-40 pointer-events-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80">
          <div className="flex gap-2">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-buddy-purple animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-buddy-purple font-semibold text-sm">StoryBuddy is writing your chapter…</p>
        </div>
      </div>
    );
  }
  if (!html) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <span className="text-6xl select-none" aria-hidden="true">📖</span>
        <h2 className="text-xl font-bold text-gray-700">Your story lives here!</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Add characters and a setting on the left, type your big idea in the Spark Box, and watch the story grow.
        </p>
      </div>
    );
  }

  return (
    <article
      className="story-prose px-6 py-4"
      aria-label="Story book"
      /* Safe: HTML is generated server-side from our own markdown files */
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
