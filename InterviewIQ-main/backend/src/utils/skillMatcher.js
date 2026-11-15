const ALIASES = {
  'node.js': ['node.js', 'nodejs', 'node js', 'node'],
  react: ['react', 'react.js', 'reactjs'],
  mongodb: ['mongodb', 'mongo db', 'mongoose'],
  express: ['express', 'express.js', 'expressjs'],
  javascript: ['javascript', 'es6'],
  typescript: ['typescript'],
  'rest api': ['rest api', 'rest apis', 'restful', 'restful api'],
  'ci/cd': ['ci/cd', 'cicd', 'ci cd', 'github actions', 'jenkins'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres'],
  aws: ['aws', 'amazon web services'],
  'machine learning': ['machine learning', 'ml'],
  docker: ['docker', 'containerization'],
  git: ['git', 'github', 'gitlab'],
};

export const ROLE_PROFILES = {
  'Full Stack Developer': {
    must: ['javascript', 'react', 'node.js', 'express', 'mongodb', 'rest api', 'git'],
    nice: ['typescript', 'docker', 'aws', 'sql', 'ci/cd', 'testing'],
  },
  'Frontend Developer': {
    must: ['javascript', 'react', 'html', 'css', 'git', 'rest api'],
    nice: ['typescript', 'tailwind', 'redux', 'testing', 'next.js'],
  },
  'Backend Developer': {
    must: ['node.js', 'express', 'sql', 'mongodb', 'rest api', 'git'],
    nice: ['docker', 'redis', 'aws', 'ci/cd', 'microservices', 'testing'],
  },
  'Data Scientist': {
    must: ['python', 'sql', 'machine learning', 'pandas', 'numpy'],
    nice: ['tensorflow', 'pytorch', 'statistics', 'data visualization', 'deep learning'],
  },
  'Java Developer': {
    must: ['java', 'spring boot', 'sql', 'rest api', 'git'],
    nice: ['microservices', 'docker', 'junit', 'aws', 'ci/cd'],
  },
  'DevOps Engineer': {
    must: ['docker', 'kubernetes', 'ci/cd', 'linux', 'aws', 'git'],
    nice: ['terraform', 'python', 'monitoring', 'bash'],
  },
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const canon = (skill) => {
  const s = String(skill).toLowerCase().trim();
  for (const [key, aliases] of Object.entries(ALIASES)) {
    if (key === s || aliases.includes(s)) return key;
  }
  return s;
};

const has = (text, alias) =>
  new RegExp(`(^|[^a-z0-9+#])${escapeRe(alias)}($|[^a-z0-9+#])`, 'i').test(text);

export function findSkills(text, skills = []) {
  const t = String(text || '').toLowerCase();
  const matched = [];
  const missing = [];
  const seen = new Set();

  for (const raw of skills) {
    const c = canon(raw);
    if (seen.has(c)) continue;
    seen.add(c);
    const aliases = ALIASES[c] || [c];
    (aliases.some((a) => has(t, a)) ? matched : missing).push(c);
  }
  return { matched, missing };
}

export function matchResume(text, { must = [], nice = [] }) {
  const m = findSkills(text, must);
  const n = findSkills(text, nice);
  const maxPoints = m.matched.length + m.missing.length;
  const nicePoints = n.matched.length + n.missing.length;
  const total = maxPoints * 2 + nicePoints;
  const earned = m.matched.length * 2 + n.matched.length;

  return {
    matchScore: total ? Math.round((earned / total) * 100) : 0,
    matchedRequired: m.matched,
    missingRequired: m.missing,
    matchedPreferred: n.matched,
    missingPreferred: n.missing,
  };
}