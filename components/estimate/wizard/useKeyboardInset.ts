"use client";

import { useEffect, useState } from "react";

/**
 * How many pixels the on-screen keyboard (or other viewport chrome) currently
 * hides at the bottom of the layout viewport.
 *
 * A sticky/fixed bottom action bar disappears behind the software keyboard on
 * mobile because the keyboard shrinks the *visual* viewport without moving the
 * *layout* viewport that `position: fixed` is measured against. We read the gap
 * from `visualViewport` and let the caller translate the bar up by that amount
 * so Back and Continue stay reachable while a field is focused.
 *
 * Returns 0 on the server, on browsers without `visualViewport`, and whenever
 * the keyboard is closed - so the bar rests on the safe-area padding as normal.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const update = () => {
      // Distance from the bottom of the visual viewport to the bottom of the
      // layout viewport. Positive only while the keyboard (or a browser toolbar
      // overlay) is covering the page.
      const gap = window.innerHeight - (vv.height + vv.offsetTop);
      setInset(gap > 40 ? Math.round(gap) : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
