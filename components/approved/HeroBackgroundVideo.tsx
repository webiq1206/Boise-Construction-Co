"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MEDIA = "/images/construction/boise-construction-co-";
export const HERO_POSTER = `${MEDIA}poster.jpg`;

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

/** Decorative media stays static until browser preferences have been checked. */
export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"auto" | "static" | "manual" | null>(null);
  const [desktop, setDesktop] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const enabled = mode !== null && mode !== "static" && !failed;

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const size = matchMedia("(min-width: 1024px)");
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const preferences = () => {
      const restricted = motion.matches || connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? "");
      setMode(restricted ? "static" : "auto");
    };
    const resize = () => setDesktop(size.matches);
    const visibility = () => setVisible(document.visibilityState === "visible");
    preferences();
    resize();
    visibility();
    motion.addEventListener("change", preferences);
    size.addEventListener("change", resize);
    connection?.addEventListener("change", preferences);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", preferences);
      size.removeEventListener("change", resize);
      connection?.removeEventListener("change", preferences);
      document.removeEventListener("visibilitychange", visibility);
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
    if (!enabled || userPaused || !inView || !visible) {
      video.pause();
      return;
    }
    // Some browsers decline autoplay even when muted. Keep the poster and the
    // explicit play control available instead of reporting a broken page.
    video.muted = true;
    void video.play().catch(() => setPlaying(false));
  }, [enabled, desktop, userPaused, inView, visible, playRequest]);

  const toggle = () => {
    if (playing) {
      setUserPaused(true);
      videoRef.current?.pause();
    } else {
      setMode("manual");
      setUserPaused(false);
      setPlayRequest(value => value + 1);
    }
  };

  const showPoster = () => {
    setFailed(true);
    setPlaying(false);
    setHasFrame(false);
  };

  return (
    <>
      <div ref={rootRef} className="hero-video-media" aria-hidden="true">
        {/* The poster is first-HTML content and needs no JavaScript or video download. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-hero-poster="" src={HERO_POSTER} alt="" width={1920} height={1080} fetchPriority="high" loading="eager" />
        <video
          ref={videoRef}
          id="home-background-video"
          poster={HERO_POSTER}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          data-has-frame={hasFrame}
          onPlaying={() => { setPlaying(true); setHasFrame(true); }}
          onPause={() => setPlaying(false)}
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
      {mode !== null && !failed && <button
        type="button"
        className="hero-video-control"
        onClick={toggle}
        aria-controls="home-background-video"
        aria-label={playing ? "Pause background video" : "Play background video"}
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        <span>{playing ? "Pause video" : "Play video"}</span>
      </button>}
    </>
  );
}
