import {type CSSProperties, type ReactNode} from 'react';
import {ArrowUpRight, ArrowRight} from 'lucide-react';
import {contentImageAlt} from '@/shared/imageAlts';
import {brands} from './family-content';

const Arrow = () => <ArrowUpRight size={18} aria-hidden="true"/>;

/**
 * Home hero and proof strip. This file is a Server Component on purpose:
 * the image and H1 are in the first HTML response, with no entrance
 * animation and no client bundle between the response and first paint.
 */
export function ApprovedHomeShell({children}: {children: ReactNode}) {
  const b = brands['construction'];
  const primary = '/estimate';
  return (
    <div className={`family-site family-${b.id}`} style={{'--f-accent': b.accent} as CSSProperties}>
      <link rel="preload" as="image" href={b.hero} fetchPriority="high" />
      <section className="f-hero"><img src={b.hero} alt={contentImageAlt(b.hero)||(b.id==='construction'?'White board-and-batten house with a dark gable roof and a covered front porch':b.id==='remodeling'?'Open kitchen and living space with warm wood and stone':b.id==='handyman'?'Careful adjustment of an interior door hinge':'Compact detached dwelling with cedar accents and a covered entrance')} fetchPriority="high" width="1600" height="1000"/><div className="f-hero-shade"/><div className="f-hero-copy"><p className="f-eyebrow">{b.kicker}</p><h1>Boise construction. Custom homes in Boise.<br/><em>A custom home builder, built around you.</em></h1>{b.id==='construction'&&<p>Boise Construction Co is a custom home builder and a design-build home builder in Boise, Idaho, founded in 2020. Custom homes, semi-custom homes, build-on-your-lot, shop homes, and the design and permitting that precede them. Serving Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Caldwell, and Garden City. Phone (208) 477-1169. Ranges are planning estimates, not quotes.</p>}<p>{b.title.join(" ")} {b.intro}</p><div className="f-actions"><a className="f-button" href={primary}>{b.action}<Arrow/></a><a className="f-link" href="#services">{b.secondary}<ArrowRight size={18}/></a></div><span className="estimator-promise">Describe your project. Our team will review it and prepare your estimate.</span></div></section>
      <div className="f-proof">{b.proof.map((p,i)=><div key={p}><span>0{i+1}</span><p>{p}</p></div>)}</div>
      {children}
    </div>
  );
}
