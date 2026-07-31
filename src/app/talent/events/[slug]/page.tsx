import { AppShell } from "@/components/shell/app-shell";
import { EventDetailContent } from "@/components/event-detail/event-detail-content";

export default function TalentEventDetailPage() {
  return (
    <AppShell role="talent">
      <EventDetailContent role="talent" />
    </AppShell>
  );
}
