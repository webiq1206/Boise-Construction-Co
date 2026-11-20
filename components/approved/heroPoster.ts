const MEDIA = "/images/construction/boise-construction-co-";

/** The homepage hero poster, kept outside the client video module so server code reads the strings. */
export const HERO_POSTER = `${MEDIA}poster.jpg`;
/** Smaller copies of the same poster, so a phone never downloads the 1920px file (SEO audit CON-S5). */
export const HERO_POSTER_SRCSET = `${MEDIA}poster-768.jpg 768w, ${MEDIA}poster-1280.jpg 1280w, ${HERO_POSTER} 1920w`;
