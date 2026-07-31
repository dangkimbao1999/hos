"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
// July 2023: 1st falls on Saturday -> 5 leading days from June, grid starts Mon 26 Jun.
const CALENDAR_DAYS = [
  26, 27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5,
];
const CURRENT_MONTH_START_INDEX = 5;
const CURRENT_MONTH_END_INDEX = 35;

export function TimeRangeFilter() {
  const [selected, setSelected] = useState<{ start: number; end: number | null }>({
    start: 13,
    end: null,
  });
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function handleDayClick(index: number) {
    if (selected.end !== null || index < selected.start) {
      setSelected({ start: index, end: null });
    } else {
      setSelected((s) => ({ ...s, end: index }));
    }
  }

  const label = selected.end !== null ? "Custom Range" : "All Time";

  return (
    <Popover>
      <PopoverTrigger className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-4 py-2.5 text-sm text-foreground outline-none transition-colors hover:bg-white/10">
        <span className="text-muted-foreground">Time</span>
        <span className="font-medium">{label}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[380px]" align="start">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button type="button" className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-white/5">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-base font-bold text-foreground">July 2023</span>
            <button type="button" className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-white/5">
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10 rounded-[6px]"
            />
            <Input
              placeholder="End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-10 rounded-[6px]"
            />
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
            {WEEKDAY_LABELS.map((d, i) => (
              <span key={i} className="text-xs text-muted-foreground">
                {d}
              </span>
            ))}
            {CALENDAR_DAYS.map((day, index) => {
              const inCurrentMonth = index >= CURRENT_MONTH_START_INDEX && index < CURRENT_MONTH_END_INDEX;
              const inRange =
                selected.end !== null && index >= selected.start && index <= selected.end;
              const isEndpoint = index === selected.start || index === selected.end;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDayClick(index)}
                  className={cn(
                    "mx-auto flex size-7 items-center justify-center rounded-full transition-colors",
                    inCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                    inRange && "bg-primary/20",
                    isEndpoint && "bg-primary text-primary-foreground"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
