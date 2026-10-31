import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { PrimaryCta } from './PrimaryCta';

/** Public-page layout. Application routes retain their dedicated interfaces. */
export function InteriorPage({children,kind='detail'}:{children:ReactNode;kind?:string}) {
  return <div className={`approved-interior interior-${kind}`}>{children}</div>;
}

/** The page-body primary action (PrimaryCta) in its interior placements. */
export function InteriorEstimateLink({label='Request a quote'}:{label?:string}) {
  return <PrimaryCta className="interior-estimate-link" href="/estimate">{label}</PrimaryCta>;
}

/** The label the site uses on generated and concept renders. */
export const CONCEPT_IMAGERY_LABEL = 'Concept design imagery';

/**
 * The approved split-detail and editorial-introduction compositions.
 * Hero photography is concept renders unless stated otherwise, so the image
 * carries the same "Concept design imagery" label used elsewhere on the site.
 * Pass `imageLabel={false}` only for a real photograph (the About family photo).
 */
export function InteriorHero({children,imageSrc,imageAlt='',imageCaption,layout='split',estimateAction=false,peopleSafe=false,imageLabel=CONCEPT_IMAGERY_LABEL}:{children:ReactNode;imageSrc?:string;imageAlt?:string;imageCaption?:string;layout?:'split'|'editorial'|'contact';estimateAction?:boolean;peopleSafe?:boolean;imageLabel?:string|false}) {
  return <section className={`interior-hero interior-hero-${layout}${imageSrc?'':' interior-hero-text'}`}>
    <div className="interior-hero-copy">{children}{estimateAction&&<div className="interior-hero-action"><InteriorEstimateLink/></div>}</div>
    {imageSrc&&<div className={`interior-hero-image${peopleSafe?' interior-hero-image--people':''}`}><img src={imageSrc} alt={imageAlt} width={1400} height={1100} fetchPriority="high"/>{imageLabel&&<span className="interior-hero-image-label">{imageLabel}</span>}</div>}
    {imageCaption&&<p className="interior-hero-caption">{imageCaption}</p>}
  </section>;
}

/** Reusable secondary column, with the estimator as its single dominant action. */
export function InteriorProjectAside({children}:{children?:ReactNode}) {
  return <aside className="interior-project-aside"><p className="interior-eyebrow">YOUR PROJECT. REVIEWED BY OUR TEAM.</p><p className="interior-statement">Start with<br/><em>what you know.</em></p><p>Describe your project and share plans or photos for our team to review.</p><InteriorEstimateLink/>{children}<a className="interior-text-link" href="/contact">Talk through the details<ArrowUpRight size={16} aria-hidden="true"/></a></aside>;
}

export function InteriorDocument({heading,children,contents=[]}:{heading:ReactNode;children:ReactNode;contents?:{id:string;label:string}[]}) {
  return <div className="interior-document"><header className="interior-document-heading">{heading}</header><div className="interior-document-grid"><aside className="interior-document-index">{contents.length>0&&<nav aria-label="On this page"><p className="interior-eyebrow">ON THIS PAGE</p>{contents.map(item=><a href={`#${item.id}`} key={item.id}>{item.label}</a>)}</nav>}<InteriorEstimateLink/></aside><div className="interior-document-main">{children}</div></div></div>;
}
