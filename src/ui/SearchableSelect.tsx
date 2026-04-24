import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  onTabNext?: () => void;
};

export default function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  inputRef,
  onTabNext,
}: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const internalRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Reset active index quand le dropdown s'ouvre ou que la liste change
  useEffect(() => {
    setActiveIndex(-1);
    itemRefs.current = [];
  }, [open, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll l'item actif dans la vue
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((o) => o.toLowerCase().includes(normalized));
  }, [options, query]);

  function handleSelect(option: string) {
    setQuery(option);
    onChange(option);
    setOpen(false);
    setActiveIndex(-1);
    onTabNext?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          handleSelect(filteredOptions[activeIndex]);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0]);
        }
        break;

      case "Tab":
        setOpen(false);
        if (onTabNext) {
          e.preventDefault();
          onTabNext();
        }
        break;

      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  return (
    <div ref={containerRef} style={{ marginBottom: "10px", position: "relative" }}>
      <label className="scifi-label">{label}</label>

      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="scifi-input"
        style={{ marginBottom: 0 }}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#08111a",
            border: "1px solid var(--border-glow)",
            borderTop: "none",
            maxHeight: "180px",
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {filteredOptions.map((option, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={option}
                ref={(el) => { itemRefs.current[i] = el; }}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  background: isActive ? "var(--accent-glow)" : "transparent",
                  color: isActive ? "var(--text)" : "rgba(189,208,226,0.75)",
                  borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  borderTop: "none",
                  borderRight: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  transition: "background 0.1s, color 0.1s",
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
