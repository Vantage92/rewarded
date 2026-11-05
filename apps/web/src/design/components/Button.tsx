import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

export type ButtonVariant = 'primary' | 'secondary' | 'link' | 'danger';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  type?: 'button' | 'submit' | 'reset';
  /** UX §5.5: a disabled button always shows its reason in text next to it. */
  disabledReason?: ReactNode;
  block?: boolean;
  children: ReactNode;
}

const cls = (variant: ButtonVariant, block: boolean | undefined, extra: string | undefined) =>
  ['btn', `btn-${variant}`, block ? 'btn-block' : '', extra ?? ''].filter(Boolean).join(' ');

/** Button (UX §5.5): always a <button>, at least 48 px high, label is a verb. */
export function Button({ variant = 'primary', type = 'button', disabledReason, block, className, children, ...rest }: ButtonProps) {
  const reasonId = useId();
  const showReason = rest.disabled && disabledReason !== undefined;
  const describedBy = [rest['aria-describedby'], showReason ? reasonId : undefined].filter(Boolean).join(' ') || undefined;
  const button = (
    <button {...rest} type={type} className={cls(variant, block, className)} aria-describedby={describedBy}>
      {children}
    </button>
  );
  if (!showReason) return button;
  return (
    <span className={block ? 'btn-with-reason btn-block' : 'btn-with-reason'}>
      {button}
      <span id={reasonId} className="btn-reason">
        {disabledReason}
      </span>
    </span>
  );
}

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  block?: boolean;
}

/** A button that navigates to another page is an <a> (UX §5.5). */
export function ButtonLink({ variant = 'primary', block, className, ...rest }: ButtonLinkProps) {
  return <Link {...rest} className={cls(variant, block, className)} />;
}
