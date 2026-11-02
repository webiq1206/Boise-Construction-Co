import { InteriorHero } from '@/components/approved/InteriorLayout';

interface PageHeroBandProps {
  imageSrc: string;
  imageAlt: string;
  imageCaption?: string;
  /** Retained for caller compatibility; editorial heroes have no image scrim. */
  scrim?: number;
  children: React.ReactNode;
}

/** Editorial index introduction followed by wide imagery. */
export function PageHeroBand({
  imageSrc,
  imageAlt,
  imageCaption,
  children,
}: PageHeroBandProps) {
  return (
    <InteriorHero imageSrc={imageSrc} imageAlt={imageAlt} imageCaption={imageCaption} layout="editorial">
        {children}
      </InteriorHero>
  );
}
