import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { EXPERT_AUTHOR } from '@/shared/authors';

/**
 * Named-expert author block for the end of guides and articles. Reinforces
 * E-E-A-T with a real, accountable person linked to the described /about#team
 * entity, matching the `Person` author on the Article schema.
 */
export function AuthorBio() {
  return (
    <aside
      className="mt-12 pt-8 border-t border-border"
      data-testid="author-bio"
      aria-label={`About the author, ${EXPERT_AUTHOR.name}`}
    >
      <p className="brc-label mb-4">Written by</p>
      <div className="flex items-start gap-4">
        <img
          src="/brand/icons/boise-remodeling-co-emblem-light.svg"
          alt=""
          aria-hidden="true"
          width={52}
          height={52}
          className="h-[52px] w-[52px] shrink-0 rounded-sm"
        />
        <div className="min-w-0">
          <h2 className="font-sans font-normal text-base text-foreground">
            {EXPERT_AUTHOR.name}
          </h2>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {EXPERT_AUTHOR.role}, Boise Remodeling Co
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {EXPERT_AUTHOR.bio}
          </p>
          <Link
            href={EXPERT_AUTHOR.url}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent-legible hover:underline"
          >
            More about our team
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
