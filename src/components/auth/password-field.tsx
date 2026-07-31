"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface PasswordFieldProps extends Omit<ComponentProps<"input">, "type"> {
  label: string;
  error?: string;
}

export function PasswordField({ label, error, className, id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Label htmlFor={fieldId} className="text-base font-normal text-muted-foreground">
        {label}
      </Label>
      <div className="relative w-full">
        <Input
          id={fieldId}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          className={cn("h-[52px] rounded-[4px] px-[14px] py-3 pr-10 text-sm", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
