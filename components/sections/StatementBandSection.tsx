import Image from "next/image";
import { SITE_IMAGES } from "@/shared/siteImages";

/** Full-bleed photography band to break long light section stretches. */
export function StatementBandSection() {
  return (
    <section className="relative h-48 md:h-64 overflow-hidden">
      <Image
        src={SITE_IMAGES.statementBand}
        alt="Warm open-concept great room and kitchen remodel in the Treasure Valley, Idaho"
        fill
        loading="lazy"
        quality={65}
        sizes="100vw"
        className="object-cover img-brand-grade"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-inverse/20 to-background/80" />
    </section>
  );
}
