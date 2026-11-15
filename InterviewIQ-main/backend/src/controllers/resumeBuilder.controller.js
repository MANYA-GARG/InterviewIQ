import service from '../services/resumeBuilder.service.js';

const wrap = (fn, fallback) => async (req, res) => {
  try {
    const out = await fn(req);
    res.status(out.status || 200).json({ success: true, data: out.data });
  } catch (error) {
    console.error(`[resumeBuilder] ${fallback}:`, error?.message || error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || fallback,
    });
  }
};

export const listDrafts = wrap(
  async (req) => ({ data: { drafts: await service.list(req.user._id) } }),
  'Failed to load drafts'
);

export const createDraft = wrap(
  async (req) => ({ status: 201, data: await service.create(req.user._id, req.body || {}) }),
  'Failed to create draft'
);

export const updateDraft = wrap(
  async (req) => ({ data: { draft: await service.update(req.params.id, req.user._id, req.body || {}) } }),
  'Failed to save draft'
);

export const deleteDraft = wrap(
  async (req) => ({ data: await service.remove(req.params.id, req.user._id) }),
  'Failed to delete draft'
);

export const improveBullets = wrap(
  async (req) => ({ data: { bullets: await service.improveBullets(req.body || {}) } }),
  'Failed to improve bullets'
);

export const generateSummary = wrap(
  async (req) => ({ data: { summary: await service.summary(req.body?.data) } }),
  'Failed to generate summary'
);

export const tailorResume = wrap(
  async (req) => ({
    data: await service.tailor(req.body?.data, req.body?.jobDescription),
  }),
  'Failed to tailor resume'
);