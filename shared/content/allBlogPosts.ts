import { WAVE2_POSTS } from './wave2';

/**
 * Every blog post on the site.
 *
 * This used to merge four sources: hand-written posts, two generations of
 * factory-generated cluster posts, and a legacy set. All of the generated ones
 * described remodeling and, more to the point, differed from each other only in
 * their nouns. They are retired rather than rewritten - see
 * shared/content/contentRedirects.js for where their URLs now go.
 *
 * Every post is now hand-written, one file per post in ./wave2.
 */
export const ALL_BLOG_POSTS = WAVE2_POSTS;
