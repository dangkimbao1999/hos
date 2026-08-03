import { AccountShell } from "@/components/account/account-shell";
import { QuotationsContent } from "@/components/account/quotations-content";
import { listQuotationsForOrganizer } from "@/lib/supabase/quotations";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerQuotationsPage() {
  const profile = await getCurrentProfile();
  const quotations = profile ? await listQuotationsForOrganizer(profile.id) : [];

  return (
    <AccountShell role="organizer">
      <QuotationsContent role="organizer" quotations={quotations} />
    </AccountShell>
  );
}
