import { EventHomeContent } from "@/components/shell/event-home-content";
import { AutoOpenCreatePackageDialog } from "@/components/create-package/auto-open-dialog";

export default function TalentCreatePackagePage() {
  return (
    <>
      <EventHomeContent role="talent" />
      <AutoOpenCreatePackageDialog role="talent" />
    </>
  );
}
