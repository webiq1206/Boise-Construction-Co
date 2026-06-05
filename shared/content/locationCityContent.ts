import { PILLAR_COST, type ContentSection } from './wave1/snippets';

/** City- and neighborhood-specific sections (not shared templates). */

const CITY_SNIPPETS: Record<string, ContentSection[]> = {
  'meridian-remodeling-guide': [
    {
      h2: 'Meridian subdivisions and open-kitchen demand',
      paragraphs: [
        '1990s–2010s builder-grade kitchens and baths are the most common upgrade path - homeowners want islands, pantry storage, and better connection to family rooms without leaving the subdivision aesthetic.',
        'Rear-entry mudrooms and drop-zone storage are popular where garage traffic meets kitchen clutter.',
      ],
    },
    {
      h2: 'Meridian permits and trade scheduling',
      paragraphs: [
        'Ada County review applies for structural and MEP changes. Peak summer trade demand can extend construction - book design before spring if you want fall completion.',
      ],
    },
  ],
  'eagle-remodeling-guide': [
    {
      h2: 'Eagle finish level and HOA design review',
      paragraphs: [
        'Larger footprints and premium materials are normal here - budget for architectural review time and exterior material boards in Harris Ranch, Hidden Springs, and Foothills communities.',
        'Roof and stone tie-ins matter when additions must match executive streetscapes.',
      ],
    },
    {
      h2: 'Eagle additions and master suites',
      paragraphs: [
        'Second stories and master-suite expansions are common; engineering and longer Ada review should be in the calendar from day one.',
      ],
    },
  ],
  'kuna-remodeling-guide': [
    {
      h2: 'Kuna growth and family-focused layouts',
      paragraphs: [
        'Newer inventory favors kitchen refreshes, laundry/mudroom upgrades, and ADU feasibility on larger lots with alley access.',
        'Open kitchen conversions are frequent where builder layouts still feel compartmentalized.',
      ],
    },
  ],
  'star-remodeling-guide': [
    {
      h2: 'Star housing and commuter-friendly upgrades',
      paragraphs: [
        'Smaller footprints benefit from smart storage and efficient kitchen layouts. Outdoor connection to patios is a common second phase after interior work.',
      ],
    },
  ],
  'middleton-remodeling-guide': [
    {
      h2: 'Middleton and Canyon County permitting',
      paragraphs: [
        'Canyon County portals and review cadence differ from Ada - confirm jurisdiction early if your address is near county lines.',
        'Cross-county trade coordination can add mobilization time; plan one contract with a team that works both corridors regularly.',
      ],
    },
  ],
  'nampa-remodeling-guide': [
    {
      h2: 'Nampa housing mix: bungalows to new build',
      paragraphs: [
        'Older bungalows may need electrical and layout creativity; newer sections allow faster cosmetic-to-full-gut paths. Canyon County submission rules apply throughout.',
        'Kitchen and bath still dominate inquiries - whole-home refreshes are growing in established neighborhoods.',
      ],
    },
  ],
  'north-end-remodeling-guide': [
    {
      h2: 'North End scale and character',
      paragraphs: [
        'Bungalow footprints reward creative storage, respectful additions, and electrical upgrades when walls open. Oversized additions can fight neighborhood rhythm - design for the street.',
        'Galley-to-open plans need beam and permit diligence in Ada County.',
      ],
    },
  ],
  'boise-bench-remodeling-guide': [
    {
      h2: 'Bench ranches and open kitchen conversions',
      paragraphs: [
        'Mid-century ranches are prime for opening kitchen to living space when structure allows. Insulation and panel updates often appear once drywall is removed.',
        'Window and exterior upgrades sometimes pair with interior remodels for comfort in older building envelopes.',
      ],
    },
  ],
  'harris-ranch-remodeling-guide': [
    {
      h2: 'Harris Ranch builder-grade upgrades',
      paragraphs: [
        'Islands, mudrooms, and outdoor entertaining upgrades are common. HOAs may review exterior materials - start design before ordering stone or roofing tie-ins.',
      ],
    },
  ],
  'east-boise-remodeling-guide': [
    {
      h2: 'East Boise infill and newer construction',
      paragraphs: [
        'Primary suite upgrades, open kitchens, and media/flex rooms are frequent. Lot coverage and setback checks matter on infill lots before addition pricing is firm.',
      ],
    },
  ],
  'hidden-springs-remodeling-guide': [
    {
      h2: 'Hidden Springs HOA and exterior coordination',
      paragraphs: [
        'Architectural review adds calendar time. Exterior remodels should match community standards for stone, roofing, and color palettes.',
        'Interior kitchen and bath work still dominates, often with premium fixture levels.',
      ],
    },
  ],
  'eagle-foothills-remodeling-guide': [
    {
      h2: 'Foothills lots, soil, and structural complexity',
      paragraphs: [
        'Hillside and view lots can move foundation and retaining requirements early. Additions and outdoor living should plan drainage and access for equipment.',
        'Expect engineering and Ada review for structural tie-ins to existing framing.',
      ],
    },
  ],
};

export function getCitySpecificSections(slug: string): ContentSection[] {
  return CITY_SNIPPETS[slug] ?? [];
}

export function buildLocationGuideSections(
  slug: string,
  cityName: string,
  citySlug: string,
  county: 'ada' | 'canyon',
  housingNote: string,
  guideType: 'location' | 'neighborhood',
): ContentSection[] {
  const countyGuide =
    county === 'ada'
      ? '<a href="/blog/ada-vs-canyon-county-permit-timelines">Ada vs Canyon permit timelines</a>'
      : '<a href="/blog/ada-vs-canyon-county-permit-timelines">Canyon County permit timelines</a>';

  return [
    {
      h2: `Remodeling in ${cityName}`,
      paragraphs: [
        housingNote,
        `This ${guideType === 'neighborhood' ? 'neighborhood' : 'city'} guide links local housing context, permits, and services - start with the <a href="/guides/treasure-valley-remodeling-guide">Treasure Valley hub</a> for valley-wide planning.`,
      ],
    },
    ...getCitySpecificSections(slug),
    {
      h2: 'Services and planning ranges',
      paragraphs: [
        `<a href="/services/kitchen-remodel/${citySlug}">Kitchen</a> · <a href="/services/bathroom-remodel/${citySlug}">Bathroom</a> · <a href="/services/whole-home-remodel/${citySlug}">Whole-home</a> · <a href="/services/room-addition/${citySlug}">Additions</a> · <a href="/areas/${citySlug}">${cityName} area page</a>.`,
        `Planning bands: <a href="${PILLAR_COST}">Boise Remodeling Cost Guide</a>.`,
      ],
    },
    {
      h2: county === 'ada' ? 'Ada County permits' : 'Canyon County permits',
      paragraphs: [
        county === 'ada'
          ? `${cityName} layout and structural work typically routes through Ada County plan review.`
          : `${cityName} uses Canyon County processes - expect different portals and review cadence than Boise or Meridian.`,
        countyGuide,
      ],
    },
    {
      h2: 'Next steps',
      paragraphs: [
        '<a href="/#calculator">Estimator</a> · <a href="/contact">Schedule consultation</a> · <a href="/guides">All guides</a>.',
      ],
    },
  ];
}
