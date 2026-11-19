/**
 * The picture a path shows, for "no photograph twice on a page" checks: the
 * file name without its folder, size suffix, extension or version. The same
 * photograph is served from more than one folder and size, so comparing whole
 * paths let a repeat through.
 */
export function pictureKey(src: string): string {
  const file = src.split('?')[0].split('#')[0].split('/').pop() ?? src;
  return file.replace(/\.[a-z0-9]+$/i, '').replace(/-(160|320|640|1080|1920)$/, '').toLowerCase();
}

/**
 * The first candidate whose picture is not among `taken`, or the first
 * candidate when every one is. A page hero uses it so it does not repeat a
 * card further down the same page.
 */
export function freePicture(candidates: readonly string[], taken: readonly string[]): string {
  const used = new Set(taken.map(pictureKey));
  return candidates.find((src) => !used.has(pictureKey(src))) ?? candidates[0];
}
