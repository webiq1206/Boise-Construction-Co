import type { LandingSection } from '@/components/seo/LandingPageTemplate';
import { permitGuidance, permitSource } from '@/lib/permitGuidance';
import { CITY_SEO_DATA } from '@/lib/seo';
import { LOCATION_GUIDES } from '@/shared/content/locationGuides';
import { CITIES, getCountyLabel, type CityData } from '@/shared/contentData';

export interface CityFaq {
  question: string;
  answer: string;
}

function locationGuide(slug: string) {
  return LOCATION_GUIDES.find((guide) => guide.guideType === 'location' && guide.linkedCities?.[0] === slug);
}

function neighborhoodGuides(slug: string) {
  return LOCATION_GUIDES.filter((guide) => guide.guideType === 'neighborhood' && guide.linkedCities?.[0] === slug);
}

function plainParagraphs(html: string): string[] {
  return html
    .replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, '')
    .split(/<\/p>/i)
    .map((part) => part
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter((text) => text.length > 40);
}

/** Place-specific paragraphs already published on the city guide. Shared scaffolding is left on the guide. */
function guideSection(content: string, id: string): string[] {
  const match = content.match(new RegExp(`<h2 id="${id}">[\\s\\S]*?(?=<h2 |$)`));
  if (!match) return [];
  const shared = /^(Our |For the full picture|We handle design|Services relevant here|The fastest way|See the )/;
  return plainParagraphs(match[0]).filter((paragraph) => !shared.test(paragraph));
}

/** Two questions that exist only for this city, from facts already published on the site. */
export function cityOnlyFaqs(city: CityData, serviceName?: string): CityFaq[] {
  const county = getCountyLabel(city.county);
  const subject = serviceName ? serviceName.toLowerCase() : 'a new home';
  const permitQuestion = `Which permit office handles ${subject} in ${city.name}?`;
  const published = permitSource(city.name);
  const permitAnswer = `${permitGuidance(city.name)} ${city.name} is in ${county}.${published ? ` ${city.name} publishes permit guidance for addresses inside city limits.` : ''} Ada County and Canyon County steps are compared on the permit-flow page.`;

  const neighborhoods = neighborhoodGuides(city.slug);
  let second: CityFaq;
  if (neighborhoods.length > 0) {
    const names = neighborhoods.map((guide) => guide.title.replace(/^Building in /, ''));
    const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    second = {
      question: `Does Boise Construction Co serve ${list} in ${city.name}?`,
      answer: `Yes. ${list} ${names.length > 1 ? 'are' : 'is'} covered by a home building guide on this site, and ${city.name} is in our Treasure Valley service area.`,
    };
  } else {
    const guide = locationGuide(city.slug);
    if (guide) {
      second = {
        question: `Where can I read about building a home in ${city.name}?`,
        answer: `The ${guide.title} guide is on this site. It covers what building in ${city.name} involves. ${city.name} is in ${county}.`,
      };
    } else {
      const nearby = CITIES.filter((item) => item.county === city.county && item.slug !== city.slug).map((item) => item.name);
      second = {
        question: `Which nearby cities does Boise Construction Co serve from ${city.name}?`,
        answer: `${city.name} is in ${county} and is part of the Treasure Valley service area, along with ${nearby.join(', ')}.`,
      };
    }
  }

  return [
    { question: permitQuestion, answer: permitAnswer },
    second,
  ];
}

/** County, permit path, city guide, and nearby areas. Middleton includes the full guide takeaways. */
export function cityBuildingSection(city: CityData, serviceName?: string): LandingSection {
  const county = getCountyLabel(city.county);
  const guide = locationGuide(city.slug);
  const nearby = CITIES.filter((item) => item.slug !== city.slug && item.county === city.county);
  const places = CITY_SEO_DATA[city.name]?.neighborhoods ?? [];
  const neighborhoods = neighborhoodGuides(city.slug);
  const lead = serviceName ? `${serviceName} in ${city.name}` : `Building in ${city.name}`;
  const placeFacts = `${lead} is work in ${county}. ${permitGuidance(city.name)} Nearby service areas in ${county} include ${nearby.map((item) => item.name).join(', ')}.`;
  const paragraphs: string[] = [];
  if (guide?.content) {
    paragraphs.push(guide.excerpt);
    paragraphs.push(...guideSection(guide.content, 'building-here'));
    paragraphs.push(...guideSection(guide.content, 'lots'));
    paragraphs.push(...guideSection(guide.content, 'watch-out'));
    paragraphs.push(...guideSection(guide.content, 'budget'));
    const takeaways = city.slug === 'middleton' ? guide.keyTakeaways ?? [] : (guide.keyTakeaways ?? []).slice(0, 2);
    if (takeaways.length > 0) paragraphs.push(takeaways.join(' '));
  }
  paragraphs.push(placeFacts);
  if (places.length > 0) {
    paragraphs.push(`Places already described for ${city.name} include ${places.join(', ')}.`);
  }
  if (neighborhoods.length > 0) {
    const names = neighborhoods.map((item) => item.title.replace(/^Building in /, ''));
    paragraphs.push(`Neighborhood guides for ${city.name} cover ${names.join(' and ')}.`);
  }

  const links = [
    ...(guide
      ? [{ label: guide.title, href: `/guides/${guide.slug}` }]
      : [{ label: 'Treasure Valley home building guide', href: '/guides/treasure-valley-home-building-guide' }]),
    ...neighborhoods.map((item) => ({ label: item.title, href: `/guides/${item.slug}` })),
    { label: 'Ada vs Canyon County permit flow', href: '/resources/ada-canyon-permit-flow' },
    ...(permitSource(city.name) ? [{ label: `${city.name} permit guidance`, href: permitSource(city.name)! }] : []),
    ...nearby.slice(0, 3).map((item) => ({ label: `${item.name} home builder`, href: `/areas/${item.slug}` })),
  ];
  if (city.slug === 'middleton' && serviceName) {
    links.unshift({ label: 'Custom home builder in Middleton', href: '/areas/middleton' });
  }
  if (city.slug === 'middleton' && serviceName !== 'Custom Home Building') {
    links.push({ label: 'Custom home building in Middleton', href: '/services/custom-home-builder/middleton' });
  }

  return {
    heading: serviceName
      ? `${serviceName} in ${city.name}: place, permits, and guide`
      : `Building in ${city.name}: county, permits, and guide`,
    paragraphs,
    links,
  };
}

const CITY_FAQ_STARTS = [
  'Which permit office handles ',
  'Does Boise Construction Co serve ',
  'Where can I read about building a home in ',
  'Which nearby cities does Boise Construction Co serve from ',
  'Do you build in ',
  'Which county is ',
];

/** FAQ schema on city pages marks city-specific questions. Shared questions stay visible, and their schema stays on the hub. */
export function cityFaqSchema<T extends { question: string }>(faqs: T[], cityName: string): T[] {
  return faqs.filter((faq) => {
    const question = faq.question;
    if (/^how much\b/i.test(question) || /^how do i get a budget\b/i.test(question)) return false;
    const withoutBrand = question.replaceAll('Boise Construction Co', '');
    return CITY_FAQ_STARTS.some((start) => question.startsWith(start)) && withoutBrand.includes(cityName);
  });
}
