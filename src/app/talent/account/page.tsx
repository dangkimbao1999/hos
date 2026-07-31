import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileContent } from "@/components/account/profile-content";

export default function TalentProfilePage() {
  return (
    <AppShell role="talent">
      <AccountShell role="talent">
        <ProfileContent role="talent" />
      </AccountShell>
    </AppShell>
  );
}
