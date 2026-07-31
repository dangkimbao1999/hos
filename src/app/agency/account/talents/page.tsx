import { AccountShell } from "@/components/account/account-shell";
import { TalentsContent } from "@/components/account/talents-content";

export default function AgencyTalentsPage() {
  return (
    <AccountShell role="agency">
      <TalentsContent />
    </AccountShell>
  );
}

