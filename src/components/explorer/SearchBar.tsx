import React, { useState, useCallback } from "react";
import { useAppStore } from "@/stores/appStore";

export const SearchBar: React.FC = () => {
  const [value, setValue] = useState("");
  const setFilters = useAppStore((s) => s.setFilters);

  const debouncedSearch = useCallback(
    (() => {
      let timeout: ReturnType<typeof setTimeout>;
      return (val: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => setFilters({ search: val }), 300);
      };
    })(),
    [setFilters],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder="Prompts durchsuchen..."
        value={value}
        onChange={handleChange}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => {
            setValue("");
            setFilters({ search: "" });
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
