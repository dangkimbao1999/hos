import { CreateEventForm } from "@/app/organizer/create/create-event-form";
import { listCategories } from "@/lib/supabase/lookups";

export default async function CreateEventPage() {
  const categories = await listCategories();
  return <CreateEventForm categories={categories} />;
}
