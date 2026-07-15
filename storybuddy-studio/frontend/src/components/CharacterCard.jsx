/**
 * CharacterCard
 * Displays a single character with their name, description, and
 * an optional modifier badge. Provides edit and delete callbacks.
 */

const MODIFIER_COLORS = {
  default: "bg-buddy-purple text-white",
  rhyme: "bg-buddy-pink text-white",
  backwards: "bg-buddy-yellow text-gray-900",
  lies: "bg-buddy-green text-white",
};

function getModifierColor(modifier) {
  if (!modifier) return MODIFIER_COLORS.default;
  const m = modifier.toLowerCase();
  if (m.includes("rhyme")) return MODIFIER_COLORS.rhyme;
  if (m.includes("backward")) return MODIFIER_COLORS.backwards;
  if (m.includes("lie") || m.includes("truth")) return MODIFIER_COLORS.lies;
  return MODIFIER_COLORS.default;
}

export default function CharacterCard({ character, onEdit, onDelete }) {
  const { name, description, modifier } = character;

  return (
    <div className="bg-white rounded-2xl border-2 border-buddy-purple-light p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar initial */}
          <div
            className="w-10 h-10 rounded-full bg-buddy-purple flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            aria-hidden="true"
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-gray-900 truncate">{name}</h3>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(character)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-buddy-purple hover:bg-buddy-purple-light transition-colors"
            aria-label={`Edit ${name}`}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(character.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label={`Delete ${name}`}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-2 leading-snug line-clamp-2">
        {description || <span className="italic text-gray-400">No description yet</span>}
      </p>

      {/* Modifier badge */}
      {modifier && (
        <div className="mt-3">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${getModifierColor(modifier)}`}
            title="This modifier must always be honoured in the story"
          >
            ⚡ {modifier}
          </span>
        </div>
      )}
    </div>
  );
}
