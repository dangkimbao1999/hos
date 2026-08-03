-- KYC ID/selfie uploads need private storage: only the uploader can read/write
-- their own files, and reviewers (service_role/postgres, per the same "direct
-- DB review" model as kyc_submissions itself) can read everything.
insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false);

create policy "Users can upload their own KYC documents"
  on storage.objects for insert
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can view their own KYC documents"
  on storage.objects for select
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own KYC documents"
  on storage.objects for delete
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
