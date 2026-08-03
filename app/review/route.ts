import { redirect } from 'next/navigation';
import { getGbpReviewUrl } from '@/shared/gbpProfile';

/**
 * Short link for verbal review asks (boiseconstruction.co/review).
 * Redirects to the GBP review URL once NEXT_PUBLIC_GBP_REVIEW_URL is set.
 */
export function GET() {
  const reviewUrl = getGbpReviewUrl();
  if (reviewUrl) {
    redirect(reviewUrl);
  }
  redirect('/contact?review=pending');
}
