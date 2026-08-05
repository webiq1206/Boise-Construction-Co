import { cn } from "@/lib/utils";

type SectionVariant = "canvas" | "surface" | "greige" | "inverse" | "tint";

const variantClasses: Record<SectionVariant, string> = {
  canvas: "bg-background text-foreground",
  surface: "bg-card text-card-foreground",
  greige: "bg-surface-greige text-foreground",
  inverse: "bg-inverse text-inverse-foreground",
  tint: "bg-tint-warm text-foreground",
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: SectionVariant;
  divider?: boolean;
  spacing?: "default" | "lg" | "sm" | "none";
}

export function Section({
  variant = "canvas",
  divider = false,
  spacing = "default",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        variantClasses[variant],
        spacing === "default" && "section-y",
        spacing === "lg" && "section-y-lg",
        spacing === "sm" && "section-y-sm",
        divider && "section-divider",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
