import { AppShell } from "@/components/shell/app-shell";
import { KycWizard } from "@/components/kyc/kyc-wizard";

export default function OrganizerKycPage() {
  return (
    <AppShell role="organizer">
      <KycWizard role="organizer" />
    </AppShell>
  );
}
