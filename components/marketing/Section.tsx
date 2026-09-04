import { cn } from "@/lib/utils";

type SectionVariant = "canvas" | "surface" | "greige" | "inverse" | "tint";

const variantClasses: Record<SectionVariant, string> = {
  canvas: "bg-background text-foreground",
  surface: "bg-card text-card-foreground",
  greige: "bg-surface-greige text-foreground",
  inverse: "bg-inverse text-inverse-foreground",
  tint: "bg-tint-warm text-foreground",
};

/**
 * The P5 family surfaces (app/family.css).
 *
 * The site shipped as a uniformly dark page, so every band sat at the same
 * value and a long page had no rhythm - nothing told a scrolling reader that a
 * new idea had started. `surface` gives a section its ground from the family
 * layer, which derives all of these from tokens this site already defines, so
 * alternating light and dark costs no new brand colour.
 *
 * `variant` is left in place and unchanged so pages not yet adopted keep
 * rendering exactly as they do; pass `surface` instead to join the rhythm.
 */
type SectionSurface = "dark" | "deep" | "bone" | "muted" | "gradient";

const surfaceClasses: Record<SectionSurface, string> = {
  dark: "ed-on-dark",
  deep: "ed-on-deep",
  bone: "ed-on-bone",
  muted: "ed-on-muted",
  gradient: "ed-on-gradient",
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: SectionVariant;
  /** Family ground. Takes precedence over `variant` when supplied. */
  surface?: SectionSurface;
  /** Hairline above the section, for separating two bands of the same value. */
  edge?: boolean;
  divider?: boolean;
  spacing?: "default" | "lg" | "sm" | "none" | "xl";
}

export function Section({
  variant = "canvas",
  surface,
  divider = false,
  edge = false,
  spacing = "default",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        surface ? surfaceClasses[surface] : variantClasses[variant],
        spacing === "default" && "section-y",
        spacing === "lg" && "section-y-lg",
        spacing === "sm" && "section-y-sm",
        spacing === "xl" && "ed-section-lg",
        divider && "section-divider",
        edge && "ed-edge-top",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
