import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthCard({ icon, title, description, children, footer, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[434px] flex-col items-center gap-[50px] rounded-md bg-card px-6 py-10 sm:px-[42px] sm:py-12",
        className
      )}
    >
      <div className="flex flex-col items-center gap-5">
        {icon}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[26px] font-medium tracking-[-0.03em] text-foreground">{title}</h1>
          {description && (
            <p className="text-sm tracking-[-0.03em] text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col items-center gap-[22px]">{children}</div>
      {footer && (
        <p className="text-center text-sm tracking-[-0.03em] text-foreground">{footer}</p>
      )}
    </div>
  );
}
