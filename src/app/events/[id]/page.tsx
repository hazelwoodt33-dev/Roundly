import { notFound } from "next/navigation";
import { EventLive } from "@/components/event-live";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { defaultCourseHoles } from "@/lib/utils";
import type { CourseHole, EventPlayer, GolfEvent, Score } from "@/lib/types";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
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

  let { data: players } = await supabase
    .from("event_players")
    .select("*")
    .eq("event_id", id)
    .order("joined_at", { ascending: true });

  let playerList = (players ?? []) as EventPlayer[];
  let currentPlayer = playerList.find((p) => p.user_id === user.id);

  if (!currentPlayer) {
    const { error } = await supabase.rpc("join_event", {
      p_invite_code: golfEvent.invite_code,
    });

    if (error) notFound();

    const { data: refreshedPlayers } = await supabase
      .from("event_players")
      .select("*")
      .eq("event_id", id)
      .order("joined_at", { ascending: true });

    playerList = (refreshedPlayers ?? []) as EventPlayer[];
    currentPlayer = playerList.find((p) => p.user_id === user.id);

    if (!currentPlayer) notFound();
  }

  const playerIds = playerList.map((p) => p.id);
  let scoreList: Score[] = [];

  if (playerIds.length > 0) {
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .in("event_player_id", playerIds);

    scoreList = (scores ?? []) as Score[];
  }

  let courseHoles: CourseHole[] = defaultCourseHoles();

  if (golfEvent.course_id) {
    const { data: holes } = await supabase
      .from("course_holes")
      .select("*")
      .eq("course_id", golfEvent.course_id)
      .order("hole_number", { ascending: true });

    if (holes && holes.length > 0) {
      courseHoles = holes as CourseHole[];
    }
  }

  return (
    <div className="min-h-dvh">
      <Header title={golfEvent.title} showBack />

      <EventLive
        event={golfEvent}
        initialPlayers={playerList}
        initialScores={scoreList}
        courseHoles={courseHoles}
        currentUserId={user.id}
        currentPlayerId={currentPlayer.id}
      />
    </div>
  );
}