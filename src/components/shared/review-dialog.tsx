"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/lib/supabase/review-actions";
import { cn } from "@/lib/utils";

export function ReviewDialog({
  open,
  onOpenChange,
  sourceType,
  sourceId,
  talentName,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: "booking" | "application";
  sourceId: string;
  talentName: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit() {
    setError(undefined);
    setPending(true);
    const formData = new FormData();
    formData.set("sourceType", sourceType);
    formData.set("sourceId", sourceId);
    formData.set("rating", String(rating));
    formData.set("comment", comment);
    const result = await submitReview(formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSubmitted();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Rate {talentName}</DialogTitle>
          <DialogDescription>Share how the engagement went</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`}>
              <Star
                className={cn(
                  "size-8 transition-colors",
                  star <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment"
          rows={3}
          className="rounded-[6px]"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSubmit} disabled={pending} className="h-11 w-full rounded-[6px]">
          {pending ? "Submitting..." : "Submit Review"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
