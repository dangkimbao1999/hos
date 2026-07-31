import { AppShell } from "@/components/shell/app-shell";
import { KycWizard } from "@/components/kyc/kyc-wizard";

export default function AgencyKycPage() {
  return (
    <AppShell role="agency">
      <KycWizard role="agency" />
    </AppShell>
  );
}
