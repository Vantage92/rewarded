import type { ReactNode } from 'react';

export interface ProgressProps {
  value: number;
  max: number;
  /** Accessible name, e.g. "Dagdoel vandaag". */
  label: string;
  /** Value in words, e.g. "212 van 300 minuten"; also shown as text (UX §5.5). */
  valueText: string;
  /** Visible text; defaults to valueText. */
  children?: ReactNode;
}

const clamp = (value: number, max: number) => (max <= 0 ? 0 : Math.min(Math.max(value, 0), max));

export interface ProgressRingProps extends ProgressProps {
  variant?: 'day' | 'session';
  /** Diameter in px. */
  size?: number;
}

/** Progress ring (UX §5.5): 6 px stroke, no pulsing, always with the number in text. */
export function ProgressRing({ value, max, label, valueText, children, variant = 'day', size = 160 }: ProgressRingProps) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const now = clamp(value, max);
  const fraction = max > 0 ? now / max : 0;
  return (
    <div
      className={`ring ring-${variant}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-valuetext={valueText}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-text">{children ?? valueText}</span>
    </div>
  );
}

/** Bar variant (B1 earn progress). */
export function ProgressBar({ value, max, label, valueText, children }: ProgressProps) {
  const now = clamp(value, max);
  return (
    <div className="bar">
      <div className="bar-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={now} aria-valuetext={valueText}>
        <div className="bar-value" style={{ width: `${max > 0 ? (now / max) * 100 : 0}%` }} />
      </div>
      <span className="bar-text">{children ?? valueText}</span>
    </div>
  );
}
