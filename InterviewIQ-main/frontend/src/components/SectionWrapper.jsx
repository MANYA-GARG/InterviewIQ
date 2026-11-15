import CleanContainer from './CleanContainer';

const SectionWrapper = ({
  id,
  title,
  subtitle,
  className = 'py-16',
  children,
}) => {
  return (
    <section id={id} className={className}>
      <CleanContainer>
        {(title || subtitle) && (
          <div className="mb-10 text-center">
            {title && (
              <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </CleanContainer>
    </section>
  );
};

export default SectionWrapper;
