"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { acceptApplication, rejectApplication } from "@/lib/supabase/event-actions";
import type { EventApplicationWithDetails } from "@/lib/supabase/types";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  accepted: "bg-green-500/10 text-green-500",
  rejected: "bg-white/10 text-muted-foreground",
};

export function EventApplicationsPanel({
  applications,
}: {
  applications: EventApplicationWithDetails[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  if (applications.length === 0) return null;

  async function handle(action: "accept" | "reject", id: string) {
    setError(undefined);
    setPendingId(id);
    const result = action === "accept" ? await acceptApplication(id) : await rejectApplication(id);
    setPendingId(undefined);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="w-full border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {applications.length} application{applications.length === 1 ? "" : "s"}
        {pendingCount > 0 && ` (${pendingCount} pending)`}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-white/5 p-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{app.applicant_name}</span>
                <span className="text-xs text-muted-foreground">
                  {app.slot_category}
                  {app.offer_amount_usd ? ` · Offered $${app.offer_amount_usd}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusStyles[app.status])}>
                  {app.status}
                </span>
                {app.status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={pendingId === app.id}
                      onClick={() => handle("reject", app.id)}
                      className="rounded-[6px] bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === app.id}
                      onClick={() => handle("accept", app.id)}
                      className="rounded-[6px] bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Accept
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
