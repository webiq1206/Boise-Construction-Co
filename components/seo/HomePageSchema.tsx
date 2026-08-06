import { JsonLd } from './JsonLd';
import { generateHomePageSchemaGraph } from '@/lib/schema';
import { HOMEPAGE_FAQS, INITIAL_FAQ_COUNT } from '@/shared/homepageFaqs';

export function HomePageSchema() {
  return (
    <JsonLd
      data={generateHomePageSchemaGraph(
        // Only the FAQs rendered by default belong in the schema - the rest
        // aren't in the page's HTML until "Show all" is clicked, and marking
        // up content that isn't actually there risks a rich-result rejection.
        HOMEPAGE_FAQS.slice(0, INITIAL_FAQ_COUNT).map((f) => ({ question: f.q, answer: f.a })),
      )}
    />
  );
}
