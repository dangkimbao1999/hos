import { AccountShell } from "@/components/account/account-shell";
import { BillingContent } from "@/components/account/billing-content";
import { listBillingData } from "@/lib/supabase/billing";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function TalentBillingPage() {
  const profile = await getCurrentProfile();
  const { summary, groups } = profile
    ? await listBillingData(profile.id, "talent")
    : { summary: undefined, groups: undefined };

  return (
    <AccountShell role="talent">
      <BillingContent role="talent" summary={summary} groups={groups} />
    </AccountShell>
  );
}
