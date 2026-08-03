"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthCard } from "@/components/auth/auth-card";
import { DividerOr } from "@/components/auth/divider-or";
import { FormField } from "@/components/auth/form-field";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const result = await signIn(new FormData(e.currentTarget));
    setPending(false);
    if (result?.error) setError(result.error);
  }

  async function handleGoogleSignIn() {
    setError(undefined);
    setGooglePending(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGooglePending(false);
    }
    // On success the browser redirects to Google — no further client-side action needed.
  }

  return (
    <AuthCard
      title="Sign in to your account"
      description="Welcome back! Please enter your details."
      footer={
        <>
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/sign-up" className="text-primary underline">
            Sign Up
          </Link>
        </>
      }
    >
      <Button
        type="button"
        variant="secondary"
        className="h-[52px] w-full gap-2.5 rounded-[6px] text-base font-semibold"
        disabled={googlePending}
        onClick={handleGoogleSignIn}
      >
        <Image src="/icons/google.svg" alt="" width={24} height={24} />
        {googlePending ? "Redirecting..." : "Sign in with Google"}
      </Button>

      <DividerOr />

      <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-[22px]">
        <div className="flex w-full flex-col items-start gap-[18px]">
          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="test@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordField label="Password" name="password" placeholder="••••••••••" required error={error} />
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember-me" defaultChecked />
            <Label htmlFor="remember-me" className="text-sm font-medium text-muted-foreground">
              Remember me
            </Label>
          </div>
          <Link href="/forgot-password" className="text-sm font-medium text-muted-foreground">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" disabled={pending} className="h-[52px] w-full rounded-[6px] text-base font-semibold">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
