import Link from "next/link";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { GolfEvent } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  const eventList = (events ?? []) as GolfEvent[];

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6 pb-28">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-fairway-950">
            Dashboard
          </h2>
          <p className="mt-1 text-fairway-600">Your golf events</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3">
          <Link href="/events/new" className="btn-primary text-sm">
            Create event
          </Link>
          <Link href="/events/join" className="btn-secondary text-sm">
            Join event
          </Link>
        </div>

        {eventList.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <h3 className="text-lg font-bold text-fairway-900">No events yet</h3>
            <p className="mt-2 max-w-xs text-sm text-fairway-600">
              Create an event or join one with an invite code.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fairway-500">
              Your events
            </h3>
            {eventList.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="card block transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-lg font-bold text-fairway-900">
                      {event.title}
                    </h4>
                    <p className="mt-0.5 text-sm text-fairway-600">{event.course}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-fairway-500">
                      {formatDate(event.event_date)}
                    </p>
                    <span className="mt-1 inline-block rounded-lg bg-fairway-100 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-fairway-700">
                      {event.invite_code}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
