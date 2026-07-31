"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageIcon, KeyRound, Plus, ShieldCheck, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { talentCategories, type Role } from "@/lib/nav-items";

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

const roleConfig: Record<Role, { name: string; bio: string }> = {
  organizer: {
    name: "Dang Kim Bao",
    bio: "Event organizer booking live talent for festivals, clubs, and private events across Ho Chi Minh City.",
  },
  talent: {
    name: "A$AP Rocky",
    bio: "Performer available for festivals, clubs, and private bookings across Ho Chi Minh City.",
  },
  agency: {
    name: "420 Ent.",
    bio: "Talent agency representing a roster of performers for festivals, clubs, and private events.",
  },
};

export function ProfileContent({ role }: { role: Role }) {
  const config = roleConfig[role];
  const [keywords, setKeywords] = useState(["#A$APMob", "#Flacko", "#A$APRocky", "#PraiseTheLord", "#Rihanna"]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-3">
        <Button asChild variant="secondary" className="h-9 rounded-[6px]">
          <Link href={`/${role}/kyc`}>
            <ShieldCheck className="size-4" />
            KYC Verification
          </Link>
        </Button>
        <Button variant="secondary" className="h-9 rounded-[6px]">
          <KeyRound className="size-4" />
          Change your Password
        </Button>
        <Button className="h-9 rounded-[6px]">Save changes</Button>
      </div>

      <div className="overflow-hidden rounded-md bg-white/5">
        <div className="relative flex h-[120px] items-center justify-center bg-white/10 text-muted-foreground">
          <ImageIcon className="size-8" />
        </div>
        <div className="flex items-center gap-4 px-6 pb-6">
          <div className="-mt-8 flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-card bg-white/10 text-muted-foreground">
            <User className="size-6" />
          </div>
          <div className="flex flex-col pt-2">
            <span className="text-lg font-bold text-foreground">{config.name}</span>
            <span className="text-sm text-muted-foreground">
              Manage your profile information, password and more
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-md bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Display Name" defaultValue={config.name} />
          <Field label="Email" type="email" defaultValue="dangkimbao1999@gmail.com" />
          <Field label="Phone number" type="tel" defaultValue="+84 90 123 4567" />
          <Field label="District" defaultValue="District 1" />
          <Field label="City/Province" defaultValue="Ho Chi Minh City" />
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
          <Textarea rows={3} className="rounded-[6px]" defaultValue={config.bio} />
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
            <button className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10">
              <Plus className="size-3.5" /> Add Keyword
            </button>
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
            <button className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10">
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
          <button className="flex w-fit items-center gap-1 rounded-[6px] bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10">
            <Plus className="size-3.5" /> Add Social Link
          </button>
        </div>
      )}
    </div>
  );
}
