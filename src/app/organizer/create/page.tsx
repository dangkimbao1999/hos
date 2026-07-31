"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { talentCategories } from "@/lib/nav-items";

const STEPS = ["Event Details", "Add Photos", "Review & Budget"] as const;
type Step = (typeof STEPS)[number];

function Field({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Input id={id} className="h-11 rounded-[6px]" {...props} />
    </div>
  );
}

export default function CreateEventPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [eventName, setEventName] = useState("");
  const [photos, setPhotos] = useState<number[]>([]);

  const step: Step = STEPS[stepIndex];

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDone(true);
  }

  function addPhoto() {
    setPhotos((p) => (p.length < 3 ? [...p, p.length] : p));
  }
  function removePhoto(index: number) {
    setPhotos((p) => p.filter((i) => i !== index));
  }

  if (done) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="flex w-full max-w-[460px] flex-col items-center gap-5 rounded-md bg-white/5 p-10 text-center">
          <CheckCircle2 className="size-12 text-green-500" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
              Event Created!
            </h1>
            <p className="text-sm text-muted-foreground">
              {eventName || "Your event"} is now live. You can start browsing talent to book.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <Button asChild className="h-11 w-full rounded-[6px]">
              <Link href="/organizer/discover">Find Talents</Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 w-full rounded-[6px]">
              <Link href="/organizer/account/events">View My Events</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground">Create new Event</h1>

      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                i <= stepIndex ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-10 bg-border" />}
          </div>
        ))}
      </div>

      <div className="max-w-[640px] rounded-md bg-white/5 p-8">
        {step === "Event Details" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="flex flex-col gap-5"
          >
            <Field
              label="Event Name"
              placeholder="Summer Music Festival"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-sm text-muted-foreground">
                Category
              </Label>
              <select
                id="category"
                required
                className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue=""
              >
                <option value="" disabled>
                  Select talent category
                </option>
                {talentCategories.map((c) => (
                  <option key={c.label} value={c.label} className="bg-background">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" type="date" required />
              <Field label="Time" type="time" required />
            </div>
            <Field label="Venue / Address" placeholder="ABC Dance Zone, HCMC" required />
            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-sm text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                rows={4}
                className="rounded-[6px]"
                placeholder="Tell talents what to expect from your event"
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-[6px]">
              Next Step
            </Button>
          </form>
        )}

        {step === "Add Photos" && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Add Photos</h2>
              <p className="text-sm text-muted-foreground">Add up to 3 photos of your venue or event</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => {
                const filled = photos.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => (filled ? removePhoto(i) : addPhoto())}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed text-muted-foreground transition-colors",
                      filled
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-white/15 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {filled ? (
                      <>
                        <ImagePlus className="size-6" />
                        <span className="text-xs">Photo {i + 1}</span>
                        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-black/60">
                          <X className="size-3" />
                        </span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="size-6" />
                        <span className="text-xs">Add Photo</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={back} className="h-11 flex-1 rounded-[6px]">
                Back
              </Button>
              <Button type="button" onClick={next} className="h-11 flex-1 rounded-[6px]">
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === "Review & Budget" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget Min (VND)" type="number" placeholder="10,000,000" required />
              <Field label="Budget Max (VND)" type="number" placeholder="50,000,000" required />
            </div>
            <Field label="Expected Guests" type="number" placeholder="200" />
            <div className="flex flex-col gap-2">
              <Label htmlFor="requirements" className="text-sm text-muted-foreground">
                Special Requirements
              </Label>
              <Textarea
                id="requirements"
                rows={3}
                className="rounded-[6px]"
                placeholder="Sound system provided, parking available, etc."
              />
            </div>

            <div className="flex flex-col gap-1 rounded-[8px] bg-white/5 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event</span>
                <span className="font-medium text-foreground">{eventName || "Untitled Event"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photos</span>
                <span className="font-medium text-foreground">{photos.length} added</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={back} className="h-11 flex-1 rounded-[6px]">
                Back
              </Button>
              <Button type="submit" className="h-11 flex-1 rounded-[6px]">
                Create Event
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

