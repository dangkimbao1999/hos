import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { KycStatus } from "@/lib/supabase/types";
import type { Role } from "@/lib/nav-items";

const COPY: Record<Exclude<KycStatus, "verified">, string> = {
  unverified: "Complete KYC verification to create, apply, or book.",
  pending: "Your KYC verification is under review — you can browse while you wait.",
  rejected: "Your KYC verification was rejected. Resubmit to unlock all features.",
};

export function KycBanner({ role, status }: { role: Role; status: KycStatus }) {
  if (status === "verified") return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-500/10 px-8 py-3 text-sm text-amber-400">
      <span className="flex items-center gap-2">
        <ShieldAlert className="size-4 shrink-0" />
        {COPY[status]}
      </span>
      {status !== "pending" && (
        <Link href={`/${role}/kyc`} className="shrink-0 font-semibold underline">
          {status === "rejected" ? "Resubmit" : "Verify Now"}
        </Link>
      )}
    </div>
  );
}
