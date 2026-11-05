import { useId, type ReactNode } from 'react';

export interface SwitchProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Locked switches show their reason in text. */
  disabled?: boolean;
  description?: ReactNode;
}

/** Switch (UX §5.5): button with role="switch", label on the left via aria-labelledby. Opt-ins start off. */
export function Switch({ label, checked, onChange, disabled, description }: SwitchProps) {
  const id = useId();
  return (
    <div className="switch-row">
      <span id={`${id}-label`} className="switch-label">
        {label}
        {description ? (
          <span id={`${id}-desc`} className="switch-desc">
            {description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        className="toggle"
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
