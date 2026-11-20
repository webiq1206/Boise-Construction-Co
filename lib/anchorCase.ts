import { CITIES } from '@/shared/contentData';

/** Words that keep their capital: places, communities, counties and the region. */
const PROPER = new Set([
  ...CITIES.flatMap((city) => city.name.split(' ')),
  'Idaho', 'Ada', 'Canyon', 'County', 'Treasure', 'Valley', 'Boise', 'Co',
  'Hidden', 'Springs', 'Harris', 'Ranch', 'Garden', 'City',
]);

const keep = (word: string) => PROPER.has(word.replace(/[^A-Za-z]/g, '')) || /^[A-Z0-9]{2,}s?$/.test(word.replace(/[^A-Za-z0-9]/g, ''));
const lower = (word: string) => word.split('-').map((part) => (keep(part) ? part : part.charAt(0).toLowerCase() + part.slice(1))).join('-');

/**
 * Sentence case for a link label (house style: sentence case labels and
 * chips). Some anchors in the link manifest and some page titles were written
 * in title case ("Home Building in Kuna", "Design-Build in Boise"). A label is
 * rewritten only when it reads as title case: at least one capital after the
 * first word that is not a place or an acronym. Places and acronyms keep their
 * capitals; a label already in sentence case is returned unchanged.
 */
export function anchorCase(label: string): string {
  const words = label.split(' ');
  const firstParts = words[0]?.split('-') ?? [];
  const capitalised =
    words.slice(1).some((word) => word.split('-').some((part) => /^[A-Z]/.test(part) && !keep(part))) ||
    firstParts.slice(1).some((part) => /^[A-Z]/.test(part) && !keep(part));
  if (!capitalised) return label;
  return words
    .map((word, i) => {
      if (i > 0) return lower(word);
      const [head, ...rest] = word.split('-');
      return [head, ...rest.map((part) => (keep(part) ? part : part.charAt(0).toLowerCase() + part.slice(1)))].join('-');
    })
    .join(' ');
}
