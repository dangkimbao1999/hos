import { AppShell } from "@/components/shell/app-shell";
import { EventHomeContent } from "@/components/shell/event-home-content";

export default function AgencyHomePage() {
  return (
    <AppShell role="agency">
      <EventHomeContent role="agency" />
    </AppShell>
  );
}
