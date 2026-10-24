import { SHOW_FOUNDED_YEAR } from '@/shared/foundedYear';

/**
 * Maker's seal. The ring artwork states the founding year, so this renders
 * nothing while SHOW_FOUNDED_YEAR is false. The file stays in the brand kit.
 */
export const FOUNDING_SEAL_SRC =
  '/brand/svg/seal/light/boise-construction-co-seal-charcoal-accent.svg';

type FoundingSealProps = {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
};

export function FoundingSeal({
  alt = 'Boise Construction Co',
  className,
  width,
  height,
}: FoundingSealProps) {
  if (!SHOW_FOUNDED_YEAR) return null;
  return (
    <img
      src={FOUNDING_SEAL_SRC}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}
