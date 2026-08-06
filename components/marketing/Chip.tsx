import { cn } from "@/lib/utils";

export interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Chip({ children, active, className, onClick }: ChipProps) {
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-sm text-xs font-normal tracking-wide transition-colors duration-200 ease-out",
        // Interactive chips (filters) get a real tap target; static tag/badge
        // usage keeps the original compact padding.
        onClick ? "min-h-9 px-4 py-2" : "px-3 py-1",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-[hsl(var(--surface-muted))] text-foreground",
        onClick && "cursor-pointer hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </Comp>
  );
}
