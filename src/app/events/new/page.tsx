"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/client";
import type { Course, CourseTee } from "@/lib/types";
import { generateInviteCode, getErrorMessage } from "@/lib/utils";

export default function NewEventPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teeId, setTeeId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [allTees, setAllTees] = useState<CourseTee[]>([]);
  const [scoringFormat, setScoringFormat] = useState<"stableford" | "strokeplay">("stableford");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const tees = allTees.filter((tee) => tee.course_id === courseId);

  useEffect(() => {
    async function loadData() {
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, name")
        .order("name");

      if (coursesError) {
        setError(coursesError.message);
        setLoadingData(false);
        return;
      }

      const { data: teesData, error: teesError } = await supabase
        .from("course_tees")
        .select("id, course_id, tee, course_rating, slope_rating")
        .order("tee");

      if (teesError) {
        setError(teesError.message);
        setLoadingData(false);
        return;
      }

      setCourses((coursesData ?? []) as Course[]);
      setAllTees((teesData ?? []) as CourseTee[]);
      setLoadingData(false);
    }

    loadData();
  }, [supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedCourse = courses.find((course) => course.id === courseId);
      const selectedTee = allTees.find((tee) => tee.id === teeId);

      if (!selectedCourse) throw new Error("Please select a course");
      if (!selectedTee) throw new Error("Please select a tee");

      const { data: eventId, error: createError } = await supabase.rpc("create_event", {
        p_title: title.trim(),
        p_course: selectedCourse.name,
        p_location: "",
        p_event_date: eventDate,
        p_invite_code: generateInviteCode(),
        p_course_id: courseId,
        p_course_tee_id: teeId,
        p_scoring_format: scoringFormat,
      });

      if (createError) throw createError;
      if (!eventId) throw new Error("Event was not created");

      router.push(`/events/${eventId}`);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create event"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <Header title="Create event" showBack />

      <main className="mx-auto max-w-lg px-4 py-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            className="input-field"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            required
            className="input-field"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setTeeId("");
            }}
          >
            <option value="">
              {loadingData ? "Loading courses…" : "Select course"}
            </option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            required
            className="input-field"
            value={teeId}
            disabled={!courseId || tees.length === 0}
            onChange={(e) => setTeeId(e.target.value)}
          >
            <option value="">
              {!courseId
                ? "Select a course first"
                : tees.length === 0
                  ? "No tees found for this course"
                  : "Select tee"}
            </option>

            {tees.map((tee) => (
              <option key={tee.id} value={tee.id}>
                {tee.tee}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={scoringFormat}
            onChange={(e) => setScoringFormat(e.target.value as "stableford" | "strokeplay")}
          >
            <option value="stableford">Stableford</option>
            <option value="strokeplay">Stroke play</option>
          </select>

          <input
            type="date"
            required
            className="input-field"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || loadingData || !courseId || !teeId}
            className="btn-primary"
          >
            {loading ? "Creating…" : "Create event"}
          </button>
        </form>
      </main>
    </div>
  );
}