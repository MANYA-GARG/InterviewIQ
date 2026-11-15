export const clean = (arr = []) => arr.map((x) => String(x || '').trim()).filter(Boolean);
const dates = (s, e) => [s, e].filter(Boolean).join(' – ');
const contactOf = (b = {}) =>
  clean([b.email, b.phone, b.location, b.linkedin, b.github, b.portfolio]);

const Bullets = ({ items }) => {
  const list = clean(items);
  return list.length ? (
    <ul className="mt-1 list-disc space-y-0.5 pl-5">
      {list.map((b, i) => <li key={i}>{b}</li>)}
    </ul>
  ) : null;
};

const THEMES = {
  classic: {
    page: 'font-serif',
    name: 'text-center text-3xl font-bold tracking-wide',
    headline: 'text-center text-sm italic',
    contact: 'text-center text-xs',
    h2: 'border-b border-slate-800 pb-0.5 text-[13px] font-bold uppercase tracking-wider',
  },
  minimal: {
    page: 'font-sans',
    name: 'text-3xl font-light tracking-tight',
    headline: 'text-sm text-slate-600',
    contact: 'text-xs text-slate-500',
    h2: 'text-xs font-semibold uppercase tracking-[0.2em] text-slate-500',
  },
};

const Section = ({ t, title, children }) => (
  <section className="mt-4">
    <h2 className={t.h2}>{title}</h2>
    <div className="mt-2">{children}</div>
  </section>
);

const Experience = ({ items }) =>
  (items || []).filter((e) => e.company || e.role).map((e, i) => (
    <div key={i} className="mb-2">
      <div className="flex justify-between gap-3">
        <p className="font-semibold">{[e.role, e.company].filter(Boolean).join(' · ')}</p>
        <p className="shrink-0 text-xs text-slate-600">{dates(e.start, e.end)}</p>
      </div>
      <Bullets items={e.bullets} />
    </div>
  ));

const Projects = ({ items }) =>
  (items || []).filter((p) => p.name).map((p, i) => (
    <div key={i} className="mb-2">
      <p className="font-semibold">
        {p.name}
        {p.tech && <span className="font-normal text-slate-600"> | {p.tech}</span>}
      </p>
      {p.link && <p className="text-xs text-slate-500">{p.link}</p>}
      <Bullets items={p.bullets} />
    </div>
  ));

const Education = ({ items }) =>
  (items || []).filter((e) => e.school || e.degree).map((e, i) => (
    <div key={i} className="mb-1.5">
      <div className="flex justify-between gap-3">
        <p className="font-semibold">{e.school}</p>
        <p className="shrink-0 text-xs text-slate-600">{dates(e.start, e.end)}</p>
      </div>
      <p className="text-slate-700">
        {[e.degree, e.score && `Score: ${e.score}`].filter(Boolean).join(' · ')}
      </p>
    </div>
  ));

const SingleColumn = ({ data, theme }) => {
  const b = data.basics || {};
  const t = THEMES[theme];
  const skills = clean(data.skills);
  const certs = clean(data.certifications);

  return (
    <div className={`${t.page} min-h-[1123px] w-full bg-white p-10 text-[12.5px] leading-snug text-slate-900`}>
      <header>
        <h1 className={t.name}>{b.name || 'Your Name'}</h1>
        {b.title && <p className={t.headline}>{b.title}</p>}
        <p className={`mt-1 ${t.contact}`}>{contactOf(b).join('  •  ')}</p>
      </header>
      {data.summary && <Section t={t} title="Summary"><p>{data.summary}</p></Section>}
      {skills.length > 0 && <Section t={t} title="Skills"><p>{skills.join(' · ')}</p></Section>}
      {(data.experience || []).some((e) => e.company || e.role) && (
        <Section t={t} title="Experience"><Experience items={data.experience} /></Section>
      )}
      {(data.projects || []).some((p) => p.name) && (
        <Section t={t} title="Projects"><Projects items={data.projects} /></Section>
      )}
      {(data.education || []).some((e) => e.school || e.degree) && (
        <Section t={t} title="Education"><Education items={data.education} /></Section>
      )}
      {certs.length > 0 && (
        <Section t={t} title="Certifications">
          <ul className="list-disc pl-5">{certs.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </Section>
      )}
    </div>
  );
};

const SideTitle = ({ children }) => (
  <h2 className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-widest text-indigo-700">{children}</h2>
);

const Modern = ({ data }) => {
  const b = data.basics || {};
  const skills = clean(data.skills);
  const certs = clean(data.certifications);

  return (
    <div className="min-h-[1123px] w-full bg-white font-sans text-[12.5px] leading-snug text-slate-900">
      <header className="bg-indigo-700 px-10 py-7 text-white">
        <h1 className="text-3xl font-bold">{b.name || 'Your Name'}</h1>
        {b.title && <p className="mt-0.5 text-sm text-indigo-100">{b.title}</p>}
      </header>
      <div className="grid grid-cols-[1fr_230px] gap-8 px-10 pb-10 pt-4">
        <main>
          {data.summary && (<><SideTitle>Summary</SideTitle><p>{data.summary}</p></>)}
          {(data.experience || []).some((e) => e.company || e.role) && (
            <><SideTitle>Experience</SideTitle><Experience items={data.experience} /></>
          )}
          {(data.projects || []).some((p) => p.name) && (
            <><SideTitle>Projects</SideTitle><Projects items={data.projects} /></>
          )}
        </main>
        <aside className="border-l border-slate-200 pl-5">
          <SideTitle>Contact</SideTitle>
          <ul className="space-y-1 break-words text-xs">
            {contactOf(b).map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          {skills.length > 0 && (
            <>
              <SideTitle>Skills</SideTitle>
              <div className="flex flex-wrap gap-1">
                {skills.map((s, i) => (
                  <span key={i} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-800">{s}</span>
                ))}
              </div>
            </>
          )}
          {(data.education || []).some((e) => e.school || e.degree) && (
            <><SideTitle>Education</SideTitle><Education items={data.education} /></>
          )}
          {certs.length > 0 && (
            <>
              <SideTitle>Certifications</SideTitle>
              <ul className="list-disc space-y-0.5 pl-4 text-xs">{certs.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export const TEMPLATES = {
  modern: { label: 'Modern', Component: Modern },
  classic: { label: 'Classic', Component: ({ data }) => <SingleColumn data={data} theme="classic" /> },
  minimal: { label: 'Minimal', Component: ({ data }) => <SingleColumn data={data} theme="minimal" /> },
};