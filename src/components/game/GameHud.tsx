"use client";

import { useEffect, useState } from "react";

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

interface GameHudProps {
  prompt: React.ReactNode;
  done: number;
  total: number;
  errores: number;
  startedAt: number;
  finishedAt: number | null;
}

export default function GameHud({
  prompt,
  done,
  total,
  errores,
  startedAt,
  finishedAt,
}: GameHudProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finishedAt]);

  const elapsed = startedAt ? (finishedAt ?? now) - startedAt : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      <p className="text-base" aria-live="polite">
        {prompt}
      </p>
      <p className="text-sm tabular-nums text-zinc-600">
        <span className="font-semibold text-emerald-700">{done}</span> / {total}
      </p>
      <p className="text-sm tabular-nums text-zinc-600">
        Errores: <span className="font-semibold text-carmesi">{errores}</span>
      </p>
      <p className="text-sm tabular-nums text-zinc-600">⏱ {formatTime(elapsed)}</p>
    </div>
  );
}
