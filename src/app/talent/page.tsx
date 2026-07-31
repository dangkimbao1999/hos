import { AppShell } from "@/components/shell/app-shell";
import { EventHomeContent } from "@/components/shell/event-home-content";

export default function TalentHomePage() {
  return (
    <AppShell role="talent">
      <EventHomeContent role="talent" />
    </AppShell>
  );
}
