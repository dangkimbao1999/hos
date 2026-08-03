"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Camera, ImageIcon, KeyRound, Plus, ShieldCheck, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { talentCategories, type Role } from "@/lib/nav-items";
import { updateProfile } from "@/lib/supabase/profile-actions";
import { uploadAvatar } from "@/lib/supabase/storage-actions";
import type { CurrentUser } from "@/lib/supabase/types";

function Field({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Input id={id} className="h-11 rounded-[6px]" {...props} />
    </div>
  );
}

export function ProfileContent({ role, profile }: { role: Role; profile: CurrentUser }) {
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>(profile.keywords ?? []);
  const [keywordInput, setKeywordInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(undefined);
    setAvatarPending(true);
    const formData = new FormData();
    formData.set("avatar", file);
    const result = await uploadAvatar(formData);
    setAvatarPending(false);
    if ("error" in result) setAvatarError(result.error);
    else {
      setAvatarUrl(result.url);
      router.refresh();
    }
    e.target.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("keywords", JSON.stringify(keywords));
    const result = await updateProfile(formData);
    setPending(false);
    if ("error" in result) setError(result.error);
    else setSaved(true);
  }

  function addKeyword() {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) setKeywords((k) => [...k, trimmed]);
    setKeywordInput("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-sm text-destructive">{error}</span>}
        {saved && !error && <span className="text-sm text-muted-foreground">Saved.</span>}
        <Button asChild type="button" variant="secondary" className="h-9 rounded-[6px]">
          <Link href={`/${role}/kyc`}>
            <ShieldCheck className="size-4" />
            KYC Verification
          </Link>
        </Button>
        <Button type="button" variant="secondary" className="h-9 rounded-[6px]">
          <KeyRound className="size-4" />
          Change your Password
        </Button>
        <Button type="submit" disabled={pending} className="h-9 rounded-[6px]">
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md bg-white/5">
        <div className="relative flex h-[120px] items-center justify-center bg-white/10 text-muted-foreground">
          <ImageIcon className="size-8" />
        </div>
        <div className="flex items-center gap-4 px-6 pb-6">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarPending}
            className="group relative -mt-8 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-white/10 text-muted-foreground"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-6" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <div className="flex flex-col pt-2">
            <span className="text-lg font-bold text-foreground">{profile.full_name || "Your Account"}</span>
            <span className="text-sm text-muted-foreground">
              {avatarPending
                ? "Uploading..."
                : avatarError
                  ? avatarError
                  : "Manage your profile information, password and more"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-md bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Display Name" name="fullName" defaultValue={profile.full_name} required />
          <Field label="Email" type="email" defaultValue={profile.email} disabled />
          <Field label="Phone number" type="tel" defaultValue="+84 90 123 4567" />
          <Field label="District" defaultValue="District 1" />
          <Field label="City/Province" name="location" defaultValue={profile.location ?? ""} />
          {role === "talent" && (
            <>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Category</Label>
                <select
                  defaultValue="Solo Singer"
                  className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {talentCategories.map((c) => (
                    <option key={c.label} value={c.label} className="bg-background">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Sub-Category</Label>
                <select
                  defaultValue="Rapper"
                  className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {["Rapper", "Ballad", "RnB", "Bolero"].map((s) => (
                    <option key={s} value={s} className="bg-background">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-md bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Bio</h2>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground">Description</Label>
          <Textarea rows={3} name="bio" className="rounded-[6px]" defaultValue={profile.bio ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground">Thumbnail Image</Label>
          <div className="grid grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-[8px] bg-white/10 text-muted-foreground"
              >
                <ImageIcon className="size-5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {role === "talent" ? (
        <>
          <div className="flex flex-col gap-4 rounded-md bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-foreground">Keyword</h2>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-foreground"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => setKeywords((k) => k.filter((x) => x !== kw))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex w-fit items-center gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="e.g. AcousticSet"
                className="h-9 w-48 rounded-[6px] text-xs"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="flex shrink-0 items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10"
              >
                <Plus className="size-3.5" /> Add Keyword
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-md bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-foreground">Achievement</h2>
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <select className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-muted-foreground outline-none">
                <option>Soundcloud</option>
                <option>Spotify</option>
                <option>YouTube</option>
              </select>
              <Input placeholder="Achievement" className="h-11 rounded-[6px]" />
            </div>
            <button type="button" className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10">
              <Plus className="size-3.5" /> Add Achievement
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4 rounded-md bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-foreground">Social Profile</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <select className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-muted-foreground outline-none">
                <option>Soundcloud</option>
                <option>Spotify</option>
              </select>
              <Input placeholder="https://soundcloud.com/..." className="h-11 rounded-[6px]" />
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <select className="h-11 rounded-[6px] border border-input bg-transparent px-3 text-sm text-muted-foreground outline-none">
                <option>Instagram</option>
                <option>Facebook</option>
              </select>
              <Input placeholder="Add your instagram link" className="h-11 rounded-[6px]" />
            </div>
          </div>
          <button type="button" className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10">
            <Plus className="size-3.5" /> Add Social Link
          </button>
        </div>
      )}
    </form>
  );
}
