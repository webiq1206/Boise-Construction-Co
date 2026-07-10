import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '@/shared/blogContent';
import {
  CONTENT_HUBS,
  categoryHubPath,
  getHubBySlug,
  guidePath,
  isCategoryHubIndexable,
  CATEGORY_HUB_MIN_POSTS,
} from '@/shared/contentHubs';
import { buildCanonical } from '@/lib/page-metadata';
import { getHubHeroImage, getBlogImageAlt, getAbsoluteImageUrl } from '@/shared/blogImages';
import { Section } from '@/components/marketing/Section';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BlogCard } from '@/components/marketing/BlogCard';
import { HubHeroBanner } from '@/components/marketing/BlogHeroBanner';
import { generateBreadcrumbSchema, generateCollectionPageSchema } from '@/lib/schema';
import { getBaseUrl } from '@/lib/seo';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateStaticParams() {
  return CONTENT_HUBS.map((hub) => ({ hubSlug: hub.hubSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: { hubSlug: string };
}): Promise<Metadata> {
  const hub = getHubBySlug(params.hubSlug);
  if (!hub) return { title: 'Not Found' };

  const posts = BLOG_POSTS.filter((p) => p.hubSlug === params.hubSlug);
  const indexable = isCategoryHubIndexable(params.hubSlug, posts.length);
  const title = `${hub.title} Articles`;
  const description = `Articles about ${hub.title.toLowerCase()} for Treasure Valley homeowners.`;
  const heroImage = getHubHeroImage(params.hubSlug);
  const imageUrl = getAbsoluteImageUrl(heroImage, getBaseUrl());

  return {
    title,
    description,
    alternates: { canonical: buildCanonical(categoryHubPath(params.hubSlug)) },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: buildCanonical(categoryHubPath(params.hubSlug)),
      type: 'website',
      images: [{ url: imageUrl, alt: `${hub.title} articles` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function BlogCategoryHubPage({
  params,
}: {
  params: { hubSlug: string };
}) {
  const hub = getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const posts = BLOG_POSTS.filter((p) => p.hubSlug === params.hubSlug).sort(
    (a, b) => (a.publishedAt < b.publishedAt ? 1 : -1),
  );

  const hubHero = getHubHeroImage(params.hubSlug);
  const pillarSlug = hub.pillarSlug;
  const hubAlt = pillarSlug ? getBlogImageAlt(pillarSlug) : `${hub.title} articles`;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: hub.title, url: categoryHubPath(hub.hubSlug) },
  ]);

  const collectionSchema =
    posts.length > 0
      ? generateCollectionPageSchema({
          title: hub.title,
          description: hub.description,
          url: categoryHubPath(hub.hubSlug),
          items: posts.map((p) => ({ name: p.title, url: `/blog/${p.slug}` })),
        })
      : null;

  return (
    <>
      {collectionSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Section spacing="lg" className="pt-28 md:pt-32">
        <div className="container px-4 max-w-6xl mx-auto">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Blog', href: '/blog' },
              { name: hub.title },
            ]}
          />

          <HubHeroBanner src={hubHero} alt={hubAlt} />

          <h1 className="text-3xl md:text-4xl font-sans font-light tracking-tight mb-4">
            {hub.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">{hub.description}</p>
          <Link
            href={guidePath(hub.pillarSlug)}
            className="inline-flex items-center text-accent hover:underline text-sm mb-10"
          >
            Read the complete guide
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>

          {posts.length < CATEGORY_HUB_MIN_POSTS && (
            <p className="text-sm text-muted-foreground mb-8">
              More articles in this topic are publishing soon.
            </p>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} formatDate={formatDate} />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
