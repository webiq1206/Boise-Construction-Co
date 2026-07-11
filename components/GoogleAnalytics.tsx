import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-NGE449QF9Y';

export function GoogleAnalytics() {
  // Only load analytics in production so local/dev traffic never pollutes the
  // real GA property (and dev network stays quiet for tooling/screenshots).
  if (process.env.NODE_ENV !== 'production') return null;
  if (!GA_MEASUREMENT_ID) return null;
  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
