/**
 * Local search wording for image descriptions (owner, 19 November 2026: every
 * image on every page carries an alt that names the work and the place).
 *
 * The form is "<work> in <city>, Idaho: <what the picture shows>". The part
 * after the colon stays a plain account of what is in the frame, for screen
 * readers. Owner direction, same day: no qualifier such as "idea", "concept"
 * or "representative" in or beside an image description.
 */

export interface LocalAltContext {
  /** The work the page is about: "custom home building", "home addition". Defaults to new home construction. */
  subject?: string;
  /** City name without the state. Defaults to Boise, the primary city. */
  city?: string;
}

const CITY_NAMES = ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Middleton', 'Caldwell', 'Garden City'];

const SUBJECT_BY_SLUG: Record<string, string> = {
  'custom-home-builder': 'custom home building',
  'semi-custom-homes': 'semi-custom home building',
  'build-on-your-lot': 'build on your lot',
  'design-build': 'design-build home construction',
  'home-plans-design': 'home design and plans',
  'home-additions': 'home addition',
  adu: 'ADU construction',
  'lot-evaluation': 'lot evaluation',
  'shop-homes-barndominiums': 'shop home and barndominium construction',
  'energy-efficient-homes': 'energy-efficient home building',
};

/** "custom-home-builder" to "custom home building"; anything else is returned as given. */
export function subjectForService(slugOrNoun: string | undefined): string | undefined {
  if (!slugOrNoun) return undefined;
  return SUBJECT_BY_SLUG[slugOrNoun] ?? slugOrNoun;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Lower the first letter unless the description opens with a name or an acronym. */
function lowerFirst(text: string): string {
  const first = text.split(/\s+/)[0] ?? '';
  if (/^[A-Z]{2,}/.test(first)) return text;
  if (CITY_NAMES.some((name) => text.startsWith(name))) return text;
  if (/^(P5|Idaho|Treasure|Ada|Canyon|North|Harris|Nick)\b/.test(text)) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function localAlt(description: string | undefined | null, context: LocalAltContext = {}): string {
  const text = (description ?? '').trim().replace(/\.$/, '');
  if (!text) return '';
  // Already names a city and the state: left exactly as written.
  if (/,\s*Idaho\b/.test(text)) return text;
  const subject = capitalise((context.subject ?? 'new home construction').trim());
  const city = (context.city ?? 'Boise').replace(/,\s*Idaho$/i, '').trim();
  return `${subject} in ${city}, Idaho: ${lowerFirst(text)}`;
}

/** The city a tag list names, if any ("kuna" to "Kuna"). */
export function cityFromTags(tags: readonly string[] | undefined): string | undefined {
  if (!tags) return undefined;
  for (const tag of tags) {
    const match = CITY_NAMES.find((name) => name.toLowerCase() === tag.toLowerCase());
    if (match) return match;
  }
  return undefined;
}

const SUBJECT_BY_TAG: Record<string, string> = {
  adu: 'ADU construction',
  'accessory dwelling unit': 'ADU construction',
  'custom home': 'custom home building',
  'custom homes': 'custom home building',
  'semi-custom': 'semi-custom home building',
  addition: 'home addition',
  additions: 'home addition',
  'home additions': 'home addition',
  barndominium: 'shop home and barndominium construction',
  'shop home': 'shop home and barndominium construction',
  lot: 'lot evaluation',
  land: 'lot evaluation',
  lots: 'lot evaluation',
  'design-build': 'design-build home construction',
  design: 'home design and plans',
  plans: 'home design and plans',
  'floor plans': 'home design and plans',
  'energy efficiency': 'energy-efficient home building',
};

export function subjectFromTags(tags: readonly string[] | undefined): string | undefined {
  if (!tags) return undefined;
  for (const tag of tags) {
    const subject = SUBJECT_BY_TAG[tag.toLowerCase()];
    if (subject) return subject;
  }
  return undefined;
}
