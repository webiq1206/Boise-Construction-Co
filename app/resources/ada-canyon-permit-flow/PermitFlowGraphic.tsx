import { cn } from '@/lib/utils';

const STEPS = [
  { n: 1, title: 'Define scope', body: 'Layout, structural, plumbing, or electrical changes?' },
  { n: 2, title: 'Confirm jurisdiction', body: 'Check the parcel with the city or county building department' },
  { n: 3, title: 'Design & plans', body: 'Stamped sheets when required' },
  { n: 4, title: 'Submit application', body: 'Correct city or county portal, required documents and fees' },
  { n: 5, title: 'Plan review', body: 'Confirm the current queue and respond to corrections' },
  { n: 6, title: 'Approved → build', body: 'Rough inspections before cover-up' },
  { n: 7, title: 'Final inspection', body: 'Complete final approvals and required occupancy clearance' },
];

function FlowStep({
  n,
  title,
  body,
  className,
}: {
  n: number;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 relative',
        className,
      )}
    >
      <span className="absolute -top-2.5 -left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-normal text-accent-foreground">
        {n}
      </span>
      <p className="font-normal text-sm text-foreground mt-1">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function CountyColumn({
  title,
  subtitle,
  cities,
  accentClass,
}: {
  title: string;
  subtitle: string;
  cities: string[];
  accentClass: string;
}) {
  return (
    <div className={cn('rounded-xl border-2 p-5 md:p-6', accentClass)}>
      <h3 className="text-lg font-normal text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-foreground">
        {cities.map((c) => (
          <li key={c} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PermitFlowGraphic() {
  return (
    <div className="space-y-10" data-testid="permit-flow-graphic">
      <div>
        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          Typical permit path
        </h2>
        <div className="ed-cards-3 gap-3">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative">
              <FlowStep {...step} />
              {i < STEPS.length - 1 && (
                <div
                  className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-border"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          Who reviews the property?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <CountyColumn
            title="Inside city limits"
            subtitle="Start with the city building department"
            cities={['Confirm the parcel boundary', 'Ask which trade permits are separate', 'Use the city application checklist']}
            accentClass="border-accent/40 bg-accent/5"
          />
          <CountyColumn
            title="Unincorporated property"
            subtitle="Start with Ada or Canyon County"
            cities={['Confirm the parcel jurisdiction', 'Check road, utility and health approvals', 'Ask about any separate trade authority']}
            accentClass="border-border bg-muted/30"
          />
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border p-5 bg-muted/20">
        <h2 className="text-sm font-normal text-foreground mb-3">Usually needs permits</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span>Wall removal / beams</span>
          <span>Plumbing relocations</span>
          <span>Panel or circuit additions</span>
          <span>Additions & ADUs</span>
        </div>
        <h2 className="text-sm font-normal text-foreground mt-5 mb-3">Ask before assuming an exemption</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span>Fixture replacement may need a trade permit</span>
          <span>Cabinet refacing without trade changes</span>
          <span>Paint & cosmetic finishes</span>
          <span>Replacing equipment in the same location</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          Questions to confirm before scheduling
        </h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-normal text-foreground">Phase</th>
              <th className="text-left py-2 pr-4 font-normal text-foreground">Confirm with</th>
              <th className="text-left py-2 font-normal text-foreground">Ask about</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4">Plan preparation</td>
              <td className="py-2 pr-4">Designer and required reviewers</td>
              <td className="py-2">Complete plans and supporting approvals</td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4">Plan review</td>
              <td className="py-2 pr-4">City or county building department</td>
              <td className="py-2">Current review queue and correction cycles</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Inspections</td>
              <td className="py-2 pr-4">Building and trade authorities</td>
              <td className="py-2">Required stages before covering work</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
