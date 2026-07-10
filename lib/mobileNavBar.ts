/**
 * Ref-counted control for the global mobile Call/Text/Schedule bar.
 *
 * Multiple surfaces (a conversion modal, the inline estimate bar) may want the
 * bar hidden at the same time. A shared boolean lets whichever unmounts first
 * clobber the other's intent. Instead, each caller requests a hide and gets an
 * idempotent release; the bar is revealed only once every request is released.
 */
let count = 0;

export function requestHideMobileNavBar(): () => void {
  count += 1;
  if (typeof document !== "undefined") {
    document.body.dataset.hideMobileNavBar = "true";
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    count = Math.max(0, count - 1);
    if (count === 0 && typeof document !== "undefined") {
      delete document.body.dataset.hideMobileNavBar;
    }
  };
}
