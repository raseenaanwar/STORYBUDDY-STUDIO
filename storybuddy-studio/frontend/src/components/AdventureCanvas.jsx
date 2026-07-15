/**
 * AdventureCanvas
 * Left panel: story title, character cards with add/edit/delete,
 * settings cards with add/edit/delete, and the SparkBox.
 * Calls onStateChange(partialState) whenever anything changes.
 */
import { useState } from "react";
import CharacterCard from "./CharacterCard.jsx";
import SparkBox from "./SparkBox.jsx";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ---- Mini modal for add/edit ----------------------------------------
function CardModal({ title, fields, initial = {}, onSave, onClose }) {
  const [form, setForm] = useState(initial);

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h2 id="modal-title" className="text-lg font-bold text-gray-900 mb-4">
          {title}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}
                {f.hint && (
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    {f.hint}
                  </span>
                )}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-buddy-purple resize-none"
                  required={f.required}
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-buddy-purple"
                  required={f.required}
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-buddy-purple text-white rounded-xl py-2 text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CHARACTER_FIELDS = [
  { key: "name", label: "Name", placeholder: "e.g. Alex", required: true },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    placeholder: "e.g. A curious kid who loves puzzles",
  },
  {
    key: "modifier",
    label: "Modifier",
    placeholder: 'e.g. "speaks in rhymes"',
    hint: "(optional — StoryBuddy will always honour this!)",
  },
];

const SETTING_FIELDS = [
  { key: "name", label: "Name", placeholder: "e.g. The Whispering Forest", required: true },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    placeholder: "e.g. A forest where trees hum ancient songs at night",
  },
];

// ---- Main component --------------------------------------------------
export default function AdventureCanvas({ state, onStateChange, saving, onGenerate, canGenerate, generating }) {
  const [charModal, setCharModal] = useState(null); // null | { mode, data }
  const [settingModal, setSettingModal] = useState(null);

  const { title, characters = [], settings = [], raw_input = "" } = state;

  // --- Title ---
  function handleTitleChange(e) {
    onStateChange({ title: e.target.value });
  }

  // --- Characters ---
  function saveCharacter(form) {
    let updated;
    if (charModal.mode === "add") {
      updated = [...characters, { id: generateId(), ...form, modifier: form.modifier ?? "" }];
    } else {
      updated = characters.map((c) =>
        c.id === charModal.data.id ? { ...c, ...form } : c
      );
    }
    onStateChange({ characters: updated });
    setCharModal(null);
  }

  function deleteCharacter(id) {
    onStateChange({ characters: characters.filter((c) => c.id !== id) });
  }

  // --- Settings ---
  function saveSetting(form) {
    let updated;
    if (settingModal.mode === "add") {
      updated = [...settings, { id: generateId(), ...form }];
    } else {
      updated = settings.map((s) =>
        s.id === settingModal.data.id ? { ...s, ...form } : s
      );
    }
    onStateChange({ settings: updated });
    setSettingModal(null);
  }

  function deleteSetting(id) {
    onStateChange({ settings: settings.filter((s) => s.id !== id) });
  }

  // --- Spark save ---
  function handleSparkSave(value) {
    onStateChange({ raw_input: value });
  }

  return (
    <div className="flex flex-col gap-5 p-4 h-full overflow-y-auto story-scroll">
      {/* Story title */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
          Story Title
        </label>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Give your story a title…"
          className="w-full rounded-xl border-2 border-buddy-purple-light px-3 py-2 font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-buddy-purple focus:border-transparent transition"
          aria-label="Story title"
        />
      </div>

      {/* Characters */}
      <section aria-labelledby="characters-heading">
        <div className="flex items-center justify-between mb-2">
          <h2
            id="characters-heading"
            className="text-sm font-bold text-gray-700 uppercase tracking-wide"
          >
            🧙 Characters
          </h2>
          <button
            onClick={() => setCharModal({ mode: "add", data: {} })}
            className="text-xs font-semibold text-buddy-purple hover:text-purple-700 bg-buddy-purple-light hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors"
            aria-label="Add new character"
          >
            + Add
          </button>
        </div>

        {characters.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
            No characters yet — add your first hero!
          </p>
        ) : (
          <div className="space-y-3">
            {characters.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                onEdit={(char) => setCharModal({ mode: "edit", data: char })}
                onDelete={deleteCharacter}
              />
            ))}
          </div>
        )}
      </section>

      {/* Settings */}
      <section aria-labelledby="settings-heading">
        <div className="flex items-center justify-between mb-2">
          <h2
            id="settings-heading"
            className="text-sm font-bold text-gray-700 uppercase tracking-wide"
          >
            🗺️ Settings
          </h2>
          <button
            onClick={() => setSettingModal({ mode: "add", data: {} })}
            className="text-xs font-semibold text-buddy-blue hover:text-blue-700 bg-buddy-blue-light hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
            aria-label="Add new setting"
          >
            + Add
          </button>
        </div>

        {settings.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
            No settings yet — where does your story take place?
          </p>
        ) : (
          <div className="space-y-2">
            {settings.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border-2 border-buddy-blue-light p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setSettingModal({ mode: "edit", data: s })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-buddy-blue hover:bg-buddy-blue-light transition-colors"
                      aria-label={`Edit ${s.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteSetting(s.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Delete ${s.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Spark Box */}
      <SparkBox
        initialValue={raw_input}
        onSave={handleSparkSave}
        saving={saving}
        onGenerate={onGenerate}
        canGenerate={canGenerate}
        generating={generating}
      />

      {/* Modals */}
      {charModal && (
        <CardModal
          title={charModal.mode === "add" ? "Add a Character" : "Edit Character"}
          fields={CHARACTER_FIELDS}
          initial={charModal.data}
          onSave={saveCharacter}
          onClose={() => setCharModal(null)}
        />
      )}
      {settingModal && (
        <CardModal
          title={settingModal.mode === "add" ? "Add a Setting" : "Edit Setting"}
          fields={SETTING_FIELDS}
          initial={settingModal.data}
          onSave={saveSetting}
          onClose={() => setSettingModal(null)}
        />
      )}
    </div>
  );
}
