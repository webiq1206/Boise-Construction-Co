import { HOW_P5_WORKS, HOW_P5_WORKS_TITLE } from '@/shared/siteContent';

export function HowP5Works({ heading = 'h2' }: { heading?: 'h2' | 'h3' }) {
  const Title = heading;
  return (
    <div>
      <Title className={heading === 'h2' ? 'font-serif text-2xl text-foreground' : 'ed-h4'}>
        {HOW_P5_WORKS_TITLE}
      </Title>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {HOW_P5_WORKS.map((line) => (
          <li key={line} className="text-sm text-muted-foreground">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
