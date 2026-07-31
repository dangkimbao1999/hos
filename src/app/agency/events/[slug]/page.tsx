import { AppShell } from "@/components/shell/app-shell";
import { EventDetailContent } from "@/components/event-detail/event-detail-content";

export default function AgencyEventDetailPage() {
  return (
    <AppShell role="agency">
      <EventDetailContent role="agency" />
    </AppShell>
  );
}
