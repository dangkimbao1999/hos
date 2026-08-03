"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadSlot({
  label,
  filled,
  pending,
  error,
  onFileSelected,
  onRemove,
  className,
}: {
  label: string;
  filled: boolean;
  pending?: boolean;
  error?: string;
  onFileSelected: (file: File) => void;
  onRemove?: () => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => !filled && inputRef.current?.click()}
          disabled={pending}
          className={cn(
            "flex size-full flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed text-muted-foreground transition-colors",
            filled
              ? "border-primary bg-primary/5 text-foreground"
              : "border-white/15 bg-white/5 hover:bg-white/10"
          )}
        >
          {pending ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          <span className="text-xs">{label}</span>
        </button>
        {filled && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-black/60"
          >
            <X className="size-3" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
