import { EventHomeContent } from "@/components/shell/event-home-content";
import { AutoOpenCreatePackageDialog } from "@/components/create-package/auto-open-dialog";

export default function AgencyCreatePackagePage() {
  return (
    <>
      <EventHomeContent role="agency" />
      <AutoOpenCreatePackageDialog role="agency" />
    </>
  );
}
