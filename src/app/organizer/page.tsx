import { AppShell } from "@/components/shell/app-shell";
import { HomeContent } from "@/components/shell/home-content";

export default function OrganizerHomePage() {
  return (
    <AppShell role="organizer">
      <HomeContent role="organizer" />
    </AppShell>
  );
}
