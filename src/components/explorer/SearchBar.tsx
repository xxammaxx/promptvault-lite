import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/appStore";

export const SearchBar = React.forwardRef<HTMLInputElement, object>(
  function SearchBar(_props, ref) {
    const [value, setValue] = useState("");
    const filters = useAppStore((s) => s.filters);
    const setFilters = useAppStore((s) => s.setFilters);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Sync local state when filters are cleared externally (e.g. Escape shortcut)
    useEffect(() => {
      if (filters.search === "" && value !== "") {
        setValue("");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
        }
      }
    }, [filters.search, value]);

    const debouncedSearch = useCallback(
      (val: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setFilters({ search: val }), 300);
      },
      [setFilters],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      debouncedSearch(e.target.value);
    };

    const handleClear = () => {
      setValue("");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      setFilters({ search: "" });
    };

    return (
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          ref={ref}
          type="text"
          className="search-input"
          placeholder="Suchen (Strg+F)"
          value={value}
          onChange={handleChange}
        />
        {value && (
          <button className="search-clear" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>
    );
  },
);
