-- Vietnam's 34 provincial-level units after the 2025 administrative merger
-- (6 centrally-governed cities + 28 provinces). 'HCM City', 'Hanoi', and
-- 'Da Nang' already exist from the initial static_lookups seed -- inserted
-- here again with ON CONFLICT DO NOTHING so this migration is safe to run
-- alongside that existing data without duplicating or touching their ids
-- (which are already referenced by profiles/packages).
insert into public.cities (name) values
  ('HCM City'),
  ('Hanoi'),
  ('Da Nang'),
  ('Hai Phong'),
  ('Hue'),
  ('Can Tho'),
  ('Cao Bang'),
  ('Dien Bien'),
  ('Ha Tinh'),
  ('Lai Chau'),
  ('Lang Son'),
  ('Nghe An'),
  ('Quang Ninh'),
  ('Thanh Hoa'),
  ('Son La'),
  ('Tuyen Quang'),
  ('Lao Cai'),
  ('Thai Nguyen'),
  ('Phu Tho'),
  ('Bac Ninh'),
  ('Hung Yen'),
  ('Ninh Binh'),
  ('Quang Tri'),
  ('Quang Ngai'),
  ('Gia Lai'),
  ('Khanh Hoa'),
  ('Lam Dong'),
  ('Dak Lak'),
  ('Dong Nai'),
  ('Tay Ninh'),
  ('Vinh Long'),
  ('Dong Thap'),
  ('Ca Mau'),
  ('An Giang')
on conflict (name) do nothing;
