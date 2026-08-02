"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ScheduleEntry } from "@/lib/supabase/schedule";

const FIRST_HOUR = 8;
const LAST_HOUR = 23;
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 36;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatHour(hour: number) {
  const h = hour % 24;
  const wholeHour = Math.floor(h);
  const minutes = Math.round((h - wholeHour) * 60);
  const period = wholeHour < 12 ? "AM" : "PM";
  const displayHour = wholeHour % 12 === 0 ? 12 : wholeHour % 12;
  return minutes === 0 ? `${displayHour}${period}` : `${displayHour}:${String(minutes).padStart(2, "0")}${period}`;
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ScheduleContent({ entries }: { entries: ScheduleEntry[] }) {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label: WEEKDAY_LABELS[i], date: d.getDate(), iso: toIsoDate(d) };
  });

  const weekEvents = weekDays.flatMap((day, dayIndex) =>
    entries.filter((e) => e.date === day.iso).map((e) => ({ ...e, dayIndex }))
  );

  const year = today.getFullYear();
  const month = today.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const gridHeight = HOURS.length * ROW_HEIGHT;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4 rounded-md bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-foreground">Schedule - This Week</h2>
        <div className="overflow-x-auto">
          <div className="relative min-w-[680px]" style={{ paddingLeft: 56 }}>
            {/* Day headers */}
            <div className="flex" style={{ height: HEADER_HEIGHT }}>
              {weekDays.map((day) => (
                <div
                  key={day.label}
                  className="flex flex-1 items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day.label} {day.date}
                </div>
              ))}
            </div>

            {/* Grid body: hour labels (absolutely placed to the left) + row lines + day column dividers */}
            <div className="relative" style={{ height: gridHeight }}>
              <div
                className="absolute top-0 left-[-56px] flex w-14 flex-col text-right"
                aria-hidden
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="shrink-0 pr-2 text-xs text-muted-foreground"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {formatHour(hour)}
                  </div>
                ))}
              </div>

              {/* horizontal hour lines */}
              {HOURS.map((hour, i) => (
                <div
                  key={hour}
                  className="absolute right-0 left-0 border-t border-border"
                  style={{ top: i * ROW_HEIGHT }}
                />
              ))}

              {/* vertical day dividers */}
              <div className="absolute inset-0 flex">
                {weekDays.map((day) => (
                  <div key={day.label} className="flex-1 border-l border-border first:border-l-0" />
                ))}
              </div>

              {/* event blocks */}
              {weekEvents.map((event, i) => {
                const top = (event.startHour - FIRST_HOUR) * ROW_HEIGHT;
                const height = (event.endHour - event.startHour) * ROW_HEIGHT;
                return (
                  <div
                    key={i}
                    className="absolute overflow-hidden rounded-[6px] bg-primary p-2 text-xs text-primary-foreground shadow-sm"
                    style={{
                      top: top + 2,
                      height: height - 4,
                      left: `calc(${event.dayIndex} * (100% / 7) + 4px)`,
                      width: `calc(100% / 7 - 8px)`,
                    }}
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="opacity-80">
                      {formatHour(event.startHour)} - {formatHour(event.endHour)}
                    </p>
                    <p className="opacity-70">{event.venue}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-md bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {MONTH_LABELS[month]} {year}
            </span>
            <div className="flex items-center gap-2">
              <button className="flex size-6 items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:bg-white/10">
                <ChevronLeft className="size-3.5" />
              </button>
              <button className="flex size-6 items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:bg-white/10">
                <ChevronRight className="size-3.5" />
              </button>
              <button className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-foreground hover:bg-white/10">
                Today
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d} className="text-muted-foreground">
                {d}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {monthDays.map((d) => (
              <span
                key={d}
                className={
                  d === today.getDate()
                    ? "mx-auto flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : "text-foreground"
                }
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Upcoming Events</h3>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No confirmed engagements yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-white/5 p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{entry.title}</span>
                    <span className="text-xs text-muted-foreground">{entry.venue}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
