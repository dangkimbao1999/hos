import { Separator } from "@/components/ui/separator";

export function DividerOr() {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Separator className="w-auto flex-1" />
      <span className="shrink-0 text-[10px] font-medium tracking-[-0.03em] text-foreground">
        OR
      </span>
      <Separator className="w-auto flex-1" />
    </div>
  );
}
