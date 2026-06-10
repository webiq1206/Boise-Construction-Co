import { JsonLd } from './JsonLd';
import { generateHomePageSchemaGraph } from '@/lib/schema';
import { HOMEPAGE_FAQS } from '@/shared/homepageFaqs';

export function HomePageSchema() {
  return (
    <JsonLd
      data={generateHomePageSchemaGraph(
        HOMEPAGE_FAQS.map((f) => ({ question: f.q, answer: f.a })),
      )}
    />
  );
}
