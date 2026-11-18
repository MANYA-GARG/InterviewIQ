// Usage: node scripts/draftQuestions.js --role Backend --topic nodejs --difficulty 3 --count 5
// Output goes to src/data/drafts/. REVIEW every question by hand, then copy it into assessmentBank.json.
import '../envBootstrap.js';
import fs from 'fs';
import {
  GROQ_DEFAULT_MODEL,
  callGroqChatCompletion,
  extractGroqMessageContent,
  parseGroqJsonContent,
} from '../src/services/groqChat.js';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const role = arg('role', 'Backend');
const topic = arg('topic', 'nodejs');
const difficulty = Number(arg('difficulty', 3));
const count = Math.min(10, Number(arg('count', 5)));

const prompt = `Write ${count} distinct technical interview questions for the role "${role}", topic "${topic}", difficulty ${difficulty} on a 1-5 scale (1 = fundamentals, 5 = expert system design).
For each give: subtopic, question, 3-5 key_points (the facts a correct answer must contain), and a model_answer of 1-3 sentences.
Return ONLY JSON: {"questions":[{"subtopic":"","question":"","key_points":[],"model_answer":"","tags":[]}]}`;

const response = await callGroqChatCompletion({
  operation: 'draftQuestions',
  model: GROQ_DEFAULT_MODEL,
  messages: [
    { role: 'system', content: 'You are a senior engineer writing interview questions. Respond with valid JSON only.' },
    { role: 'user', content: prompt },
  ],
  temperature: 0.5,
  max_tokens: 3000,
  retries: 2,
  timeout: 40000,
});

const data = parseGroqJsonContent(extractGroqMessageContent(response));
const prefix = `${role.slice(0, 2).toUpperCase()}-${topic.toUpperCase().slice(0, 6)}-D${difficulty}`;
const out = (data.questions || []).map((q, i) => ({
  qid: `${prefix}-${Date.now().toString(36)}${i}`,
  role, topic, subtopic: q.subtopic || '', difficulty, type: 'technical',
  question: q.question, key_points: q.key_points, model_answer: q.model_answer,
  tags: q.tags || [], reviewed: false,
}));

fs.mkdirSync(new URL('../src/data/drafts/', import.meta.url), { recursive: true });
const file = new URL(`../src/data/drafts/${role}-${topic}-d${difficulty}.json`, import.meta.url);
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} DRAFT questions. Review before use.`);
process.exit(0);