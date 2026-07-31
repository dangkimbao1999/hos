import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadSlot({
  label,
  filled,
  onToggle,
  className,
}: {
  label: string;
  filled: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed text-muted-foreground transition-colors",
        filled
          ? "border-primary bg-primary/5 text-foreground"
          : "border-white/15 bg-white/5 hover:bg-white/10",
        className
      )}
    >
      <ImagePlus className="size-6" />
      <span className="text-xs">{label}</span>
      {filled && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-black/60">
          <X className="size-3" />
        </span>
      )}
    </button>
  );
}
