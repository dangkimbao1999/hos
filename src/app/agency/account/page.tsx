import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileContent } from "@/components/account/profile-content";

export default function AgencyProfilePage() {
  return (
    <AppShell role="agency">
      <AccountShell role="agency">
        <ProfileContent role="agency" />
      </AccountShell>
    </AppShell>
  );
}
