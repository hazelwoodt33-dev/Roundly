import type { EventPlayer } from "@/lib/types";

type PlayersListProps = {
  players: EventPlayer[];
  currentUserId: string;
};

export function PlayersList({
  players,
  currentUserId,
}: PlayersListProps) {
  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-bold text-fairway-900">
        Players ({players.length})
      </h2>

      <ul className="space-y-2">
        {players.map((player) => (
          <li
            key={player.id}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
              player.user_id === currentUserId
                ? "bg-fairway-100 ring-1 ring-fairway-200"
                : "bg-fairway-50"
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fairway-200 text-sm font-bold text-fairway-700">
              {player.display_name.charAt(0).toUpperCase()}
            </span>

            <div className="flex-1">
              <p className="font-semibold text-fairway-900">
                {player.display_name}

                {player.playing_handicap != null && (
                  <span className="ml-2 text-xs text-fairway-500">
                    HCP {player.playing_handicap}
                  </span>
                )}

                {player.user_id === currentUserId && (
                  <span className="ml-2 text-xs text-fairway-500">
                    (you)
                  </span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}