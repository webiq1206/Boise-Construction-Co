import Image from "next/image";

const GRAIN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`;

interface BlogHeroBannerProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export function BlogHeroBanner({ src, alt, priority = false }: BlogHeroBannerProps) {
  return (
    <div className="relative h-56 md:h-72 overflow-hidden bg-inverse">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover opacity-[0.82] img-brand-grade"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-inverse via-inverse/50 to-inverse/10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-inverse/60 via-inverse/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN_URL, backgroundRepeat: "repeat", opacity: 0.03 }}
      />
    </div>
  );
}

interface HubHeroBannerProps {
  src: string;
  alt: string;
}

export function HubHeroBanner({ src, alt }: HubHeroBannerProps) {
  return (
    <div className="relative h-48 md:h-64 overflow-hidden bg-inverse mb-10 rounded-sm">
      <Image
        src={src}
        alt={alt}
        fill
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 896px"
        className="object-cover opacity-[0.82] img-brand-grade"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-inverse via-inverse/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN_URL, backgroundRepeat: "repeat", opacity: 0.03 }}
      />
    </div>
  );
}
