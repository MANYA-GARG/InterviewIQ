import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CheckCircle2, Clock3, Play, RotateCcw, Save } from 'lucide-react';

const CODE_TEMPLATES = {
  javascript: `function solve(input) {
  // Write your solution here
  return input;
}

console.log(solve('hello world'));`,
  python: `def solve(input_data):
    # Write your solution here
    return input_data

print(solve('hello world'))`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    cout << "hello world" << endl;
    return 0;
}`,
};

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
];

const getStorageKey = (problemId, language) => `prep_hub_code_${problemId}_${language}`;

const formatTimer = (seconds) => {
  const mins = Math.floor(Math.max(seconds, 0) / 60);
  const secs = Math.max(seconds, 0) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const CodeEditor = ({ problem }) => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [testInput, setTestInput] = useState('hello world');
  const [output, setOutput] = useState('Run your code to see output.');
  const [runStatus, setRunStatus] = useState('idle');
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(45 * 60);

  const defaultCode = useMemo(() => CODE_TEMPLATES[language] || CODE_TEMPLATES.javascript, [language]);

  useEffect(() => {
    const storageKey = getStorageKey(problem.id, language);
    const saved = localStorage.getItem(storageKey);
    setCode(saved || defaultCode);
  }, [problem.id, language, defaultCode]);

  useEffect(() => {
    setSessionSecondsLeft(45 * 60);
  }, [problem.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleReset = () => {
    setCode(defaultCode);
    setRunStatus('idle');
    setOutput('Editor reset to starter template.');
  };

  const handleSave = () => {
    const storageKey = getStorageKey(problem.id, language);
    localStorage.setItem(storageKey, code);
    setRunStatus('success');
    setOutput('Code saved locally.');
  };

  const runJavaScript = () => {
    const logs = [];
    const sandboxConsole = {
      log: (...args) => {
        logs.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
      },
    };

    try {
      const executor = new Function('input', 'console', `${code}\nreturn true;`);
      executor(testInput, sandboxConsole);
      if (logs.length === 0) {
        setOutput('Code executed successfully. No console output.');
      } else {
        setOutput(logs.join('\n'));
      }
      setRunStatus('success');
    } catch (error) {
      setRunStatus('error');
      setOutput(`Execution error: ${error.message}`);
    }
  };

  const handleRunCode = () => {
    setRunStatus('running');
    if (language === 'javascript') {
      runJavaScript();
      return;
    }

    const simulated = [
      `Language: ${language}`,
      `Input: ${testInput || '(empty)'}`,
      'Execution is simulated in demo mode.',
      'Tip: JavaScript mode supports inline console output right now.',
    ].join('\n');
    setOutput(simulated);
    setRunStatus('success');
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,0.95fr)_1.6fr]">
        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Problem</p>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {problem.difficulty}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900">{problem.name}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Write a clean and efficient solution. Optimize for correctness first, then improve time and space complexity.
          </p>

          <div className="mt-3 rounded-md border border-slate-200 bg-white p-2.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Session Timer</p>
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Clock3 className="h-4 w-4 text-indigo-600" />
              {formatTimer(sessionSecondsLeft)}
            </p>
          </div>

          <div className="mt-3 rounded-md border border-slate-200 bg-white p-2.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Test Input</p>
            <input
              type="text"
              value={testInput}
              onChange={(event) => setTestInput(event.target.value)}
              placeholder="Add test input"
              className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
            />
          </div>
        </aside>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Coding Workspace</p>
              <p className="text-sm font-semibold text-slate-900">{problem.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-500"
              >
                {LANGUAGE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-b-lg border-t border-slate-800">
            <Editor
              height="420px"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
              }}
            />

            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleRunCode}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                <Play className="h-3.5 w-3.5" />
                Run
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
              runStatus === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : runStatus === 'error'
                ? 'bg-rose-100 text-rose-700'
                : runStatus === 'running'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {runStatus === 'success' ? <CheckCircle2 className="h-3 w-3" /> : null}
            {runStatus === 'idle' ? 'Ready' : runStatus === 'running' ? 'Running' : runStatus === 'error' ? 'Failed' : 'Success'}
          </span>
        </div>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-800">
          {output}
        </pre>
      </div>
    </section>
  );
};

export default CodeEditor;
