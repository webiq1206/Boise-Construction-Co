import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateServiceSchema,
  generateSpeakableSchema,
} from './schema';

export function landingBreadcrumbs(
  items: Array<{ name: string; url: string }>,
) {
  return generateBreadcrumbSchema(items);
}

export function landingFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return generateFAQSchema(
    faqs.map((f) => ({ question: f.question, answer: f.answer })),
  );
}

export function landingServiceSchema(
  name: string,
  description: string,
  city?: string,
) {
  return generateServiceSchema(name, description, city);
}

export function landingSpeakable(path: string, name: string) {
  return generateSpeakableSchema({ url: path, name });
}
