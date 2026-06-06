"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/lib/types";
import { generateInviteCode, getErrorMessage } from "@/lib/utils";

export default function NewEventPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [scoringFormat, setScoringFormat] = useState<
    "stableford" | "strokeplay"
  >("stableford");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      const { data, error: coursesError } = await supabase
        .from("courses")
        .select("id, name")
        .order("name");

      if (coursesError) {
        setError(coursesError.message);
      } else {
        setCourses((data ?? []) as Course[]);

        if (data?.length === 1) {
          setCourseId(data[0].id);
        }
      }

      setLoadingCourses(false);
    }

    loadCourses();
  }, [supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You must be signed in");

      const selectedCourse = courses.find((c) => c.id === courseId);

      if (!selectedCourse) {
        throw new Error("Please select a course");
      }

      const inviteCode = generateInviteCode();

      const { data: eventId, error: createError } = await supabase.rpc(
        "create_event",
        {
          p_title: title.trim(),
          p_course: selectedCourse.name,
          p_location: "",
          p_event_date: eventDate,
          p_invite_code: inviteCode,
          p_course_id: courseId,
          p_scoring_format: scoringFormat,
        },
      );

      if (createError) throw createError;
      if (!eventId) throw new Error("Event was not created. Please try again.");

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
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-semibold text-fairway-800"
            >
              Event title
            </label>

            <input
              id="title"
              required
              className="input-field"
              placeholder="Saturday Morning Round"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="course"
              className="mb-1.5 block text-sm font-semibold text-fairway-800"
            >
              Course
            </label>

            {loadingCourses ? (
              <p className="text-sm text-fairway-500">Loading courses…</p>
            ) : courses.length === 0 ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No courses found. Run the courses migration in Supabase SQL
                editor.
              </p>
            ) : (
              <select
                id="course"
                required
                className="input-field"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">Select a course</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label
              htmlFor="scoringFormat"
              className="mb-1.5 block text-sm font-semibold text-fairway-800"
            >
              Scoring format
            </label>

            <select
              id="scoringFormat"
              required
              className="input-field"
              value={scoringFormat}
              onChange={(e) =>
                setScoringFormat(
                  e.target.value as "stableford" | "strokeplay",
                )
              }
            >
              <option value="stableford">Stableford</option>
              <option value="strokeplay">Stroke play</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="eventDate"
              className="mb-1.5 block text-sm font-semibold text-fairway-800"
            >
              Date
            </label>

            <input
              id="eventDate"
              type="date"
              required
              className="input-field"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <p className="text-sm text-fairway-500">
            A 6-character invite code will be generated automatically when you
            create the event.
          </p>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading || loadingCourses || courses.length === 0 || !courseId
            }
            className="btn-primary"
          >
            {loading ? "Creating…" : "Create event"}
          </button>
        </form>
      </main>
    </div>
  );
}