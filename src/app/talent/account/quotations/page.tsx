import { AccountShell } from "@/components/account/account-shell";
import { QuotationsContent } from "@/components/account/quotations-content";
import { listQuotationsForTalent } from "@/lib/supabase/quotations";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentQuotationsPage() {
  const profile = await getCurrentProfile();
  const quotations = profile ? await listQuotationsForTalent(profile.id) : [];

  return (
    <AccountShell role="talent">
      <QuotationsContent role="talent" quotations={quotations} />
    </AccountShell>
  );
}
