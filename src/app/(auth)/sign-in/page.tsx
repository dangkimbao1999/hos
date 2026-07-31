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

export default function SignInPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (identifier.includes(" ")) {
      setError("*username must not have spaces");
      return;
    }
    setError(undefined);
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
      >
        <Image src="/icons/google.svg" alt="" width={24} height={24} />
        Sign in with Google
      </Button>

      <DividerOr />

      <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-[22px]">
        <div className="flex w-full flex-col items-start gap-[18px]">
          <FormField
            label="Email / username"
            placeholder="test@gmail.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={error}
          />
          <PasswordField label="Password" placeholder="••••••••••" />
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

        <Button type="submit" className="h-[52px] w-full rounded-[6px] text-base font-semibold">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
