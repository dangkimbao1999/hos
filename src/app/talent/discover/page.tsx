import { AppShell } from "@/components/shell/app-shell";
import { EventDiscoverContent } from "@/components/shell/event-discover-content";

export default function TalentDiscoverPage() {
  return (
    <AppShell role="talent">
      <EventDiscoverContent role="talent" />
    </AppShell>
  );
}
