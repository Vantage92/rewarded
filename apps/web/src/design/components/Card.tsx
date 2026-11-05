import { useId, type ReactNode } from 'react';

export type CardVariant = 'standard' | 'marked' | 'status' | 'kans';

export interface CardProps {
  title?: ReactNode;
  /** Heading level of the title; screens own the single h1, so cards default to h2. */
  level?: 2 | 3 | 4;
  variant?: CardVariant;
  /** At most one action per card (UX §5.5). */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Card (UX §5.5): title, content, at most one action; never a whole-card button. */
export function Card({ title, level = 2, variant = 'standard', action, children, className }: CardProps) {
  const titleId = useId();
  const Heading = `h${level}` as const;
  return (
    <section className={['card', `card-${variant}`, className ?? ''].filter(Boolean).join(' ')} aria-labelledby={title ? titleId : undefined}>
      {title ? (
        <Heading id={titleId} className="card-title">
          {title}
        </Heading>
      ) : null}
      {children !== undefined ? <div className="card-body">{children}</div> : null}
      {action ? <div className="card-action">{action}</div> : null}
    </section>
  );
}
