"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";

type Step = "request" | "reset" | "success";

const BACK_TO_SIGN_IN = (
  <>
    <span className="text-muted-foreground">Remember your password? Back to </span>
    <Link href="/sign-in" className="text-primary underline">
      Sign In
    </Link>
  </>
);

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");

  if (step === "request") {
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setStep("reset");
    }

    return (
      <AuthCard
        title="Forgot Password"
        description="Welcome back! Please enter your details."
        footer={BACK_TO_SIGN_IN}
      >
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-[22px]">
          <FormField label="Enter your Email" type="email" placeholder="test@gmail.com" required />
          <Button type="submit" className="h-[52px] w-full rounded-[6px] text-base font-semibold">
            Reset Password
          </Button>
        </form>
      </AuthCard>
    );
  }

  if (step === "reset") {
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setStep("success");
    }

    return (
      <AuthCard
        title="Set new Password"
        description="Welcome back! Please enter your details."
        footer={BACK_TO_SIGN_IN}
      >
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-[22px]">
          <PasswordField label="Password" placeholder="••••••••••" required />
          <PasswordField label="Confirm Password" placeholder="••••••••••" required />
          <Button type="submit" className="h-[52px] w-full rounded-[6px] text-base font-semibold">
            Reset Password
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={<CircleCheck className="size-[46px] text-green-500" />}
      title="Password Reset Succesfully"
      description="Now you can sign in to HOS with new password"
    >
      <Button asChild className="h-[52px] w-full rounded-[6px] text-base font-semibold">
        <Link href="/sign-in">Back to Sign in</Link>
      </Button>
    </AuthCard>
  );
}
