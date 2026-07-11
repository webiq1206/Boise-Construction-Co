import { WAVE1_COST_CLUSTERS } from './blogPostsData';
import { ALL_HUB_CLUSTER_POSTS } from './allHubsContent';
import { LEGACY_BLOG_POSTS } from './legacyBlogPosts';
import { WAVE2_POSTS } from './wave2';

// Wave 2 bespoke posts supersede any thin factory cluster with the same slug.
const supersededSlugs = new Set(WAVE2_POSTS.map((p) => p.slug));
const priorPosts = [
  ...WAVE1_COST_CLUSTERS,
  ...ALL_HUB_CLUSTER_POSTS,
  ...LEGACY_BLOG_POSTS,
].filter((p) => !supersededSlugs.has(p.slug));

export const ALL_BLOG_POSTS = [...WAVE2_POSTS, ...priorPosts];
