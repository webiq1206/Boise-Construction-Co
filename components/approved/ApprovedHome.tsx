'use client';

import { type CSSProperties } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { FAQSection } from '@/components/FAQSection';
import { contentImageAlt } from '@/shared/imageAlts';
import { PlanningRangeExplorer } from '@/components/PlanningRangeExplorer';
import { ProjectGallerySection } from '@/components/sections/ProjectGallerySection';
import { brands, cities } from './family-content';

const Arrow = () => <ArrowUpRight size={18} aria-hidden="true" />;

function Title({ lines }: { lines: string[] }) {
  return (
    <>
      {lines[0]}
      <br />
      <em>{lines[1]}</em>
    </>
  );
}

function Rows({
  items,
  numbered = false,
}: {
  items: [string, string][];
  numbered?: boolean;
}) {
  return (
    <Accordion type="single" collapsible defaultValue="0" className="f-accordion">
      {items.map(([title, copy], i) => (
        <AccordionItem value={String(i)} key={title}>
          <AccordionTrigger>
            {numbered && <span className="f-number">0{i + 1}</span>}
            <span>{title}</span>
          </AccordionTrigger>
          <AccordionContent>{copy}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const PHOTO_BREAKS = [
  {
    src: '/images/projects/eagle-mountain-modern/eagle-custom-home-great-room.webp',
    alt: 'Illustrative great room with white oak, plaster walls, and black steel windows',
    caption: 'Illustrative · great room, white oak and plaster',
  },
  {
    src: '/images/projects/eagle-mountain-modern/eagle-custom-home-kitchen.webp',
    alt: 'Illustrative mountain-modern kitchen with limestone and warm wood cabinetry',
    caption: 'Illustrative · kitchen, limestone and warm wood',
  },
  {
    src: '/images/construction/covered-outdoor-living.webp',
    alt: 'Covered outdoor living space on a Treasure Valley custom home',
    caption: 'Outdoor living · Treasure Valley',
  },
  {
    src: '/images/projects/eagle-farmhouse-exterior.webp',
    alt: 'Illustrative farmhouse-style custom home exterior in Eagle, Idaho',
    caption: 'Illustrative · Eagle farmhouse exterior',
  },
] as const;

function PhotoBreak({
  src,
  alt,
  caption,
  tall = false,
}: {
  src: string;
  alt: string;
  caption: string;
  tall?: boolean;
}) {
  return (
    <figure className={`f-photo-break${tall ? ' f-photo-break-tall' : ''}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width="1600"
        height="1000"
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function PhotoMosaic() {
  const tiles = [
    {
      src: '/images/projects/boise-craftsman-exterior.webp',
      alt: 'Illustrative craftsman custom home exterior in Boise',
      label: 'Boise craftsman · illustrative',
    },
    {
      src: '/images/projects/meridian-ranch-kitchen.webp',
      alt: 'Illustrative ranch-style kitchen in Meridian, Idaho',
      label: 'Meridian kitchen · illustrative',
    },
    {
      src: '/images/projects/eagle-farmhouse-great-room.webp',
      alt: 'Illustrative farmhouse great room in Eagle, Idaho',
      label: 'Eagle great room · illustrative',
    },
    {
      src: '/images/construction/new-home-kitchen.webp',
      alt: 'New custom home kitchen with stone counters',
      label: 'New home kitchen',
    },
  ] as const;

  return (
    <div className="f-photo-mosaic" aria-label="Recent Treasure Valley home interiors and exteriors">
      {tiles.map((tile) => (
        <figure key={tile.src} className="f-photo-mosaic-tile">
          <img src={tile.src} alt={tile.alt} loading="lazy" width="800" height="600" />
          <figcaption>{tile.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function ApprovedHome() {
  const b = brands.construction;
  const primary = '/estimate';

  const processBlock = (
    <section className="f-section f-container f-two" id="how-we-build">
      <div className="f-sticky">
        <p className="f-eyebrow">KNOW WHAT HAPPENS NEXT</p>
        <h2>
          A clear plan.
          <br />
          <em>At every step.</em>
        </h2>
        <p>Good work starts with a shared understanding of the scope, the decisions, and the next step.</p>
      </div>
      <Rows items={b.process} numbered />
    </section>
  );

  const approachBlock = (
    <section className="f-section f-container f-two" id="why-choose-us">
      <div className="f-sticky">
        <p className="f-eyebrow">THE WAY WE WORK</p>
        <h2>
          Good work.
          <br />
          <em>A better experience.</em>
        </h2>
        <p>Clear expectations, thoughtful decisions, and someone accountable for the work. That is the P5 standard.</p>
      </div>
      <Rows items={b.approach} />
    </section>
  );

  return (
    <div
      className={`family-site family-${b.id}`}
      style={{ '--f-accent': b.accent } as CSSProperties}
    >
      <section className="f-hero" data-p5-hero>
        <img
          src={b.hero}
          alt={
            contentImageAlt(b.hero) ||
            'Mountain-modern custom home with charcoal stucco, ledgestone, and a dark metal roof'
          }
          fetchPriority="high"
          width="1600"
          height="1000"
        />
        <div className="f-hero-shade" />
        <div className="f-hero-copy">
          <p className="f-brand-mark">Boise Construction Co</p>
          <h1>
            Custom homes in Boise.
            <br />
            <em>Built around you.</em>
          </h1>
          <p className="f-hero-summary">
            Line-item budgets before we break ground, written updates every Friday, one accountable design-build team.
          </p>
          <div className="f-actions">
            <a className="f-button" href={primary}>
              {b.action}
              <Arrow />
            </a>
            <a className="f-link f-hero-secondary" href="#services">
              {b.secondary}
              <ArrowRight size={18} />
            </a>
          </div>
          <span className="estimator-promise">
            Describe your project. Our team replies within one business day.
          </span>
        </div>
      </section>

      <div className="f-proof">
        {b.proof.slice(0, 3).map((p, i) => (
          <div key={p}>
            <span>0{i + 1}</span>
            <p>{p}</p>
          </div>
        ))}
      </div>
      <p className="f-proof-note">{b.proof[3]}</p>

      <PhotoBreak {...PHOTO_BREAKS[0]} tall />

      <section className="f-section f-container" id="services">
        <div className="f-section-top">
          <div>
            <p className="f-eyebrow">FIND YOUR STARTING POINT</p>
            <h2>
              <Title lines={b.serviceTitle} />
            </h2>
          </div>
          <p>{b.serviceIntro}</p>
        </div>
        <Tabs defaultValue={b.services[0].slug} className="f-explorer">
          <TabsList className="f-tabs">
            {b.services.slice(0, 3).map((s) => (
              <TabsTrigger value={s.slug} key={s.slug}>
                {s.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {b.services.slice(0, 3).map((s, i) => (
            <TabsContent key={s.slug} value={s.slug}>
              <div className="f-scene">
                <a
                  className="f-scene-image"
                  href={s.live || `/services/${s.slug}`}
                  aria-label={`Explore ${s.name.toLowerCase()}`}
                >
                  <img
                    src={s.image}
                    alt={contentImageAlt(s.image) || s.name}
                    loading="lazy"
                    width="1000"
                    height="750"
                  />
                </a>
                <div className="f-scene-copy">
                  <p className="f-eyebrow">
                    0{i + 1} / {b.name.replace('Boise ', '')}
                  </p>
                  <h3>{s.name}</h3>
                  <p>{s.summary}</p>
                  <ul>
                    {s.includes.slice(0, 2).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <a className="f-link" href={s.live || `/services/${s.slug}`}>
                    Explore this service <Arrow />
                  </a>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <a className="f-link f-browse-all" href="/services">
          View all services <Arrow />
        </a>
      </section>

      <PhotoMosaic />

      <section className="f-section f-container" id="own-a-lot" aria-labelledby="own-a-lot-title">
        <div className="f-lot-split">
          <div className="f-lot-copy">
            <div className="f-section-top f-section-top-stack">
              <div>
                <p className="f-eyebrow">BEFORE YOU COMMIT TO A PLAN</p>
                <h2 id="own-a-lot-title">Already own a lot?</h2>
              </div>
              <p>
                A $950 lot evaluation answers the site questions that change the budget before design starts.
              </p>
            </div>
            <ul className="f-lot-list">
              <li>Utilities: power, water, sewer or septic and well options on the parcel</li>
              <li>Septic and well feasibility when the lot is not on municipal service</li>
              <li>Soil, slope, access, and setbacks that shape what can be built</li>
            </ul>
            <a className="f-button f-dark" href="/services/lot-evaluation">
              Lot evaluation <Arrow />
            </a>
          </div>
          <div className="f-lot-photo">
            <img
              src="/images/construction/foothills-building-site.webp"
              alt="Foothills building site ready for a custom home in the Treasure Valley"
              loading="lazy"
              width="1000"
              height="750"
            />
          </div>
        </div>
      </section>

      <PhotoBreak {...PHOTO_BREAKS[1]} />

      <PlanningRangeExplorer />

      <section className="f-value">
        <img
          src={b.valueImage}
          alt={contentImageAlt(b.valueImage) || ''}
          loading="lazy"
          width="1200"
          height="900"
        />
        <div>
          <p className="f-eyebrow">WHERE YOUR MONEY GOES</p>
          <h2>
            <Title lines={b.valueTitle} />
          </h2>
          <p>{b.value}</p>
          <a className="f-link" href={primary}>
            {b.action}
            <Arrow />
          </a>
        </div>
      </section>

      <PhotoBreak {...PHOTO_BREAKS[2]} />

      {approachBlock}
      {processBlock}

      <ProjectGallerySection limit={3} showViewAll />

      <PhotoBreak {...PHOTO_BREAKS[3]} />

      <section
        className="f-section f-container"
        id="who-you-are-hiring"
        aria-labelledby="who-hiring-title"
      >
        <div className="f-who-hiring">
          <img
            className="f-who-hiring-photo"
            src="/images/about/perkins-family-meridian-idaho.webp"
            alt="Nick Perkins with his wife and five children at a pumpkin patch"
            width="2048"
            height="2048"
            loading="lazy"
          />
          <div className="f-who-hiring-copy">
            <p className="f-eyebrow">WHO YOU ARE HIRING</p>
            <h2 id="who-hiring-title">Nick Perkins, founder</h2>
            <p>
              Construction project manager with a bachelor&apos;s degree in Construction with an
              emphasis in Project Management, and more than a decade of custom homes, remodels and
              developments. He founded P5 in Colorado in 2020 and moved the family and the company to
              the Treasure Valley in 2025. Husband, father of five, Meridian.
            </p>
            <p>&ldquo;Work hard. Keep your word. Treat people right.&rdquo;</p>
            <a className="f-link" href="/about">
              Read Nick&apos;s story <Arrow />
            </a>
          </div>
        </div>
      </section>

      <section className="f-area f-section f-container">
        <p className="f-eyebrow">AT HOME IN IDAHO</p>
        <h2>
          Local people.
          <br />
          <em>Valley-wide reach.</em>
        </h2>
        <p>Serving homeowners throughout the Treasure Valley.</p>
        <div>
          {cities.map((city) => (
            <a key={city} href={`/areas/${city.toLowerCase().replaceAll(' ', '-')}`}>
              {city}
              <Arrow />
            </a>
          ))}
        </div>
      </section>

      <FAQSection />
    </div>
  );
}
