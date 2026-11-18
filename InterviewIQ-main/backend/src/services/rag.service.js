import RagChunk from '../models/RagChunk.js';

const STOP = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'was', 'will', 'have', 'has',
  'into', 'than', 'then', 'when', 'what', 'which', 'your', 'their', 'can', 'not', 'how', 'why',
]);
export const tokenize = (s) =>
  (String(s).toLowerCase().match(/[a-z0-9.+#]+/g) || []).filter((w) => w.length > 1 && !STOP.has(w));

// ---------- chunking ----------
export function chunkText(text, size = 220, step = 180) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= size) return [words.join(' ')];
  const out = [];
  for (let i = 0; i < words.length; i += step) {
    out.push(words.slice(i, i + size).join(' '));
    if (i + size >= words.length) break;
  }
  return out;
}

// ---------- embeddings (all-MiniLM-L6-v2 via ONNX) ----------
let extractor; // undefined = not tried, null = unavailable
async function getExtractor() {
  if (extractor !== undefined) return extractor;
  try {
    const { pipeline } = await import('@xenova/transformers');
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  } catch (e) {
    console.error('[rag] embedding model unavailable, using BM25 only:', e?.message || e);
    extractor = null;
  }
  return extractor;
}

export async function embedTexts(texts) {
  const ex = await getExtractor();
  if (!ex) return null;
  const out = [];
  for (const t of texts) {
    const r = await ex(t, { pooling: 'mean', normalize: true });
    out.push(Array.from(r.data));
  }
  return out;
}

const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s; // vectors are normalized, so dot = cosine
};

// ---------- BM25 ----------
function bm25Rank(queryTokens, docs, k1 = 1.5, b = 0.75) {
  const N = docs.length;
  if (!N || !queryTokens.length) return [];
  const avgdl = docs.reduce((s, d) => s + d.tokens.length, 0) / N || 1;
  const df = {};
  for (const d of docs) for (const t of new Set(d.tokens)) df[t] = (df[t] || 0) + 1;

  return docs
    .map((d) => {
      const tf = {};
      for (const t of d.tokens) tf[t] = (tf[t] || 0) + 1;
      let score = 0;
      for (const q of new Set(queryTokens)) {
        if (!tf[q]) continue;
        const idf = Math.log(1 + (N - df[q] + 0.5) / (df[q] + 0.5));
        score += (idf * tf[q] * (k1 + 1)) / (tf[q] + k1 * (1 - b + (b * d.tokens.length) / avgdl));
      }
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b2) => b2.score - a.score);
}

// ---------- index cache ----------
let cache = null;
export const invalidateIndex = () => { cache = null; };

async function load() {
  if (cache) return cache;
  const rows = await RagChunk.find().lean();
  cache = rows.map((r) => ({
    id: String(r._id),
    docId: r.docId,
    topic: r.topic,
    title: r.title,
    text: r.text,
    embedding: r.embedding || [],
    tokens: tokenize(`${r.title} ${r.text}`),
  }));
  return cache;
}

const RRF_K = 60;

class RagService {
  async stats() {
    const all = await load();
    return {
      chunks: all.length,
      withEmbeddings: all.filter((c) => c.embedding.length).length,
    };
  }

  /** Hybrid retrieval: BM25 + dense, merged with reciprocal rank fusion. */
  async retrieve(query, { topic, k = 4 } = {}) {
    const all = await load();
    let pool = topic ? all.filter((c) => c.topic === topic) : all;
    if (!pool.length) pool = all;
    if (!pool.length) return [];

    const lexical = bm25Rank(tokenize(query), pool);

    let dense = [];
    const withVec = pool.filter((c) => c.embedding.length);
    if (withVec.length) {
      const qv = (await embedTexts([query]))?.[0];
      if (qv) {
        dense = withVec
          .map((d) => ({ d, score: dot(qv, d.embedding) }))
          .filter((x) => x.score > 0.2)
          .sort((a, b) => b.score - a.score);
      }
    }

    const fused = new Map();
    const add = (list, key) =>
      list.forEach((x, i) => {
        const e = fused.get(x.d.id) || { d: x.d, rrf: 0, via: {} };
        e.rrf += 1 / (RRF_K + i + 1);
        e.via[key] = i + 1;
        fused.set(x.d.id, e);
      });
    add(lexical, 'bm25');
    add(dense, 'dense');

    return [...fused.values()]
      .sort((a, b) => b.rrf - a.rrf)
      .slice(0, k)
      .map((e) => ({
        id: e.d.id,
        docId: e.d.docId,
        topic: e.d.topic,
        title: e.d.title,
        text: e.d.text,
        score: Math.round(e.rrf * 10000) / 10000,
        via: e.via,
      }));
  }
}

export default new RagService();