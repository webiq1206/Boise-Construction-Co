'use client';
import {type CSSProperties} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {familyButtonClass} from '@/components/family/Button';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {FAQSection} from '@/components/FAQSection';
import {contentImageAlt} from '@/shared/imageAlts';
import {PlanningRangeExplorer} from '@/components/PlanningRangeExplorer';
import {brands,cities,serviceExtras} from './family-content';
import {DesignGallery} from '@/components/sections/DesignGallery';
const Arrow=()=> <ArrowUpRight size={18} aria-hidden="true"/>;
function Title({lines}:{lines:string[]}){return <>{lines[0]}<br/><em>{lines[1]}</em></>}
function Rows({items,numbered=false}:{items:[string,string][];numbered?:boolean}){return <Accordion type="single" collapsible className="f-accordion">{items.map(([title,copy],i)=><AccordionItem value={String(i)} key={title}><AccordionTrigger>{numbered&&<span className="f-number">0{i+1}</span>}<span>{title}</span></AccordionTrigger><AccordionContent>{copy}</AccordionContent></AccordionItem>)}</Accordion>}

/**
 * The homepage below the hero, in the order a homeowner has the conversation:
 * the ways to build (picture cards), the lot question (a split panel), the
 * planning number (its own dark band), why the budget is fair, the way we work,
 * what happens next, who you are hiring, a quiet mid-page ask, where we build,
 * and the last objections. The request form follows in app/page.tsx.
 */
export function ApprovedHome(){const b=brands['construction'];const primary='/estimate';
 return <div className={`family-site family-${b.id}`} style={{'--f-accent':b.accent} as CSSProperties}>

 {/* 1. Six ways to build, one photograph each. */}
 <section className="f-section f-container" id="services">
  <div className="f-section-top"><div><p className="f-eyebrow">FIND YOUR STARTING POINT</p><h2><Title lines={b.serviceTitle}/></h2></div><p>{b.serviceIntro}</p></div>
  <div className="fr-cards">
   {b.services.map((s,i)=><a className="fr-card" key={s.slug} href={s.live || `/services/${s.slug}`}>
    <span className="fr-card-media"><img src={s.image} alt={contentImageAlt(s.image)||s.name} loading={i<3?'eager':'lazy'} width="1000" height="750"/></span>
    <span className="fr-card-body"><h3>{s.name}</h3><p>{s.summary}</p><span className="f-link">Explore this service <Arrow/></span></span>
   </a>)}
  </div>
  <div className="fr-cards-more">
   <span>Also:</span>
   {serviceExtras.construction.map(([label,href])=><a className="f-link" key={href} href={href}>{label} <Arrow/></a>)}
   <a className="f-link" href="/services">View all services <Arrow/></a>
  </div>
 </section>

 {/* 2. The look: six photographs from the company's own campaign library. */}
 <DesignGallery
  id="the-homes"
  eyebrow="HOMES FOR THE FOOTHILLS"
  title="Built for the view."
  accent="Made to last."
  intro="Stone, white oak and big glass, planned around the light and the land. Every home starts with the site, and the rooms are drawn to frame what you came to Idaho for."
  photos={[
   {src:'/family/drive/landscape-1-stone-modern-foothill-home.webp',alt:'Stone and dark-sided modern home with large lit windows against the Boise foothills at sunset',label:'Exterior',wide:true},
   {src:'/family/drive/square-2-stone-entry-with-oak-front-door.webp',alt:'Stacked stone entry with a tall white oak front door and ornamental grasses',label:'Entry'},
   {src:'/family/drive/square-1-oak-kitchen-with-foothill-view.webp',alt:'White oak kitchen with a stone island and a black-framed window onto the foothills',label:'Kitchen'},
   {src:'/family/drive/landscape-2-great-room-with-stone-fireplace.webp',alt:'Vaulted great room with a stone fireplace, wood ceiling and floor-to-ceiling windows onto the hills',label:'Great room',wide:true},
   {src:'/family/drive/landscape-3-covered-patio-with-outdoor-fireplace.webp',alt:'Covered patio with a stacked stone outdoor fireplace and lounge chairs facing the mountains at dusk',label:'Covered patio',wide:true},
   {src:'/family/drive/square-3-soaking-tub-with-foothill-view.webp',alt:'Freestanding soaking tub beneath a large window looking out on golden foothills',label:'Primary bath'},
  ]}
  note="Design imagery showing the quality and character we build toward. Ask to see plans, selections and references from past clients during your planning session."
 />

 {/* 2. The lot question, as an image-and-panel split. */}
 <section className="fr-panel" id="own-a-lot" aria-labelledby="own-a-lot-title">
  <div className="fr-panel-media"><img src="/family/p5-p5-construction-branded.webp" alt={contentImageAlt('/family/p5-p5-construction-branded.webp')||'A Treasure Valley building lot with the foothills behind it'} loading="lazy" width="1200" height="900"/></div>
  <div className="fr-panel-body">
   <p className="f-eyebrow">BEFORE YOU COMMIT TO A PLAN</p>
   <h2 id="own-a-lot-title">Already own<br/><em>a lot?</em></h2>
   <p>A $950 lot evaluation answers the site questions that change the budget before design starts.</p>
   <ul className="fr-panel-list">
    <li><span>01</span>Utilities: power, water, sewer or septic and well options on the parcel</li>
    <li><span>02</span>Septic and well feasibility when the lot is not on municipal service</li>
    <li><span>03</span>Soil, slope, access, and setbacks that shape what can be built</li>
   </ul>
   <a className={familyButtonClass({variant:'secondary',size:'lg'})} href="/services/lot-evaluation">Lot evaluation</a>
  </div>
 </section>

 {/* 3. The number, on its own band. */}
 <PlanningRangeExplorer />

 {/* 4. The way we work (paper, between the two dark bands). */}
 <section className="f-section f-container f-two" id="why-choose-us"><div className="f-sticky"><p className="f-eyebrow">THE WAY WE WORK</p><h2>Good work.<br/><em>A better experience.</em></h2><p>Clear expectations, thoughtful decisions, and someone accountable for the work. That is the P5 standard.</p></div><Rows items={b.approach}/></section>

 {/* 5. Why the budget is fair. */}
 <section className="f-value"><img src={b.valueImage} alt={contentImageAlt(b.valueImage)||''} loading="lazy" width="1200" height="900"/><div><p className="f-eyebrow">WHERE YOUR MONEY GOES</p><h2><Title lines={b.valueTitle}/></h2>{b.value.split(/(?<=\.)\s+/).map((sentence)=><p key={sentence}>{sentence}</p>)}<a className="f-link" href={primary}>{b.action}<Arrow/></a></div></section>

 {/* 6. What happens next. */}
 <section className="f-section f-container f-two" id="how-we-build"><div className="f-sticky"><p className="f-eyebrow">KNOW WHAT HAPPENS NEXT</p><h2>A clear plan.<br/><em>At every step.</em></h2><p>Good work starts with a shared understanding of the scope, the decisions, and the next step.</p></div><Rows items={b.process} numbered/></section>

 {/* 7. Who you are hiring. Full family photograph, never cropped. */}
 <section className="f-section f-container" id="who-you-are-hiring" aria-labelledby="who-hiring-title">
  <div className="fr-founder">
   <img className="family-people-photo" src="/images/about/perkins-family-meridian-idaho-1x1.webp" alt="Nick Perkins with his wife and five children at a pumpkin patch" width="2048" height="2048" loading="lazy" style={{objectFit:'contain'}}/>
   <div>
    <p className="f-eyebrow">WHO YOU ARE HIRING</p>
    <h2 id="who-hiring-title">Nick Perkins, founder.</h2>
    <p>Construction project manager with a bachelor&apos;s degree in Construction with an emphasis in Project Management.</p>
    <ul className="founder-facts">
     <li>More than a decade of custom homes, remodels and developments.</li>
     <li>Founded P5 in Colorado in 2020.</li>
     <li>Moved the family and the company to the Treasure Valley in 2025.</li>
     <li>Husband, father of five, Meridian.</li>
    </ul>
    <blockquote>&ldquo;Work hard. Keep your word. Treat people right.&rdquo;</blockquote>
    <p><a className="f-link" href="/about">Read Nick&apos;s story <Arrow/></a></p>
   </div>
  </div>
 </section>

 {/* 8. A quiet ask halfway down. */}
 <section className="fr-cta-strip" aria-label="Request a quote">
  <div className="f-container">
   <div><h2>Ready to talk about your build?</h2><p>A free planning session, a line-item budget before ground breaks, and no expectation to go further.</p></div>
   <div className="fr-cta-strip-actions"><a className="f-button f-dark" href={primary}>Request a quote</a><a className="f-link" href="/contact">Call or text us <Arrow/></a></div>
  </div>
 </section>

 {/* 9. Where we build. */}
 <section className="f-area f-section f-container"><p className="f-eyebrow">AT HOME IN IDAHO</p><h2>Local people.<br/><em>Valley-wide reach.</em></h2><p>Serving homeowners throughout the Treasure Valley.</p><details className="city-fold"><summary>Cities we serve</summary><nav className="fr-cities" aria-label="Service area cities">{cities.map(city=><a key={city} href={`/areas/${city.toLowerCase().replaceAll(" ","-")}`} aria-label={`Home builders in ${city}`}>{city}</a>)}</nav></details></section>

 <FAQSection/>
 </div>;}
