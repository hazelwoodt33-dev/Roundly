export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
  handicap_index: number | null;
  profile_image_url: string | null;
  home_club: string | null;
};


export type Course = {
  id: string;
  name: string;
};

export type CourseTee = {
  id: string;
  course_id: string;
  tee: string;
  course_rating: number | null;
  slope_rating: number | null;
};

export type CourseHole = {
  id: string;
  course_id: string;
  course_tee_id: string | null;
  hole_number: number;
  yards: number | null;
  par: number;
  stroke_index: number;
};

export type GolfEvent = {
  id: string;
  title: string;
  course: string;
  event_date: string;
  invite_code: string;
  created_by: string;
  created_at: string;

  course_id: string | null;
  course_tee_id: string | null;

  scoring_format: "stableford" | "strokeplay";
};

export type EventPlayer = {
  id: string;
  event_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;

  handicap_index: number | null;
  playing_handicap: number | null;
};

export type Score = {
  id: string;
  event_player_id: string;
  hole_number: number;
  strokes: number;
  updated_at: string;
};

export type LeaderboardEntry = {
  playerId: string;
  displayName: string;
  userId: string;

  totalStrokes: number;
  holesPlayed: number;
  totalPar: number;

  stablefordPoints: number;

  isCurrentUser: boolean;
};