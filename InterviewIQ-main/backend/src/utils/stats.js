export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export const sd = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

export const mae = (x, y) => (x.length ? mean(x.map((v, i) => Math.abs(v - y[i]))) : null);

// Average ranks, so ties are handled correctly
export function ranks(a) {
  const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
  const r = new Array(a.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j += 1;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

export function pearson(x, y) {
  const n = x.length;
  if (n < 2) return null;
  const mx = mean(x);
  const my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i += 1) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

export const spearman = (x, y) => (x.length < 3 ? null : pearson(ranks(x), ranks(y)));

export function bootstrapCI(x, y, iters = 1000) {
  const n = x.length;
  const rhos = [];
  for (let t = 0; t < iters; t += 1) {
    const bx = [], by = [];
    for (let i = 0; i < n; i += 1) {
      const k = Math.floor(Math.random() * n);
      bx.push(x[k]);
      by.push(y[k]);
    }
    const r = spearman(bx, by);
    if (r !== null) rhos.push(r);
  }
  if (rhos.length < 50) return [null, null];
  rhos.sort((a, b) => a - b);
  return [rhos[Math.floor(rhos.length * 0.025)], rhos[Math.floor(rhos.length * 0.975)]];
}

// Quadratic weighted Cohen's kappa for integer labels 0..K-1
export function weightedKappa(a, b, K = 5) {
  const n = a.length;
  if (n < 2) return null;
  const O = Array.from({ length: K }, () => new Array(K).fill(0));
  const ra = new Array(K).fill(0);
  const rb = new Array(K).fill(0);
  for (let i = 0; i < n; i += 1) {
    O[a[i]][b[i]] += 1;
    ra[a[i]] += 1;
    rb[b[i]] += 1;
  }
  let num = 0, den = 0;
  for (let i = 0; i < K; i += 1) {
    for (let j = 0; j < K; j += 1) {
      const w = (i - j) ** 2 / (K - 1) ** 2;
      num += w * O[i][j];
      den += w * ((ra[i] * rb[j]) / n);
    }
  }
  return den === 0 ? null : 1 - num / den;
}