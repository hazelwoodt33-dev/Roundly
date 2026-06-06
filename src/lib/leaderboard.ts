import {
  CourseHole,
  EventPlayer,
  GolfEvent,
  LeaderboardEntry,
  Score,
} from "@/lib/types";

import { totalStablefordPoints } from "@/lib/stableford";

export function buildLeaderboard(
  players: EventPlayer[],
  scores: Score[],
  currentUserId: string,
  courseHoles: CourseHole[] = [],
  scoringFormat: GolfEvent["scoring_format"] = "stableford",
): LeaderboardEntry[] {
  const parByHole = new Map<number, number>();

  for (const hole of courseHoles) {
    parByHole.set(hole.hole_number, hole.par);
  }

  const entries = players.map((player) => {
    const playerScores = scores.filter(
      (s) => s.event_player_id === player.id,
    );

    const totalStrokes = playerScores.reduce(
      (sum, s) => sum + s.strokes,
      0,
    );

    const totalPar = playerScores.reduce(
      (sum, s) => sum + (parByHole.get(s.hole_number) ?? 4),
      0,
    );

    return {
      playerId: player.id,
      displayName: player.display_name,
      userId: player.user_id,
      totalStrokes,
      holesPlayed: playerScores.length,
      totalPar,
      stablefordPoints: totalStablefordPoints(
        playerScores,
        courseHoles,
        player.playing_handicap,
      ),
      isCurrentUser: player.user_id === currentUserId,
    };
  });

  return entries.sort((a, b) => {
    if (scoringFormat === "stableford") {
      return b.stablefordPoints - a.stablefordPoints;
    }

    return a.totalStrokes - b.totalStrokes;
  });
}