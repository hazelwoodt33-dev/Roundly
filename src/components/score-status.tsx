import { buildLeaderboard } from "@/lib/leaderboard";
import type { EventPlayer, Score } from "@/lib/types";

type ScoreStatusProps = {
  players: EventPlayer[];
  scores: Score[];
  currentUserId: string;
};

export function ScoreStatus({ players, scores, currentUserId }: ScoreStatusProps) {
  const entries = buildLeaderboard(players, scores, currentUserId);

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-bold text-fairway-900">Score status</h2>
      <ul className="space-y-2">
        {entries.map((entry) => {
          const complete = entry.holesPlayed === 18;
          const progress = Math.round((entry.holesPlayed / 18) * 100);

          return (
            <li key={entry.playerId} className="rounded-2xl bg-fairway-50 px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate font-semibold text-fairway-900">
                  {entry.displayName}
                </span>
                <span className="shrink-0 text-sm font-medium text-fairway-600">
                  {entry.holesPlayed}/18 holes
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-fairway-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    complete ? "bg-fairway-600" : "bg-fairway-400"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-fairway-500">
                {entry.holesPlayed === 0
                  ? "No scores entered"
                  : complete
                    ? `Round complete · ${entry.totalStrokes} strokes`
                    : `${entry.totalStrokes} strokes so far`}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
