# Fairway Live

A mobile-first web app for live golf scoring. Create events, invite players with a code, enter hole-by-hole scores, and watch the leaderboard update in real time via Supabase.

## Features

- **Auth** — Sign up, sign in, sign out
- **Dashboard** — View your events, create or join
- **Events** — Title, course, date, auto-generated 6-char invite code
- **Join** — Enter invite code via `join_event()` RPC
- **Event detail** — Players list, score status, live leaderboard
- **Scorecard** — Holes 1–18, auto-save with upsert, realtime updates

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com) project

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Enable **Email** auth under Authentication → Providers.
3. Run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (or apply the migration with `supabase db push` from [`supabase/migrations/`](supabase/migrations/)).
4. Copy your project URL and anon key from Project Settings → API.

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Event list
│   ├── events/
│   │   ├── [id]/           # Leaderboard + score entry
│   │   ├── join/           # Join by invite code
│   │   └── new/            # Create event
│   ├── login/
│   └── signup/
├── components/             # UI components
└── lib/                    # Supabase clients, types, utils
```

## License

MIT
