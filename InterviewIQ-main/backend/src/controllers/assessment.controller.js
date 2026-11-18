import service from '../services/assessment.service.js';

const wrap = (fn, fallback, status = 200) => async (req, res) => {
  try {
    res.status(status).json({ success: true, data: await fn(req) });
  } catch (error) {
    console.error(`[assessment] ${fallback}:`, error?.message || error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || fallback });
  }
};

export const getRoles = wrap(async () => ({ roles: await service.roles() }), 'Failed to load roles');
export const startSession = wrap((req) => service.start(req.user._id, req.body || {}), 'Failed to start', 201);
export const submitAnswer = wrap(
  (req) => service.answer(req.user._id, req.params.id, req.body?.answer),
  'Failed to score answer'
);
export const getSession = wrap((req) => service.get(req.user._id, req.params.id), 'Failed to load session');
export const getAbilities = wrap(async (req) => ({ abilities: await service.abilities(req.user._id) }), 'Failed to load abilities');
export const getPlan = wrap((req) => service.plan(req.user._id, req.params.id), 'Failed to build plan');