import { AccountShell } from "@/components/account/account-shell";
import { ProfileContent } from "@/components/account/profile-content";
import { listCategories, listCities, listGenres } from "@/lib/supabase/lookups";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function OrganizerProfilePage() {
  const [profile, categories, cities, genres] = await Promise.all([
    getCurrentProfile(),
    listCategories(),
    listCities(),
    listGenres(),
  ]);

  return (
    <AccountShell role="organizer">
      <ProfileContent
        role="organizer"
        profile={profile!}
        categories={categories}
        cities={cities}
        genres={genres}
      />
    </AccountShell>
  );
}
