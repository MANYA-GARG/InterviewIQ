const ACTION_VERBS = new Set([
  'built', 'developed', 'designed', 'implemented', 'created', 'led', 'managed', 'improved',
  'optimized', 'optimised', 'reduced', 'increased', 'launched', 'delivered', 'automated',
  'architected', 'engineered', 'deployed', 'integrated', 'migrated', 'analyzed', 'analysed',
  'trained', 'collaborated', 'established', 'streamlined', 'resolved', 'tested', 'maintained',
  'mentored', 'coordinated', 'achieved', 'drove', 'spearheaded', 'refactored', 'scaled',
  'secured', 'configured', 'published', 'won', 'organized', 'organised', 'presented',
  'researched', 'wrote', 'produced', 'designed', 'enhanced', 'initiated', 'executed',
]);

const WEAK_PHRASES = [
  'responsible for', 'worked on', 'helped with', 'duties included',
  'assisted in', 'tasked with', 'participated in',
];

const HEADINGS = {
  experience: /^(work experience|professional experience|experience|employment history|work history|internships?|internship experience)$/,
  projects: /^(projects?|academic projects|personal projects|key projects|technical projects)$/,
  education: /^(education|academic background|academics|educational qualifications?|education and training)$/,
  skills: /^(technical skills|skills|key skills|core competencies|skills and tools|skills & tools|technologies|tech stack)$/,
  summary: /^(summary|professional summary|career objective|objective|profile|about me|about)$/,
};

const norm = (s) => s.toLowerCase().replace(/[^a-z& ]/g, ' ').replace(/\s+/g, ' ').trim();

const hasHeading = (lines, regex) =>
  lines.some((line) => {
    const head = norm(line.split(':')[0]);
    return head.length > 0 && head.length <= 30 && regex.test(head);
  });

const check = (id, label, max, points, detail, fix) => {
  const p = Math.max(0, Math.min(max, Math.round(points)));
  return {
    id,
    label,
    max,
    points: p,
    status: p >= max ? 'pass' : p <= 0 ? 'fail' : 'warn',
    detail,
    fix: p >= max ? '' : fix,
  };
};

const ratioPoints = (count, target, max) => max * Math.min(1, count / target);

export function runAtsChecks(text = '') {
  const raw = String(text || '');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const words = raw.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = raw.toLowerCase();
  const checks = [];

  // Contact information (15)
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(raw);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(raw);
  const hasLink = /(linkedin\.com|github\.com|gitlab\.com|portfolio)/i.test(raw);
  checks.push(check('email', 'Email address', 8, hasEmail ? 8 : 0,
    hasEmail ? 'An email address was found.' : 'No email address was found.',
    'Add a professional email address at the top of your resume.'));
  checks.push(check('phone', 'Phone number', 4, hasPhone ? 4 : 0,
    hasPhone ? 'A phone number was found.' : 'No phone number was found.',
    'Add a phone number so recruiters can call you.'));
  checks.push(check('links', 'LinkedIn / GitHub link', 3, hasLink ? 3 : 0,
    hasLink ? 'A profile link was found.' : 'No LinkedIn or GitHub link was found.',
    'Add your LinkedIn and GitHub profile links.'));

  // Sections (32)
  const hasExp = hasHeading(lines, HEADINGS.experience);
  const hasProj = hasHeading(lines, HEADINGS.projects);
  const hasEdu = hasHeading(lines, HEADINGS.education);
  const hasSkills = hasHeading(lines, HEADINGS.skills);
  const hasSummary = hasHeading(lines, HEADINGS.summary);
  checks.push(check('experience', 'Experience or Projects section', 10, hasExp || hasProj ? 10 : 0,
    hasExp || hasProj
      ? `Found: ${[hasExp && 'Experience', hasProj && 'Projects'].filter(Boolean).join(' and ')}.`
      : 'No Experience or Projects heading was detected.',
    'Add a clearly titled "Experience" or "Projects" section. ATS systems look for these headings.'));
  checks.push(check('education', 'Education section', 8, hasEdu ? 8 : 0,
    hasEdu ? 'An Education section was found.' : 'No Education heading was detected.',
    'Add an "Education" section with your degree, college and years.'));
  checks.push(check('skills', 'Skills section', 10, hasSkills ? 10 : 0,
    hasSkills ? 'A Skills section was found.' : 'No Skills heading was detected.',
    'Add a "Skills" section listing your technologies. This is the first place ATS looks for keywords.'));
  checks.push(check('summary', 'Summary or objective', 4, hasSummary ? 4 : 0,
    hasSummary ? 'A summary section was found.' : 'No summary or objective heading was detected.',
    'Add a 2-3 line professional summary at the top.'));

  // Length (10)
  let lengthPoints = 0;
  if (wordCount >= 350 && wordCount <= 850) lengthPoints = 10;
  else if ((wordCount >= 250 && wordCount < 350) || (wordCount > 850 && wordCount <= 1100)) lengthPoints = 5;
  checks.push(check('length', 'Resume length', 10, lengthPoints,
    `Your resume has ${wordCount} words. The ideal range is 350-850.`,
    wordCount < 350
      ? 'Add more detail on projects and achievements.'
      : 'Trim older or less relevant content so it fits one to two pages.'));

  // Quantified achievements (15)
  const quantified = lines.filter((l) => {
    if (l.length < 35 || l.includes('@')) return false;
    return /\d/.test(l.replace(/\b(19|20)\d{2}\b/g, ''));
  });
  checks.push(check('metrics', 'Quantified achievements', 15, ratioPoints(quantified.length, 4, 15),
    `${quantified.length} line(s) contain numbers or metrics. Aim for at least 4.`,
    'Add numbers to your bullets, for example "reduced load time by 40%" or "served 500+ users".'));

  // Action verbs (10)
  const verbLines = lines.filter((l) => {
    const first = l.replace(/^[•\-*▪●◦·\s]+/, '').split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    return ACTION_VERBS.has(first);
  });
  checks.push(check('verbs', 'Strong action verbs', 10, ratioPoints(verbLines.length, 5, 10),
    `${verbLines.length} bullet(s) start with a strong action verb. Aim for at least 5.`,
    'Start bullets with verbs like Built, Designed, Implemented, Optimized or Led.'));

  // Weak phrases (6)
  const foundWeak = WEAK_PHRASES.filter((p) => lower.includes(p));
  const weakCount = WEAK_PHRASES.reduce((n, p) => n + (lower.split(p).length - 1), 0);
  checks.push(check('weak', 'Weak phrases', 6, weakCount === 0 ? 6 : weakCount <= 2 ? 3 : 0,
    weakCount ? `Found weak phrasing: "${foundWeak.join('", "')}".` : 'No weak phrases were found.',
    'Replace phrases like "responsible for" or "worked on" with specific actions and results.'));

  // Dates (6)
  const years = raw.match(/\b(19|20)\d{2}\b/g) || [];
  checks.push(check('dates', 'Dates', 6, years.length >= 2 ? 6 : years.length === 1 ? 3 : 0,
    `${years.length} year(s) were found.`,
    'Add start and end dates (for example "2022 - 2024") to education, internships and projects.'));

  // First-person language (6)
  const firstPerson = lines.filter((l) => /^(i|my)\s/i.test(l) || /\b(i am|i have|i was|i worked|i built)\b/i.test(l)).length;
  checks.push(check('pronouns', 'First-person language', 6, firstPerson <= 1 ? 6 : firstPerson <= 4 ? 3 : 0,
    firstPerson ? `${firstPerson} line(s) use "I" or "my".` : 'No first-person phrasing was found.',
    'Write in implied first person. Say "Built an API" instead of "I built an API".'));

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs work' : 'Poor';

  const topFixes = checks
    .filter((c) => c.status !== 'pass')
    .sort((a, b) => b.max - b.points - (a.max - a.points))
    .slice(0, 5)
    .map((c) => ({ label: c.label, fix: c.fix, pointsLost: c.max - c.points }));

  return {
    score,
    grade,
    checks,
    topFixes,
    stats: { wordCount, quantifiedLines: quantified.length, actionVerbLines: verbLines.length },
  };
}