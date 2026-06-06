import type { CourseHole } from "@/lib/types";

export function defaultCourseHoles(): CourseHole[] {
  return Array.from({ length: 18 }, (_, i) => ({
    id: `default-${i + 1}`,
    course_id: "",
    course_tee_id: null,
    hole_number: i + 1,
    yards: null,
    par: 4,
    stroke_index: i + 1,
  }));
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }
  return fallback;
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatScoreToPar(total: number, par = 72): string {
  const diff = total - par;
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
