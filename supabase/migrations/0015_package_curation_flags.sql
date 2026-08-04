-- "Most Popular Talents" and "Editor Choice" on the organizer Home page are
-- manually curated by an admin — there's no admin portal yet, so this is
-- toggled directly via SQL (e.g. `update packages set is_most_popular = true
-- where id = '...'`) until one exists.
alter table public.packages add column is_most_popular boolean not null default false;
alter table public.packages add column is_editor_choice boolean not null default false;
