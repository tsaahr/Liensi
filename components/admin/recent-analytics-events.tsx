"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export type RecentAnalyticsEventItem = {
  id: string;
  title: string;
  timestamp: string;
  detail: string;
};

type RecentAnalyticsEventsProps = {
  events: RecentAnalyticsEventItem[];
};

const initialVisibleEvents = 8;
const visibleEventsStep = 8;

export function RecentAnalyticsEvents({ events }: RecentAnalyticsEventsProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleEvents);
  const visibleEvents = events.slice(0, visibleCount);
  const hasMoreEvents = visibleCount < events.length;

  if (events.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {visibleEvents.map((event) => (
          <div key={event.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{event.title}</span>
              <span className="text-xs text-muted-foreground">{event.timestamp}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
          </div>
        ))}
      </div>

      {hasMoreEvents ? (
        <div className="flex flex-col items-center gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Mostrando {visibleEvents.length} de {events.length} eventos recentes.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVisibleCount((currentCount) =>
                Math.min(currentCount + visibleEventsStep, events.length)
              )
            }
          >
            Ver mais
          </Button>
        </div>
      ) : null}
    </>
  );
}
