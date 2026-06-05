import React from "react";
import { useAppStore } from "@/stores/appStore";
import type { HygieneStatus } from "@/types";

export const FilterPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const allCategories = useAppStore((s) => s.allCategories);
  const allTags = useAppStore((s) => s.allTags);

  const resultCount = useAppStore((s) => s.filteredPrompts)().length;

  const hygieneOptions: { value: HygieneStatus; label: string }[] = [
    { value: "clean", label: "✅ Sauber" },
    { value: "warning", label: "⚠️ Warnung" },
    { value: "critical", label: "🔴 Kritisch" },
  ];

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filter</h3>
        <button className="btn btn-small" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Kategorie */}
      <div className="filter-group">
        <label>Kategorie</label>
        <select
          value={filters.category || ""}
          onChange={(e) => {
            setFilters({ category: e.target.value || null });
          }}
        >
          <option value="">Alle</option>
          {allCategories().map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Score-Bereich */}
      <div className="filter-group">
        <label htmlFor="filter-min-score">
          Score: {filters.minScore}–{filters.maxScore}
        </label>
        <input
          id="filter-min-score"
          type="range"
          min={0}
          max={100}
          value={filters.minScore}
          aria-label="Minimaler Score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={filters.minScore}
          onChange={(e) => {
            setFilters({ minScore: Number(e.target.value) });
          }}
        />
        <input
          id="filter-max-score"
          type="range"
          min={0}
          max={100}
          value={filters.maxScore}
          aria-label="Maximaler Score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={filters.maxScore}
          onChange={(e) => {
            setFilters({ maxScore: Number(e.target.value) });
          }}
        />
      </div>

      {/* Hygiene */}
      <div className="filter-group">
        <label>Hygiene</label>
        <div className="filter-chips">
          {hygieneOptions.map((opt) => (
            <button
              key={opt.value}
              className={`chip ${filters.hygieneStatus === opt.value ? "chip-active" : ""}`}
              onClick={() => {
                setFilters({
                  hygieneStatus:
                    filters.hygieneStatus === opt.value ? null : opt.value,
                });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags().length > 0 && (
        <div className="filter-group">
          <label>Tags</label>
          <div className="filter-chips">
            {allTags().map((tag) => (
              <button
                key={tag}
                className={`chip ${filters.tags.includes(tag) ? "chip-active" : ""}`}
                onClick={() => {
                  const next = filters.tags.includes(tag)
                    ? filters.tags.filter((t) => t !== tag)
                    : [...filters.tags, tag];
                  setFilters({ tags: next });
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favoriten */}
      <div className="filter-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.favoritesOnly}
            onChange={(e) => {
              setFilters({ favoritesOnly: e.target.checked });
            }}
          />
          Nur Favoriten
        </label>
      </div>

      {/* Ergebnis + Reset */}
      <div className="filter-footer">
        <span className="filter-count">{resultCount} Prompt(s)</span>
        <button className="btn btn-small" onClick={resetFilters}>
          Filter zurücksetzen
        </button>
      </div>
    </div>
  );
};
