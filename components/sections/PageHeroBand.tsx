import Image from "next/image";
import { GRAIN_URL } from "@/lib/grain";

interface PageHeroBandProps {
  imageSrc: string;
  imageAlt: string;
  /** Optional extra scrim strength 0–1 (default 0.75). */
  scrim?: number;
  children: React.ReactNode;
}

/**
 * Full-bleed photo hero band for index pages.
 *
 * Taller than it was - clamp(380px, 48vw, 620px) rather than a flat 420 - so
 * the photograph gets to be a composition rather than a strip, and on the
 * family shell (1380px) rather than the old container so its text lines up
 * with every section beneath it.
 */
export function PageHeroBand({
  imageSrc,
  imageAlt,
  scrim = 0.66,
  children,
}: PageHeroBandProps) {
  return (
    <section className="relative min-h-[clamp(380px,48vw,620px)] flex items-end overflow-hidden bg-inverse border-b border-border/60">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-[0.9] img-brand-grade"
      />
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-inverse via-inverse/60 to-inverse/20"
        style={{ opacity: scrim }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-inverse/70 via-inverse/20 to-transparent" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN_URL, backgroundRepeat: "repeat", opacity: 0.03 }}
      />
      <div className="relative z-10 w-full ed-shell pb-12 md:pb-16 pt-28 md:pt-32">
        {children}
      </div>
    </section>
  );
}
