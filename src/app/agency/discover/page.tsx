import { AppShell } from "@/components/shell/app-shell";
import { EventDiscoverContent } from "@/components/shell/event-discover-content";

export default function AgencyDiscoverPage() {
  return (
    <AppShell role="agency">
      <EventDiscoverContent role="agency" />
    </AppShell>
  );
}
