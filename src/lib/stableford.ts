import type { CourseHole, Score } from "@/lib/types";

export function shotsOnHole(playingHandicap: number, strokeIndex: number): number {
  if (playingHandicap <= 0) return 0;

  const baseShots = Math.floor(playingHandicap / 18);
  const extraShots = playingHandicap % 18;

  return baseShots + (strokeIndex <= extraShots ? 1 : 0);
}

export function stablefordPoints(gross: number, par: number, shots: number): number {
  const net = gross - shots;
  const diff = net - par;

  if (diff <= -3) return 5;
  if (diff === -2) return 4;
  if (diff === -1) return 3;
  if (diff === 0) return 2;
  if (diff === 1) return 1;

  return 0;
}

export function totalStablefordPoints(
  scores: Score[],
  courseHoles: CourseHole[],
  playingHandicap: number | null,
): number {
  const handicap = playingHandicap ?? 0;

  return scores.reduce((total, score) => {
    const hole = courseHoles.find((h) => h.hole_number === score.hole_number);
    if (!hole) return total;

    const shots = shotsOnHole(handicap, hole.stroke_index);
    return total + stablefordPoints(score.strokes, hole.par, shots);
  }, 0);
}