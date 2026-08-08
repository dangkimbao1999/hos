import { notFound } from "next/navigation";
import { TalentDetailContent } from "@/components/talent-detail/talent-detail-content";
import { listCities } from "@/lib/supabase/lookups";
import {
  getTalentBySlug,
  listPackagesForTalentWithNames,
  listRelatedPackagesForTalent,
  listTalentBusySlots,
} from "@/lib/supabase/packages";
import { getTalentReviewSummary } from "@/lib/supabase/reviews";

export default async function TalentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const talent = await getTalentBySlug(slug);
  if (!talent) notFound();

  const [packages, reviewSummary, cities, busySlots] = await Promise.all([
    listPackagesForTalentWithNames(talent.id),
    getTalentReviewSummary(talent.id),
    listCities(),
    listTalentBusySlots(talent.id),
  ]);
  const relatedPackages = await listRelatedPackagesForTalent(
    talent.id,
    [...new Set(packages.map((pkg) => pkg.category_name))],
    talent.genre_name,
    10
  );

  return (
    <TalentDetailContent
      talent={talent}
      packages={packages}
      relatedPackages={relatedPackages}
      reviewSummary={reviewSummary}
      cities={cities}
      busySlots={busySlots}
    />
  );
}
