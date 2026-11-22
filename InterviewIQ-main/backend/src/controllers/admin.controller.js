import service from '../services/admin.service.js';

const wrap = (fn, fallback) => async (req, res) => {
  try {
    res.status(200).json({ success: true, data: await fn(req) });
  } catch (error) {
    console.error(`[admin] ${fallback}:`, error?.message || error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || fallback });
  }
};

export const overview = wrap(() => service.overview(), 'Failed to load overview');
export const listUsers = wrap((req) => service.listUsers(req.query), 'Failed to load candidates');
export const userDetail = wrap((req) => service.userDetail(req.params.id), 'Failed to load candidate');
export const setStatus = wrap((req) => service.setStatus(req.user._id, req.params.id, req.body?.status), 'Failed to update status');
export const setRole = wrap((req) => service.setRole(req.user._id, req.params.id, req.body?.role), 'Failed to update role');
export const removeUser = wrap((req) => service.remove(req.user._id, req.params.id), 'Failed to delete user');

export const exportCsv = async (req, res) => {
  try {
    const csv = await service.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error('[admin] export:', error?.message || error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};