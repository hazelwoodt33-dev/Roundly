import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLeaderboard } from "@/lib/leaderboard";
import { formatScoreToPar } from "@/lib/utils";
import type { CourseHole, EventPlayer, GolfEvent, Score } from "@/lib/types";

type DisplayPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DisplayPage({ params }: DisplayPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const golfEvent = event as GolfEvent;

  if (golfEvent.created_by !== user.id) {
    notFound();
  }

  const { data: players } = await supabase
    .from("event_players")
    .select("*")
    .eq("event_id", id)
    .order("joined_at", { ascending: true });

  const playerList = (players ?? []) as EventPlayer[];
  const playerIds = playerList.map((p) => p.id);

  let scoreList: Score[] = [];

  if (playerIds.length > 0) {
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .in("event_player_id", playerIds);

    scoreList = (scores ?? []) as Score[];
  }

  let courseHoles: CourseHole[] = [];

  if (golfEvent.course_id) {
    const { data: holes } = await supabase
      .from("course_holes")
      .select("*")
      .eq("course_id", golfEvent.course_id)
      .order("hole_number", { ascending: true });

    courseHoles = (holes ?? []) as CourseHole[];
  }

  const leaderboard = buildLeaderboard(
    playerList,
    scoreList,
    user.id,
    courseHoles,
    golfEvent.scoring_format ?? "stableford",
  );

  return (
    <main className="min-h-screen bg-fairway-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xl uppercase tracking-widest text-fairway-300">
              Roundly
            </p>

            <h1 className="mt-2 text-6xl font-black">
              {golfEvent.title}
            </h1>

            <p className="mt-3 text-2xl text-fairway-200">
              {golfEvent.course} ·{" "}
              {golfEvent.scoring_format === "stableford"
                ? "Stableford"
                : "Stroke play"}
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 px-8 py-5 text-right">
            <p className="text-sm uppercase tracking-widest text-fairway-300">
              Invite code
            </p>

            <p className="font-mono text-5xl font-black">
              {golfEvent.invite_code}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 text-fairway-950">
          <div className="grid grid-cols-[80px_1fr_180px_180px_160px] border-b border-fairway-100 px-4 py-4 text-xl font-bold uppercase tracking-wide text-fairway-500">
            <div>#</div>
            <div>Player</div>
            <div className="text-right">Holes</div>
            <div className="text-right">
              {golfEvent.scoring_format === "stableford" ? "Points" : "Strokes"}
            </div>
            <div className="text-right">To par</div>
          </div>

          <div>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.playerId}
                className="grid grid-cols-[80px_1fr_180px_180px_160px] items-center border-b border-fairway-100 px-4 py-5 text-3xl last:border-b-0"
              >
                <div className="font-black text-fairway-500">
                  {index + 1}
                </div>

                <div className="font-black">
                  {entry.displayName}
                </div>

                <div className="text-right text-2xl font-bold text-fairway-600">
                  {entry.holesPlayed}/18
                </div>

                <div className="text-right text-4xl font-black text-fairway-800">
                  {golfEvent.scoring_format === "stableford"
                    ? entry.stablefordPoints
                    : entry.totalStrokes}
                </div>

                <div className="text-right text-2xl font-bold text-fairway-600">
                  {entry.holesPlayed > 0
                    ? formatScoreToPar(entry.totalStrokes, entry.totalPar)
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}