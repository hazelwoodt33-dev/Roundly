"use client";

import { buildLeaderboard } from "@/lib/leaderboard";
import { formatScoreToPar } from "@/lib/utils";
import type { CourseHole, EventPlayer, Score } from "@/lib/types";

type LeaderboardProps = {
  players: EventPlayer[];
  scores: Score[];
  currentUserId: string;
  courseHoles: CourseHole[];
  scoringFormat: "stableford" | "strokeplay";
};

export function Leaderboard({
  players,
  scores,
  currentUserId,
  courseHoles = [],
  scoringFormat = "stableford",
}: LeaderboardProps) {
  const entries = buildLeaderboard(
    players,
    scores,
    currentUserId,
    courseHoles,
    scoringFormat,
  );

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-fairway-900">
  {scoringFormat === "stableford"
    ? "Stableford Leaderboard"
    : "Stroke Play Leaderboard"}
</h2>
        <span className="text-xs font-medium text-fairway-500">Live</span>
      </div>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-fairway-500">No players yet</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, index) => (
            <li
              key={entry.playerId}
              className={`rounded-2xl px-3 py-3 ${
                entry.isCurrentUser
                  ? "bg-fairway-100 ring-1 ring-fairway-200"
                  : "bg-fairway-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 && entry.holesPlayed > 0
                      ? "bg-amber-400 text-amber-950"
                      : "bg-fairway-200 text-fairway-700"
                  }`}
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fairway-900">
                    {entry.displayName}
                    {entry.isCurrentUser && (
                      <span className="ml-1.5 text-xs font-medium text-fairway-500">
                        (you)
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-fairway-500">
                    {entry.holesPlayed}/18 holes
                  </p>
                </div>

                <div className="text-right">
                  {entry.holesPlayed > 0 ? (
                    <>
                     <p className="text-xl font-extrabold text-fairway-800">
  {scoringFormat === "stableford"
    ? `${entry.stablefordPoints} pts`
    : entry.totalStrokes}
</p>
                      
<p className="text-xs text-fairway-500">
  {scoringFormat === "stableford"
    ? `${entry.totalStrokes} strokes · ${formatScoreToPar(
        entry.totalStrokes,
        entry.totalPar,
      )}`
    : formatScoreToPar(entry.totalStrokes, entry.totalPar)}
</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-fairway-300">—</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}