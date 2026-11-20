"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_POSTER, HERO_POSTER_SRCSET } from "./heroPoster";

const MEDIA = "/images/construction/boise-construction-co-";


/** Autoplay decorative media while visible; keep the poster on technical failure. */
export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  // Below 1024px the video waits for the visitor's first interaction, so the
  // poster is the phone's first view and its largest paint (SEO audit CON-S5).
  // The owner's video itself is unchanged and still plays.
  const [interacted, setInteracted] = useState(false);
  const enabled = ready && !failed && (desktop || interacted);

  useEffect(() => {
    const size = matchMedia("(min-width: 1024px)");
    const resize = () => setDesktop(size.matches);
    const visibility = () => setVisible(document.visibilityState === "visible");
    resize();
    visibility();
    setReady(true);
    const first = () => setInteracted(true);
    const firstEvents = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    for (const name of firstEvents) window.addEventListener(name, first, { once: true, passive: true });
    size.addEventListener("change", resize);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => {
      observer.disconnect();
      size.removeEventListener("change", resize);
      document.removeEventListener("visibilitychange", visibility);
      for (const name of firstEvents) window.removeEventListener(name, first);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setHasFrame(false);
    video.load();
  }, [enabled, desktop]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!enabled || !inView || !visible) {
      video.pause();
      return;
    }
    // Browser/OS autoplay policy remains authoritative even for muted media.
    // Ignore a superseded play promise when visibility or sources change.
    let cancelled = false;
    video.muted = true;
    void video.play().catch(() => {
      if (!cancelled) {
        setFailed(true);
        setHasFrame(false);
      }
    });
    return () => { cancelled = true; };
  }, [enabled, desktop, inView, visible]);

  const showPoster = () => {
    setFailed(true);
    setHasFrame(false);
  };

  return (
    <div ref={rootRef} className="hero-video-media" aria-hidden="true">
      {/* The poster is first-HTML content and needs no JavaScript or video download. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-hero-poster="" src={HERO_POSTER} alt="Custom home building in Boise, Idaho by Boise Construction Co" srcSet={HERO_POSTER_SRCSET} sizes="100vw" width={1920} height={1080} fetchPriority="high" loading="eager" />
      <video
        ref={videoRef}
        poster={HERO_POSTER}
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
        data-has-frame={hasFrame}
        onPlaying={() => setHasFrame(true)}
        onError={event => {
          // React bubbles source errors synthetically. A failed WebM source
          // must still let the browser try the MP4 fallback.
          if (event.target === event.currentTarget) showPoster();
        }}
      >
        {enabled && (desktop ? <>
          <source src={`${MEDIA}background.webm`} type="video/webm" />
          <source src={`${MEDIA}background-1080p.mp4`} type="video/mp4" onError={showPoster} />
        </> : <source src={`${MEDIA}background-720p.mp4`} type="video/mp4" onError={showPoster} />)}
      </video>
    </div>
  );
}
