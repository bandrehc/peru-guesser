"use client";

import { useCallback, useReducer } from "react";
import type { UnitRef } from "@/lib/types";

export interface GameState {
  status: "loading" | "playing" | "finished";
  /** Unidades por identificar; el objetivo actual es queue[0]. */
  queue: UnitRef[];
  /** Ids ya identificadas (pintado permanente). */
  completadas: string[];
  /** Errores acumulados por unidad objetivo (para contar "perfectas"). */
  fallosPorUnidad: Record<string, number>;
  errores: number;
  /** Unidad a resaltar en rojo tras un error; seq distingue flashes seguidos. */
  flash: { unitId: string; seq: number } | null;
  startedAt: number;
  finishedAt: number | null;
}

export type GameAction =
  | { type: "START"; units: UnitRef[] }
  | {
      type: "RESOLVE";
      correct: boolean;
      flashUnitId: string | null;
      /** Modo fotográfico: un intento por objetivo, se avanza aunque falle. */
      advanceOnFail?: boolean;
    }
  | { type: "CLEAR_FLASH" };

const initialState: GameState = {
  status: "loading",
  queue: [],
  completadas: [],
  fallosPorUnidad: {},
  errores: 0,
  flash: null,
  startedAt: 0,
  finishedAt: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return {
        ...initialState,
        status: "playing",
        queue: action.units,
        startedAt: Date.now(),
      };

    // El llamador decide si el intento fue correcto (clic o nombre escrito);
    // el reducer solo avanza la partida y lleva la cuenta.
    case "RESOLVE": {
      if (state.status !== "playing") return state;
      const target = state.queue[0];
      if (!target) return state;

      if (action.correct) {
        const queue = state.queue.slice(1);
        const finished = queue.length === 0;
        return {
          ...state,
          queue,
          completadas: [...state.completadas, target.id],
          status: finished ? "finished" : "playing",
          finishedAt: finished ? Date.now() : null,
          flash: null,
        };
      }

      const queue = action.advanceOnFail ? state.queue.slice(1) : state.queue;
      const finished = queue.length === 0;
      return {
        ...state,
        queue,
        status: finished ? "finished" : "playing",
        finishedAt: finished ? Date.now() : null,
        errores: state.errores + 1,
        fallosPorUnidad: {
          ...state.fallosPorUnidad,
          [target.id]: (state.fallosPorUnidad[target.id] ?? 0) + 1,
        },
        flash: action.flashUnitId
          ? { unitId: action.flashUnitId, seq: (state.flash?.seq ?? 0) + 1 }
          : null,
      };
    }

    case "CLEAR_FLASH":
      return state.flash ? { ...state, flash: null } : state;
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback(
    (units: UnitRef[]) => dispatch({ type: "START", units: shuffle(units) }),
    []
  );
  const resolve = useCallback(
    (
      correct: boolean,
      flashUnitId: string | null = null,
      advanceOnFail = false
    ) => dispatch({ type: "RESOLVE", correct, flashUnitId, advanceOnFail }),
    []
  );
  const clearFlash = useCallback(() => dispatch({ type: "CLEAR_FLASH" }), []);

  return { state, start, resolve, clearFlash };
}
