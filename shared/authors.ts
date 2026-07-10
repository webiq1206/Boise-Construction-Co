/**
 * Named-expert author for editorial content (E-E-A-T).
 *
 * Boise Remodeling Co is founder-led, so guides and articles are attributed to
 * Jared Brost, the accountable design-build lead behind every project. This is
 * the single source of truth for the visible byline, the author bio block, and
 * the `Person` author entity emitted on Article structured data (linked to
 * /about#team so the entity resolves to a real, described person).
 */
export const EXPERT_AUTHOR = {
  name: 'Jared Brost',
  role: 'Founder & Design-Build Lead',
  url: '/about#team',
  since: 2017,
  bio:
    'Jared Brost founded Boise Remodeling Co in 2017 and leads the design-build process on ' +
    'every project, from the first in-home visit through Ada and Canyon County permitting to ' +
    'the final walkthrough. He is the single point of accountability behind the written scope ' +
    'and workmanship guarantee that back every remodel.',
} as const;
