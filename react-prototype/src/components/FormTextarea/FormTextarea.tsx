import styles from './FormTextarea.module.css';

interface FormTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string | null;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
}

export function FormTextarea({
  id,
  label,
  value,
  onChange,
  onBlur,
  required,
  error,
  maxLength,
  placeholder,
  rows = 4,
}: FormTextareaProps) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
        {maxLength && (
          <span className={styles.counter}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={id}
        className={`${styles.control} ${error ? styles.controlError : ''}`}
        value={value}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
