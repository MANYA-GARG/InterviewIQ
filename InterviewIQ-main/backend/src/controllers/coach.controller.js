import coach from '../services/coach.service.js';

const wrap = (fn, fallback) => async (req, res) => {
  try {
    const data = await fn(req);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(`[coach] ${fallback}:`, error?.message || error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || fallback,
    });
  }
};

export const generatePlan = wrap(
  async (req) => ({ plan: await coach.generate(req.user._id, req.body || {}) }),
  'Failed to create study plan'
);

export const latestPlan = wrap(
  async (req) => ({ plan: await coach.latest(req.user._id) }),
  'Failed to load study plan'
);

export const toggleTask = wrap(
  async (req) => ({ plan: await coach.toggleTask(req.params.id, req.user._id, req.body || {}) }),
  'Failed to update task'
);