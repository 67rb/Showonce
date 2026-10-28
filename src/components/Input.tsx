import { useId } from "react";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  name?: string;
  id?: string;
};

export function Input({
  label,
  hint,
  error,
  placeholder,
  type = "text",
  value,
  defaultValue,
  name,
  id,
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="mb-2 block text-small font-medium text-ink"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={
          "w-full rounded-lg border bg-white px-4 py-3 text-body text-site-ink placeholder:text-site-muted/70 " +
          "shadow-sm transition-colors duration-[150ms] focus:outline focus:outline-2 " +
          (error
            ? "border-danger focus:outline-danger"
            : "border-site-border focus:outline-accent")
        }
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-2 text-small text-wrong">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-2 text-small text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}