"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CourseHole, Score } from "@/lib/types";

type ScoreEntryProps = {
  eventPlayerId: string;
  initialScores: Score[];
  courseHoles: CourseHole[];
  compact?: boolean;
};

export function ScoreEntry({
  eventPlayerId,
  initialScores,
  courseHoles,
  compact = false,
}: ScoreEntryProps) {
  const supabase = useMemo(() => createClient(), []);

  const [scores, setScores] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};

    for (const score of initialScores) {
      map[score.hole_number] = score.strokes;
    }

    return map;
  });

  const [savingHole, setSavingHole] = useState<number | null>(null);
  const [activeHole, setActiveHole] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const holes = useMemo(() => {
    return [...courseHoles].sort((a, b) => a.hole_number - b.hole_number);
  }, [courseHoles]);

  const holeByNumber = useMemo(() => {
    const map = new Map<number, CourseHole>();

    for (const hole of holes) {
      map.set(hole.hole_number, hole);
    }

    return map;
  }, [holes]);

  useEffect(() => {
    if (savingHole !== null) return;

    const map: Record<number, number> = {};

    for (const score of initialScores) {
      map[score.hole_number] = score.strokes;
    }

    setScores(map);
  }, [initialScores, savingHole]);

  const saveScore = useCallback(
    async (hole: number, strokes: number) => {
      setError(null);
      setSavingHole(hole);

      let previousScore: number | undefined;

      setScores((previousScores) => {
        previousScore = previousScores[hole];

        return {
          ...previousScores,
          [hole]: strokes,
        };
      });

      const { error: saveError } = await supabase.from("scores").upsert(
        {
          event_player_id: eventPlayerId,
          hole_number: hole,
          strokes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "event_player_id,hole_number",
        },
      );

      if (saveError) {
        setScores((previousScores) => {
          const nextScores = { ...previousScores };

          if (previousScore != null) {
            nextScores[hole] = previousScore;
          } else {
            delete nextScores[hole];
          }

          return nextScores;
        });

        setError(saveError.message);
      }

      setSavingHole(null);
    },
    [eventPlayerId, supabase],
  );

  function getPar(holeNumber: number): number {
    return holeByNumber.get(holeNumber)?.par ?? 4;
  }

  function adjustScore(hole: number, delta: number) {
    const currentScore = scores[hole] ?? getPar(hole);
    const nextScore = Math.min(15, Math.max(1, currentScore + delta));

    saveScore(hole, nextScore);
  }

  function handleTypedScore(value: string) {
    if (value === "") {
      return;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    if (numericValue < 1 || numericValue > 15) {
      return;
    }

    saveScore(activeHole, numericValue);
  }

  const activeHoleData = holeByNumber.get(activeHole);
  const activePar = activeHoleData?.par ?? 4;
  const activeStrokeIndex = activeHoleData?.stroke_index ?? activeHole;
  const currentScore = scores[activeHole];
  const completedHoles = Object.keys(scores).length;

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-fairway-900">
            {compact ? "Current hole" : "Your scorecard"}
          </h2>
          <p className="mt-1 text-xs text-fairway-500">
            {completedHoles}/18 holes completed
          </p>
        </div>

        {!compact && (
          <span className="text-xs font-medium text-fairway-500">
            Tap a hole to edit
          </span>
        )}
      </div>

      {!compact && (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-fairway-100 text-left text-xs font-semibold uppercase tracking-wide text-fairway-500">
                <th className="px-2 py-2">Hole</th>
                <th className="px-2 py-2 text-center">Par</th>
                <th className="px-2 py-2 text-center">SI</th>
                <th className="px-2 py-2 text-right">Score</th>
              </tr>
            </thead>

            <tbody>
              {holes.map((hole) => {
                const isActive = activeHole === hole.hole_number;
                const hasScore = scores[hole.hole_number] != null;
                const isSaving = savingHole === hole.hole_number;

                return (
                  <tr
                    key={hole.id}
                    onClick={() => setActiveHole(hole.hole_number)}
                    className={`border-b border-fairway-50 transition duration-150 ${
                      isActive ? "bg-fairway-100" : "active:bg-fairway-50"
                    }`}
                  >
                    <td className="px-2 py-3 font-semibold text-fairway-900">
                      {hole.hole_number}
                    </td>

                    <td className="px-2 py-3 text-center text-fairway-600">
                      {hole.par}
                    </td>

                    <td className="px-2 py-3 text-center text-fairway-600">
                      {hole.stroke_index}
                    </td>

                    <td className="px-2 py-3 text-right">
                      <span
                        className={`inline-flex min-w-[2rem] items-center justify-end font-bold tabular-nums transition-opacity duration-150 ${
                          hasScore ? "text-fairway-900" : "text-fairway-300"
                        }`}
                      >
                        {isSaving ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-fairway-600 border-t-transparent" />
                        ) : hasScore ? (
                          scores[hole.hole_number]
                        ) : (
                          "—"
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-fairway-50 p-5 text-center">
        <p className="text-sm font-medium text-fairway-500">
          Hole {activeHole} · Par {activePar} · SI {activeStrokeIndex}
        </p>

        <div className="my-4 flex justify-center">
        <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={currentScore ?? ""}
  placeholder="—"
  disabled={savingHole !== null}
  onChange={(event) => handleTypedScore(event.target.value)}
  className="score-input w-32 rounded-3xl border border-fairway-200 bg-white px-3 py-3 text-center text-6xl font-extrabold tabular-nums text-fairway-900 shadow-sm transition-all duration-200 placeholder:text-fairway-300 focus:border-fairway-600 focus:outline-none focus:ring-4 focus:ring-fairway-100 disabled:opacity-60"
/>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => adjustScore(activeHole, -1)}
            disabled={savingHole !== null}
            className="flex h-16 w-16 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-white text-3xl font-bold text-fairway-700 shadow-sm transition duration-150 active:scale-95 disabled:opacity-50"
            aria-label="Decrease score"
          >
            −
          </button>

          <button
            type="button"
            onClick={() => saveScore(activeHole, activePar)}
            disabled={savingHole !== null}
            className="min-h-[44px] rounded-xl px-4 py-2 text-base font-medium text-fairway-600 transition duration-150 active:bg-fairway-100 disabled:opacity-50"
          >
            Par ({activePar})
          </button>

          <button
            type="button"
            onClick={() => adjustScore(activeHole, 1)}
            disabled={savingHole !== null}
            className="flex h-16 w-16 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-fairway-700 text-3xl font-bold text-white shadow-sm transition duration-150 active:scale-95 disabled:opacity-50"
            aria-label="Increase score"
          >
            +
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveHole((hole) => Math.max(1, hole - 1))}
            disabled={activeHole === 1}
            className="min-h-[44px] rounded-xl bg-white px-4 py-3 text-sm font-semibold text-fairway-700 shadow-sm transition duration-150 active:scale-95 disabled:opacity-40"
          >
            ← Previous
          </button>

          <button
            type="button"
            onClick={() => setActiveHole((hole) => Math.min(18, hole + 1))}
            disabled={activeHole === 18}
            className="min-h-[44px] rounded-xl bg-white px-4 py-3 text-sm font-semibold text-fairway-700 shadow-sm transition duration-150 active:scale-95 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}