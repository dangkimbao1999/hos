import { createClient } from "@/lib/supabase/server";
import type { ReviewWithReviewer } from "@/lib/supabase/types";

export interface TalentReviewSummary {
  avgRating: number | null;
  count: number;
  reviews: ReviewWithReviewer[];
}

/** All reviews for a talent, joined with each reviewer's name, plus the aggregate rating — for the talent-detail page. */
export async function getTalentReviewSummary(talentId: string): Promise<TalentReviewSummary> {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });

  if (!reviews || reviews.length === 0) return { avgRating: null, count: 0, reviews: [] };

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const { data: reviewers } = await supabase.from("profiles").select("id, full_name").in("id", reviewerIds);
  const nameById = new Map((reviewers ?? []).map((p) => [p.id, p.full_name]));

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    avgRating,
    count: reviews.length,
    reviews: reviews.map((r) => ({ ...r, reviewer_name: nameById.get(r.reviewer_id) ?? "Organizer" })),
  };
}

/** Booking/application ids this organizer has already reviewed — to hide "Leave a Review" once done. */
export async function listReviewedSourceIds(
  organizerId: string
): Promise<{ bookingIds: Set<string>; applicationIds: Set<string> }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("booking_id, application_id")
    .eq("reviewer_id", organizerId);

  return {
    bookingIds: new Set((data ?? []).flatMap((r) => (r.booking_id ? [r.booking_id] : []))),
    applicationIds: new Set((data ?? []).flatMap((r) => (r.application_id ? [r.application_id] : []))),
  };
}
