"use client";

import { useId, useRef, useState } from "react";
import { normalizeName } from "@/lib/normalize";

interface TypeAnswerInputProps {
  /** Nombres candidatos para el autocompletado (unidades aún no acertadas). */
  options: string[];
  onSubmit: (text: string) => void;
  result: "ok" | "fail" | null;
}

const MAX_SUGGESTIONS = 8;

export default function TypeAnswerInput({
  options,
  onSubmit,
  result,
}: TypeAnswerInputProps) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const filtered = value.trim()
    ? options
        .filter((o) => normalizeName(o).includes(normalizeName(value)))
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const expanded = open && filtered.length > 0;

  function submit(text: string) {
    if (!text.trim()) return;
    onSubmit(text);
    setValue("");
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        setActive((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (expanded && active >= 0 && filtered[active]) {
          submit(filtered[active]);
        } else {
          submit(value);
        }
        break;
      case "Escape":
        setOpen(false);
        setActive(-1);
        break;
    }
  }

  return (
    <div className="relative max-w-md">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Nombre de la unidad resaltada
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={`${listId}-listbox`}
        aria-activedescendant={
          expanded && active >= 0 ? `${listId}-opt-${active}` : undefined
        }
        aria-autocomplete="list"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        placeholder="Escribe el nombre y presiona Enter…"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={
          "w-full rounded-lg border-2 bg-white px-4 py-2 text-zinc-900 outline-none transition-colors " +
          (result === "fail"
            ? "animate-shake border-red-500"
            : result === "ok"
              ? "border-emerald-500"
              : "border-zinc-300 focus:border-red-600")
        }
      />
      <p aria-live="polite" className="mt-1 min-h-5 text-sm">
        {result === "fail" && (
          <span className="font-medium text-red-600">✗ Incorrecto, intenta de nuevo</span>
        )}
        {result === "ok" && (
          <span className="font-medium text-emerald-700">✓ ¡Correcto!</span>
        )}
      </p>
      {expanded && (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          aria-label="Sugerencias"
          className="absolute top-12 z-[1100] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
        >
          {filtered.map((o, i) => (
            <li
              key={o}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown para ganarle al blur del input
              onMouseDown={(e) => {
                e.preventDefault();
                submit(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={
                "cursor-pointer px-4 py-2 text-zinc-800 " +
                (i === active ? "bg-red-50 text-red-700" : "")
              }
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
