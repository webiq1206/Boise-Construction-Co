import Image from "next/image";
import { contentImageAlt } from "@/shared/imageAlts";
import { SITE_IMAGES } from "@/shared/siteImages";

/** Full-bleed photography band to break long light section stretches. */
export function StatementBandSection() {
  return (
    <section className="relative h-48 md:h-64 overflow-hidden">
      <Image
        src={SITE_IMAGES.statementBand}
        alt={contentImageAlt(SITE_IMAGES.statementBand)}
        fill
        loading="lazy"
        quality={65}
        sizes="100vw"
        className="object-cover img-brand-grade"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-inverse/10 to-background/70" />
      <p className="absolute bottom-3 left-4 text-xs text-white">Representative imagery</p>
    </section>
  );
}
