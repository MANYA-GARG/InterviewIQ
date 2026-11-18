import service, { computeAgreement } from '../services/evidence.service.js';

const wrap = (fn, fallback) => async (req, res) => {
  try {
    res.status(200).json({ success: true, data: await fn(req) });
  } catch (error) {
    console.error(`[evidence] ${fallback}:`, error?.message || error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || fallback });
  }
};

export const nextAnswer = wrap(
  (req) =>
    service.next(req.user._id, {
      includeOwn: req.query.includeOwn === 'true',
      skip: String(req.query.skip || '').split(',').filter(Boolean),
    }),
  'Failed to load an answer'
);
export const rate = wrap((req) => service.rate(req.user._id, req.body), 'Failed to save rating');
export const agreement = wrap(() => computeAgreement(), 'Failed to compute agreement');