// Blog content for Boise Construction Co

import { ALL_BLOG_POSTS } from './content/allBlogPosts';

export interface BlogPostData {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  hubSlug: string;
  tags: string[];
  publishedAt: string;
  /** Last substantive revision date (ISO). Feeds Article dateModified. */
  updatedAt?: string;
  heroImage?: string;
  thumbnail?: string;
  faqs: Array<{ question: string; answer: string }>;
  relatedLinks?: Array<{ url: string; anchor?: string }>;
  isPillar?: boolean;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: string;
  featuredSnippetTargets?: string[];
  wordCountTarget?: 'cluster' | 'pillar';
  quickAnswer?: string;
  keyTakeaways?: string[];
}

export const BLOG_POSTS: BlogPostData[] = ALL_BLOG_POSTS;

export function getBlogPostBySlug(slug: string): BlogPostData | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getBlogPostsByHub(hubSlug: string): BlogPostData[] {
  return BLOG_POSTS.filter((p) => p.hubSlug === hubSlug);
}
