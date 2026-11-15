import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Plus, Save, Sparkles, Trash2, Undo2, Wand2 } from 'lucide-react';
import { resumeBuilderService, resumeService } from '../services/api';
import { TEMPLATES, clean } from '../components/resume/ResumeTemplates';

const SECTIONS = {
  experience: {
    title: 'Experience',
    blank: { company: '', role: '', start: '', end: '', bullets: [''] },
    fields: [['role', 'Role'], ['company', 'Company'], ['start', 'Start'], ['end', 'End']],
    bullets: true,
  },
  projects: {
    title: 'Projects',
    blank: { name: '', tech: '', link: '', bullets: [''] },
    fields: [['name', 'Project name'], ['tech', 'Tech stack'], ['link', 'Link']],
    bullets: true,
  },
  education: {
    title: 'Education',
    blank: { school: '', degree: '', start: '', end: '', score: '' },
    fields: [['school', 'School / College'], ['degree', 'Degree'], ['start', 'Start'], ['end', 'End'], ['score', 'CGPA / %']],
    bullets: false,
  },
};

const BASICS = [
  ['name', 'Full name'], ['title', 'Headline (e.g. Full Stack Developer)'], ['email', 'Email'],
  ['phone', 'Phone'], ['location', 'Location'], ['linkedin', 'LinkedIn URL'],
  ['github', 'GitHub URL'], ['portfolio', 'Portfolio URL'],
];

const Field = ({ label, value, onChange, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
    <input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="input-field !py-2 text-sm"
    />
  </label>
);

const Panel = ({ title, action, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const ResumeBuilder = () => {
  const [drafts, setDrafts] = useState([]);
  const [draft, setDraft] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [importId, setImportId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [jd, setJd] = useState('');
  const [tailorNotes, setTailorNotes] = useState(null);
  const [undoData, setUndoData] = useState(null);

  const load = useCallback(async (selectId) => {
    try {
      const [dRes, rRes] = await Promise.allSettled([
        resumeBuilderService.list(),
        resumeService.getAll(),
      ]);
      const list = dRes.status === 'fulfilled' ? dRes.value.data?.drafts || [] : [];
      setDrafts(list);
      const rl = rRes.status === 'fulfilled' ? rRes.value.data?.resumes || [] : [];
      setResumes(rl);
      if (rl.length && !importId) setImportId(rl[0]._id);
      const pick = (selectId && list.find((d) => d._id === selectId)) || list[0] || null;
      setDraft(pick);
      setDirty(false);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (fn) => {
    setDraft((d) => {
      const data = structuredClone(d.data);
      fn(data);
      return { ...d, data };
    });
    setDirty(true);
  };

  const createDraft = async (fromResumeId) => {
    setBusy('create');
    try {
      const res = await resumeBuilderService.create({
        title: 'My Resume', template: 'modern', fromResumeId,
      });
      toast.success(
        fromResumeId
          ? res.data?.usedAI ? 'Imported and structured with AI' : 'Imported (AI unavailable, basic details only)'
          : 'New resume created'
      );
      await load(res.data?.draft?._id);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not create resume', { id: 'rb-err' });
    } finally {
      setBusy('');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await resumeBuilderService.update(draft._id, {
        title: draft.title, template: draft.template, data: draft.data,
      });
      setDirty(false);
      setDrafts((l) => l.map((d) => (d._id === draft._id ? { ...d, title: draft.title } : d)));
      toast.success('Saved', { id: 'rb-saved' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed', { id: 'rb-err' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await resumeBuilderService.remove(draft._id);
      toast.success('Deleted');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const download = () => {
    const prev = document.title;
    document.title = draft.title || 'Resume';
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  };

  const improve = async (kind, i) => {
    const item = draft.data[kind][i];
    const bullets = clean(item.bullets);
    if (!bullets.length) return toast.error('Add at least one bullet first');
    const key = `${kind}-${i}`;
    setBusy(key);
    try {
      const context = kind === 'experience'
        ? `${item.role || ''} at ${item.company || ''}`
        : `Project ${item.name || ''} (${item.tech || ''})`;
      const res = await resumeBuilderService.improve({
        bullets, context, targetRole: draft.data.basics.title,
      });
      setSuggestion({ kind, i, bullets: res.data?.bullets || [] });
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'AI failed', { id: 'rb-err' });
    } finally {
      setBusy('');
    }
  };

  const applySuggestion = () => {
    update((d) => { d[suggestion.kind][suggestion.i].bullets = suggestion.bullets; });
    setSuggestion(null);
  };

  const makeSummary = async () => {
    setBusy('summary');
    try {
      const res = await resumeBuilderService.summary({ data: draft.data });
      update((d) => { d.summary = res.data?.summary || d.summary; });
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'AI failed', { id: 'rb-err' });
    } finally {
      setBusy('');
    }
  };

  const tailor = async () => {
    setBusy('tailor');
    try {
      const res = await resumeBuilderService.tailor({ data: draft.data, jobDescription: jd });
      setUndoData(draft.data);
      setDraft((d) => ({ ...d, data: res.data.data }));
      setDirty(true);
      setTailorNotes({ changes: res.data.changes || [], missing: res.data.missingKeywords || [] });
      toast.success('Tailored to the job description');
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'AI failed', { id: 'rb-err' });
    } finally {
      setBusy('');
    }
  };

  const undoTailor = () => {
    setDraft((d) => ({ ...d, data: undoData }));
    setUndoData(null);
    setTailorNotes(null);
    setDirty(true);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" /></div>;
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Resume Builder</h1>
        <p className="text-slate-600">Build an ATS-friendly resume from templates, or import one you already uploaded.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Start from scratch">
            <button type="button" className="btn-primary" disabled={!!busy} onClick={() => createDraft()}>
              <Plus className="mr-1 inline h-4 w-4" /> New blank resume
            </button>
          </Panel>
          <Panel title="Import an uploaded resume (AI)">
            {resumes.length ? (
              <div className="space-y-3">
                <select value={importId} onChange={(e) => setImportId(e.target.value)} className="input-field text-sm" aria-label="Uploaded resume">
                  {resumes.map((r) => <option key={r._id} value={r._id}>{r.filename}</option>)}
                </select>
                <button type="button" className="btn-primary" disabled={!!busy} onClick={() => createDraft(importId)}>
                  <Wand2 className="mr-1 inline h-4 w-4" /> {busy === 'create' ? 'Importing…' : 'Import and structure'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Upload a resume first on the Upload Resume page.</p>
            )}
          </Panel>
        </div>
      </div>
    );
  }

  const Template = (TEMPLATES[draft.template] || TEMPLATES.modern).Component;
  const data = draft.data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm print:hidden">
        <select
          value={draft._id}
          onChange={(e) => {
            if (dirty && !window.confirm('Discard unsaved changes?')) return;
            setDraft(drafts.find((d) => d._id === e.target.value));
            setDirty(false);
            setSuggestion(null); setTailorNotes(null); setUndoData(null);
          }}
          className="input-field !w-auto text-sm"
          aria-label="Choose resume"
        >
          {drafts.map((d) => <option key={d._id} value={d._id}>{d._id === draft._id ? draft.title : d.title}</option>)}
        </select>
        <input
          value={draft.title}
          onChange={(e) => { setDraft((d) => ({ ...d, title: e.target.value })); setDirty(true); }}
          className="input-field !w-44 text-sm"
          aria-label="Resume title"
        />
        <div className="flex gap-1">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setDraft((d) => ({ ...d, template: key })); setDirty(true); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${draft.template === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary !py-1.5 text-sm" onClick={() => createDraft()} disabled={!!busy}>
            <Plus className="mr-1 inline h-4 w-4" /> New
          </button>
          <button type="button" className="btn-primary !py-1.5 text-sm" onClick={save} disabled={saving || !dirty}>
            <Save className="mr-1 inline h-4 w-4" /> {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
          <button type="button" className="btn-secondary !py-1.5 text-sm" onClick={download}>
            <Download className="mr-1 inline h-4 w-4" /> PDF
          </button>
          <button type="button" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={remove} aria-label="Delete resume">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* Editor */}
        <div className="space-y-4 print:hidden">
          <Panel title="Basics">
            <div className="grid grid-cols-2 gap-3">
              {BASICS.map(([k, label]) => (
                <Field key={k} label={label} value={data.basics[k]}
                  className={k === 'name' || k === 'title' ? 'col-span-2' : ''}
                  onChange={(v) => update((d) => { d.basics[k] = v; })} />
              ))}
            </div>
          </Panel>

          <Panel
            title="Summary"
            action={
              <button type="button" onClick={makeSummary} disabled={!!busy} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                <Sparkles className="h-3.5 w-3.5" /> {busy === 'summary' ? 'Writing…' : 'Write with AI'}
              </button>
            }
          >
            <textarea
              value={data.summary}
              onChange={(e) => update((d) => { d.summary = e.target.value; })}
              rows={3}
              className="input-field text-sm"
              aria-label="Summary"
            />
          </Panel>

          <Panel title="Skills (comma separated)">
            <textarea
              value={(data.skills || []).join(',')}
              onChange={(e) => update((d) => { d.skills = e.target.value.split(','); })}
              rows={2}
              className="input-field text-sm"
              aria-label="Skills"
            />
          </Panel>

          {Object.entries(SECTIONS).map(([kind, cfg]) => (
            <Panel
              key={kind}
              title={cfg.title}
              action={
                <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"
                  onClick={() => update((d) => { d[kind].push(structuredClone(cfg.blank)); })}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              }
            >
              <div className="space-y-4">
                {(data[kind] || []).map((item, i) => (
                  <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      {cfg.fields.map(([k, label]) => (
                        <Field key={k} label={label} value={item[k]}
                          onChange={(v) => update((d) => { d[kind][i][k] = v; })} />
                      ))}
                    </div>
                    {cfg.bullets && (
                      <div>
                        <span className="mb-1 block text-xs font-medium text-slate-600">Bullet points (one per line)</span>
                        <textarea
                          value={(item.bullets || []).join('\n')}
                          onChange={(e) => update((d) => { d[kind][i].bullets = e.target.value.split('\n'); })}
                          rows={4}
                          className="input-field text-sm"
                          aria-label={`${cfg.title} bullet points`}
                        />
                        {suggestion && suggestion.kind === kind && suggestion.i === i && (
                          <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
                            <p className="mb-1 font-semibold">AI suggestion</p>
                            <ul className="list-disc space-y-1 pl-4">
                              {suggestion.bullets.map((b, j) => <li key={j}>{b}</li>)}
                            </ul>
                            <div className="mt-2 flex gap-2">
                              <button type="button" onClick={applySuggestion} className="rounded bg-indigo-600 px-2 py-1 font-semibold text-white">Apply</button>
                              <button type="button" onClick={() => setSuggestion(null)} className="rounded bg-white px-2 py-1 font-semibold text-slate-700">Dismiss</button>
                            </div>
                          </div>
                        )}
                        <button type="button" onClick={() => improve(kind, i)} disabled={!!busy}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                          <Sparkles className="h-3.5 w-3.5" /> {busy === `${kind}-${i}` ? 'Improving…' : 'Improve with AI'}
                        </button>
                      </div>
                    )}
                    <button type="button" className="text-xs font-medium text-rose-600"
                      onClick={() => update((d) => { d[kind].splice(i, 1); })}>
                      Remove
                    </button>
                  </div>
                ))}
                {!(data[kind] || []).length && <p className="text-sm text-slate-500">Nothing added yet.</p>}
              </div>
            </Panel>
          ))}

          <Panel title="Certifications (one per line)">
            <textarea
              value={(data.certifications || []).join('\n')}
              onChange={(e) => update((d) => { d.certifications = e.target.value.split('\n'); })}
              rows={3}
              className="input-field text-sm"
              aria-label="Certifications"
            />
          </Panel>

          <Panel title="Tailor to a job description (AI)">
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={5}
              className="input-field text-sm"
              placeholder="Paste a job posting here…"
              aria-label="Job description"
            />
            <div className="mt-2 flex items-center gap-3">
              <button type="button" className="btn-primary !py-1.5 text-sm" onClick={tailor} disabled={!!busy || jd.trim().length < 50}>
                <Wand2 className="mr-1 inline h-4 w-4" /> {busy === 'tailor' ? 'Tailoring…' : 'Tailor resume'}
              </button>
              {undoData && (
                <button type="button" onClick={undoTailor} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                  <Undo2 className="h-4 w-4" /> Undo
                </button>
              )}
            </div>
            {tailorNotes && (
              <div className="mt-3 space-y-2 text-xs">
                {tailorNotes.changes.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-800">What changed</p>
                    <ul className="list-disc pl-4 text-slate-600">{tailorNotes.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                )}
                {tailorNotes.missing.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-800">Skills in the job you don't show (not added)</p>
                    <p className="text-amber-700">{tailorNotes.missing.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* Live preview */}
        <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4 print:overflow-visible print:border-0 print:bg-transparent print:p-0">
          <div id="resume-print" className="mx-auto w-[794px] bg-white shadow-lg">
            <Template data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;