"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestQuotation } from "@/lib/supabase/quotation-actions";
import { runAction } from "@/lib/toast-action";

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

export function RequestQuoteDialog({ talentId, talentName }: { talentId: string; talentName: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("talentId", talentId);
    const result = await runAction(requestQuotation(formData), { success: "Quote request sent." });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setSubmitted(false);
      setError(undefined);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => handleOpenChange(true)}
        className="h-[52px] w-full rounded-[6px] text-base font-semibold"
      >
        Request a Quote
      </Button>
      <DialogContent className="sm:max-w-[480px]">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <DialogHeader>
              <DialogTitle>Quote Requested!</DialogTitle>
              <DialogDescription>{talentName} will respond with a custom quote soon.</DialogDescription>
            </DialogHeader>
            <Button className="h-11 w-full rounded-[6px]" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a Quote from {talentName}</DialogTitle>
              <DialogDescription>Describe your event and {talentName} will send you a custom price.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Event Name" name="eventName" placeholder="Private Wedding Reception" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Event Date" name="eventDate" type="date" />
                <Field label="Venue" name="venue" placeholder="Riverside Palace, HCMC" />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Description</Label>
                <Textarea
                  name="description"
                  rows={3}
                  className="rounded-[6px]"
                  placeholder="Tell them what you need"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Budget Min (VND)" name="budgetMin" type="number" placeholder="5000000" />
                <Field label="Budget Max (VND)" name="budgetMax" type="number" placeholder="15000000" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={pending} className="h-11 w-full rounded-[6px]">
                {pending ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
