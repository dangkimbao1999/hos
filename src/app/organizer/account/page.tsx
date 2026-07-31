import { AppShell } from "@/components/shell/app-shell";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileContent } from "@/components/account/profile-content";

export default function OrganizerProfilePage() {
  return (
    <AppShell role="organizer">
      <AccountShell role="organizer">
        <ProfileContent role="organizer" />
      </AccountShell>
    </AppShell>
  );
}
