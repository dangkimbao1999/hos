import { notFound } from "next/navigation";
import { TalentDetailContent } from "@/components/talent-detail/talent-detail-content";
import { getTalentBySlug, listPackagesForTalent } from "@/lib/supabase/packages";
import { getTalentReviewSummary } from "@/lib/supabase/reviews";

export default async function TalentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const talent = await getTalentBySlug(slug);
  if (!talent) notFound();

  const [packages, reviewSummary] = await Promise.all([
    listPackagesForTalent(talent.id),
    getTalentReviewSummary(talent.id),
  ]);

  return <TalentDetailContent talent={talent} packages={packages} reviewSummary={reviewSummary} />;
}
