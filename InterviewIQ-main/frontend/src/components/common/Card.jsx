export const Card = ({
  title,
  subtitle,
  children,
  className = '',
  bodyClassName = '',
  padding = 'p-6',
  bordered = true,
}) => {
  return (
    <section
      className={`rounded-xl bg-white ${bordered ? 'border border-slate-200' : ''} shadow-sm ${padding} ${className}`}
    >
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-600 leading-6">{subtitle}</p>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

export default Card;
