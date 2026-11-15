export const Input = ({
  label,
  helperText,
  error,
  as = 'input',
  className = '',
  id,
  children,
  ...props
}) => {
  const Comp = as;
  const inputId = id || props.name;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <Comp
        id={inputId}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
          error ? 'border-red-400' : 'border-slate-300'
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText || error ? `${inputId}-help` : undefined}
        {...props}
      >
        {children}
      </Comp>
      {(error || helperText) && (
        <p id={`${inputId}-help`} className={`text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
