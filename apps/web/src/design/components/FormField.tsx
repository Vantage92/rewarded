import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
}

export interface FormFieldProps {
  label: ReactNode;
  hint?: ReactNode | undefined;
  /** Error text, linked to the control (architecture §9.6, WCAG 3.3.1). */
  error?: ReactNode;
  required?: boolean | undefined;
  optional?: boolean | undefined;
  /** Render prop: spread the props on the control so label, hint and error are linked. */
  children: (props: FieldControlProps) => ReactNode;
}

/** Form field (UX §5.5, §5.8): visible label, hint and error linked with aria-describedby. */
export function FormField({ label, hint, error, required, optional, children }: FormFieldProps) {
  const { t } = useT();
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const props: FieldControlProps = { id };
  if (describedBy) props['aria-describedby'] = describedBy;
  if (error) props['aria-invalid'] = true;
  if (required) props['aria-required'] = true;
  return (
    <div className={error ? 'field field-error' : 'field'}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="field-optional"> ({t('form.optional')})</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {children(props)}
      {error ? (
        <p id={errorId} className="field-message">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'children'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
}

/** Text input on top of FormField. */
export function TextField({ label, hint, error, optional, required, className, ...input }: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} optional={optional} required={required}>
      {(props) => <input {...input} {...props} required={required} className={['input', className ?? ''].filter(Boolean).join(' ')} />}
    </FormField>
  );
}
