import { AccountShell } from "@/components/account/account-shell";
import { QuotationsContent } from "@/components/account/quotations-content";
import { ACCOUNT_LIST_PAGE_SIZE, parsePageParam, totalPagesFor } from "@/lib/pagination";
import { listQuotationsForOrganizerPage } from "@/lib/supabase/quotations";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerQuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [profile, params] = await Promise.all([getCurrentProfile(), searchParams]);
  const page = parsePageParam(params.page);
  const { quotations, totalCount } = profile
    ? await listQuotationsForOrganizerPage(profile.id, page)
    : { quotations: [], totalCount: 0 };

  return (
    <AccountShell role="organizer">
      <QuotationsContent
        role="organizer"
        quotations={quotations}
        currentPage={page}
        totalPages={totalPagesFor(totalCount, ACCOUNT_LIST_PAGE_SIZE)}
      />
    </AccountShell>
  );
}
