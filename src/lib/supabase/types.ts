import type { Role } from "@/lib/nav-items";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

/** Profile row plus the auth email, which lives on auth.users, not profiles. */
export interface CurrentUser extends Profile {
  email: string;
}
