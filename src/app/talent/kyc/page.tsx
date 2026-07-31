import { AppShell } from "@/components/shell/app-shell";
import { KycWizard } from "@/components/kyc/kyc-wizard";

export default function TalentKycPage() {
  return (
    <AppShell role="talent">
      <KycWizard role="talent" />
    </AppShell>
  );
}
