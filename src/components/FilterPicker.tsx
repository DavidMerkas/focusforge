"use client";

import { useEffect, useRef, useState } from "react";

export interface FilterOption {
  id: string;
  label: string;
  icon: string;
}

export function FilterPicker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const active = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="px-5 pb-3" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          color: "var(--ink)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{active.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-faint)", letterSpacing: 1, textTransform: "uppercase" }}>Filter</span>
          <span style={{ color: "var(--accent)" }}>{active.label}</span>
        </span>
        <span style={{ fontSize: 12, color: "var(--ink-soft)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% - 4px)",
            left: 20,
            right: 20,
            zIndex: 40,
            background: "rgba(20,18,40,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: 6,
            boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,255,74,0.10)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {options.map((o) => {
            const sel = o.id === value;
            return (
              <button
                key={o.id}
                role="option"
                aria-selected={sel}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                style={{
                  appearance: "none",
                  border: 0,
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: sel ? "rgba(201,255,74,0.12)" : "transparent",
                  color: sel ? "var(--accent)" : "var(--ink)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: sel ? "inset 0 0 0 1px rgba(201,255,74,0.30)" : "none",
                }}
              >
                <span style={{ fontSize: 16 }}>{o.icon}</span>
                <span style={{ flex: 1 }}>{o.label}</span>
                {sel && <span style={{ fontSize: 12 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
