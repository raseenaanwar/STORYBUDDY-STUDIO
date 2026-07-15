/**
 * TaskChecklist
 * Renders the tasks array from tasks.json as an interactive checklist.
 * Calls onToggle(taskId) when the child checks/unchecks a task.
 */
export default function TaskChecklist({ tasks = [], onToggle }) {
  if (tasks.length === 0) return null;

  const doneCount = tasks.filter((t) => t.done).length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="rounded-2xl border-2 border-buddy-green-light bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          📋 Story Checklist
        </h3>
        <span className="text-xs font-semibold text-buddy-green">
          {doneCount}/{tasks.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progress}% of tasks complete`}
      >
        <div
          className="h-full bg-buddy-green rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task items */}
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-3">
            <button
              onClick={() => onToggle?.(task.id)}
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
                task.done
                  ? "bg-buddy-green border-buddy-green text-white"
                  : "border-gray-300 hover:border-buddy-green bg-white"
              }`}
              aria-pressed={task.done}
              aria-label={`Mark "${task.label}" as ${task.done ? "not done" : "done"}`}
            >
              {task.done && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span
              className={`text-sm leading-snug ${
                task.done ? "line-through text-gray-400" : "text-gray-700"
              }`}
            >
              {task.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
