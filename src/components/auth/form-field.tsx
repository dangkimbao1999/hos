import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface FormFieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
}

export function FormField({ label, error, className, id, ...props }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Label htmlFor={fieldId} className="text-base font-normal text-muted-foreground">
        {label}
      </Label>
      <Input
        id={fieldId}
        aria-invalid={!!error}
        className={cn("h-[52px] rounded-[4px] px-[14px] py-3 text-sm", className)}
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
