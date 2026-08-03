-- Freeform self-tagging keywords, shown on the talent's profile/discover
-- card and used to filter Discover (replacing the mock keyword chips).
alter table public.profiles add column keywords text[] not null default '{}';
