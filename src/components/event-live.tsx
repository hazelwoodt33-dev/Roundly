"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Leaderboard } from "@/components/leaderboard";
import { PlayersList } from "@/components/players-list";
import { ScoreEntry } from "@/components/score-entry";
import { ScoreStatus } from "@/components/score-status";
import type { CourseHole, EventPlayer, GolfEvent, Score } from "@/lib/types";

type EventLiveProps = {
  event: GolfEvent;
  initialPlayers: EventPlayer[];
  initialScores: Score[];
  courseHoles: CourseHole[];
  currentUserId: string;
  currentPlayerId: string;
};

type Panel =
  | "main"
  | "leaderboard"
  | "scorecard"
  | "players"
  | "handicap"
  | "organiser";

export function EventLive({
  event,
  initialPlayers,
  initialScores,
  courseHoles,
  currentUserId,
  currentPlayerId,
}: EventLiveProps) {
  const supabase = useMemo(() => createClient(), []);

  const [players, setPlayers] = useState(initialPlayers);
  const [scores, setScores] = useState(initialScores);
  const [live, setLive] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("main");

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isOrganiser = event.created_by === currentUserId;

  const [handicapInput, setHandicapInput] = useState(
    currentPlayer?.handicap_index?.toString() ?? "",
  );

  const playerIds = useMemo(() => players.map((p) => p.id), [players]);

  const fetchScores = useCallback(async () => {
    if (playerIds.length === 0) return;

    const { data } = await supabase
      .from("scores")
      .select("*")
      .in("event_player_id", playerIds);

    if (data) setScores(data as Score[]);
  }, [playerIds, supabase]);

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase
      .from("event_players")
      .select("*")
      .eq("event_id", event.id)
      .order("joined_at", { ascending: true });

    if (data) setPlayers(data as EventPlayer[]);
  }, [event.id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`event-${event.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        () => fetchScores(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_players",
          filter: `event_id=eq.${event.id}`,
        },
        () => fetchPlayers(),
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, fetchPlayers, fetchScores, supabase]);

  const myScores = scores.filter((s) => s.event_player_id === currentPlayerId);

  async function saveHandicap() {
    const value = Number(handicapInput);

    if (Number.isNaN(value)) return;

    const playingHandicap = Math.round(value * (123 / 113) + (70.4 - 70));

    const { error } = await supabase
      .from("event_players")
      .update({
        handicap_index: value,
        playing_handicap: playingHandicap,
      })
      .eq("id", currentPlayerId);

    if (error) {
      alert(error.message);
      return;
    }

    await fetchPlayers();
  }

  const menuItems: { panel: Panel; label: string; organiserOnly?: boolean }[] = [
    { panel: "main", label: "Score" },
    { panel: "leaderboard", label: "Leaderboard" },
    { panel: "scorecard", label: "Full scorecard" },
    { panel: "players", label: "Players" },
    { panel: "handicap", label: "Handicap" },
    { panel: "organiser", label: "Organiser", organiserOnly: true },
  ];

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-5 pb-10">
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-fairway-900">
              {event.title}
            </h2>

            <p className="mt-1 text-sm font-medium text-fairway-600">
              {event.course}
            </p>

            <p className="mt-2 text-xs text-fairway-500">
              {formatDate(event.event_date)} ·{" "}
              {event.scoring_format === "stableford"
                ? "Stableford"
                : "Stroke play"}
            </p>
          </div>

          <div className="rounded-2xl bg-fairway-100 px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-fairway-500">
              Code
            </p>

            <p className="font-mono text-lg font-bold tracking-widest text-fairway-800">
              {event.invite_code}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-fairway-500">
          <span
            className={`h-2 w-2 rounded-full ${
              live ? "animate-pulse bg-green-500" : "bg-fairway-300"
            }`}
          />
          {live ? "Live" : "Connecting…"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {menuItems
          .filter((item) => !item.organiserOnly || isOrganiser)
          .map((item) => (
            <button
              key={item.panel}
              type="button"
              onClick={() => setActivePanel(item.panel)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-95 ${
                activePanel === item.panel
                  ? "bg-fairway-700 text-white shadow-lg"
                  : "border border-fairway-100 bg-white text-fairway-700"
              } ${
                item.panel === "handicap" || item.panel === "organiser"
                  ? "col-span-2"
                  : ""
              }`}
            >
              {item.label}
            </button>
          ))}
      </div>

      {activePanel === "main" && (
        <ScoreEntry
          eventPlayerId={currentPlayerId}
          initialScores={myScores}
          courseHoles={courseHoles}
          compact
        />
      )}

      {activePanel === "scorecard" && (
        <ScoreEntry
          eventPlayerId={currentPlayerId}
          initialScores={myScores}
          courseHoles={courseHoles}
          compact={false}
        />
      )}

      {activePanel === "leaderboard" && (
        <>
          <Leaderboard
            players={players}
            scores={scores}
            currentUserId={currentUserId}
            courseHoles={courseHoles}
            scoringFormat={event.scoring_format ?? "stableford"}
          />

          <ScoreStatus
            players={players}
            scores={scores}
            currentUserId={currentUserId}
          />
        </>
      )}

      {activePanel === "players" && (
        <PlayersList players={players} currentUserId={currentUserId} />
      )}

      {activePanel === "handicap" && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-fairway-900">
            Your handicap
          </h2>

          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="16.3"
              value={handicapInput}
              onChange={(e) => setHandicapInput(e.target.value)}
            />

            <button type="button" className="btn-primary" onClick={saveHandicap}>
              Save
            </button>
          </div>

          {currentPlayer?.playing_handicap != null && (
            <p className="mt-3 text-sm text-fairway-500">
              Playing handicap: {currentPlayer.playing_handicap}
            </p>
          )}
        </div>
      )}

      {activePanel === "organiser" && isOrganiser && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-fairway-900">
            Organiser tools
          </h2>

          <p className="mb-4 text-sm text-fairway-500">
            Open a large-format live scoreboard for a TV, halfway hut, or
            clubhouse screen.
          </p>

          <a
            href={`/events/${event.id}/display`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary block text-center"
          >
            Open big scoreboard
          </a>
        </div>
      )}
    </main>
  );
}