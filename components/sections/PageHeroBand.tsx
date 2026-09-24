import { InteriorHero } from '@/components/approved/InteriorLayout';

interface PageHeroBandProps {
  imageSrc: string;
  imageAlt: string;
  /** Retained for caller compatibility; editorial heroes have no image scrim. */
  scrim?: number;
  children: React.ReactNode;
}

/** Editorial index introduction followed by wide imagery. */
export function PageHeroBand({
  imageSrc,
  imageAlt,
  children,
}: PageHeroBandProps) {
  return (
    <InteriorHero imageSrc={imageSrc} imageAlt={imageAlt} layout="editorial">
        {children}
      </InteriorHero>
  );
}
