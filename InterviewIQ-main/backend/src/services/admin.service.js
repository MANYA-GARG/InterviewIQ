import mongoose from 'mongoose';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Evaluation from '../models/Evaluation.js';
import InterviewSession from '../models/InterviewSession.js';
import InterviewRecording from '../models/InterviewRecording.js';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import ResumeDraft from '../models/ResumeDraft.js';
import StudyPlan from '../models/StudyPlan.js';
import AssessmentSession from '../models/AssessmentSession.js';
import UserAbility from '../models/UserAbility.js';
import AbilityTrace from '../models/AbilityTrace.js';
import HumanRating from '../models/HumanRating.js';
import BankQuestion from '../models/BankQuestion.js';
import AppError from '../utils/AppError.js';

const SAFE = '-password -refreshToken -otp -otpExpiry -resetOTP -resetOTPExpires';
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const r1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);

const oid = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid user id', 400);
  return new mongoose.Types.ObjectId(id);
};

const countBy = async (Model, ids, field = 'user') => {
  const rows = await Model.aggregate([
    { $match: { [field]: { $in: ids } } },
    { $group: { _id: `$${field}`, n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
};

async function withStats(users) {
  const ids = users.map((u) => u._id);
  const [iv, rs, as] = await Promise.all([
    countBy(Interview, ids),
    countBy(Resume, ids),
    countBy(AssessmentSession, ids),
  ]);
  const avgRows = await Evaluation.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: '$user', avg: { $avg: '$overallScore' } } },
  ]);
  const avg = new Map(avgRows.map((r) => [String(r._id), r.avg]));

  return users.map((u) => ({
    ...u,
    stats: {
      interviews: iv.get(String(u._id)) || 0,
      resumes: rs.get(String(u._id)) || 0,
      assessments: as.get(String(u._id)) || 0,
      avgScore: r1(avg.get(String(u._id))),
    },
  }));
}

const buildFilter = ({ q = '', status = '' }) => {
  const filter = { role: 'user' };
  if (['ACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) filter.accountStatus = status;
  if (q.trim()) {
    const re = new RegExp(esc(q.trim().slice(0, 60)), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }
  return filter;
};

class AdminService {
  async overview() {
    const since7 = new Date(Date.now() - 7 * 864e5);
    const since14 = new Date(Date.now() - 14 * 864e5);

    const [candidates, verified, suspended, newCandidates, interviews, resumes, sessions, ratings, bank, avg, signups, byStatus] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'user', isVerified: true }),
        User.countDocuments({ role: 'user', accountStatus: 'SUSPENDED' }),
        User.countDocuments({ role: 'user', createdAt: { $gte: since7 } }),
        Interview.countDocuments(),
        Resume.countDocuments(),
        AssessmentSession.countDocuments(),
        HumanRating.countDocuments(),
        BankQuestion.countDocuments(),
        Evaluation.aggregate([{ $group: { _id: null, avg: { $avg: '$overallScore' } } }]),
        User.aggregate([
          { $match: { role: 'user', createdAt: { $gte: since14 } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Interview.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      ]);

    return {
      candidates, verified, suspended, newCandidates, interviews, resumes,
      assessments: sessions, humanRatings: ratings, bankQuestions: bank,
      avgScore: r1(avg[0]?.avg),
      signupsByDay: signups.map((s) => ({ date: s._id, count: s.n })),
      interviewsByStatus: byStatus.map((s) => ({ status: s._id, count: s.n })),
    };
  }

  async listUsers({ q, status, page = 1, limit = 10 } = {}) {
    const filter = buildFilter({ q, status });
    const pg = Math.max(1, Number(page) || 1);
    const lim = Math.min(50, Math.max(1, Number(limit) || 10));

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim).select(SAFE).lean(),
    ]);

    return { users: await withStats(users), total, page: pg, pages: Math.max(1, Math.ceil(total / lim)) };
  }

  async userDetail(id) {
    const _id = oid(id);
    const user = await User.findById(_id).select(SAFE).lean();
    if (!user) throw new AppError('User not found', 404);

    const [interviews, resumes, abilities, assessments] = await Promise.all([
      Interview.find({ user: _id }).sort({ createdAt: -1 }).limit(20)
        .select('jobRole experienceLevel status createdAt evaluationReport.overallScore').lean(),
      Resume.find({ user: _id }).sort({ createdAt: -1 }).limit(10)
        .select('filename skillScore skills createdAt').lean(),
      UserAbility.find({ user: _id }).select('role topics updatedAt').lean(),
      AssessmentSession.countDocuments({ user: _id }),
    ]);

    return { user, interviews, resumes, abilities, assessments };
  }

  async setStatus(adminId, id, status) {
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) throw new AppError('Invalid status', 400);
    if (String(adminId) === String(id)) throw new AppError('You cannot change your own status', 400);

    const user = await User.findById(oid(id));
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Admin accounts cannot be suspended here', 403);

    user.accountStatus = status === 'ACTIVE' && !user.isVerified ? 'PENDING' : status;
    if (status === 'SUSPENDED') user.refreshToken = undefined;
    await user.save();
    return { id: user._id, accountStatus: user.accountStatus };
  }

  async setRole(adminId, id, role) {
    if (!['user', 'admin'].includes(role)) throw new AppError('Invalid role', 400);
    if (String(adminId) === String(id)) throw new AppError('You cannot change your own role', 400);

    const user = await User.findById(oid(id));
    if (!user) throw new AppError('User not found', 404);
    user.role = role;
    await user.save();
    return { id: user._id, role: user.role };
  }

  async remove(adminId, id) {
    const _id = oid(id);
    if (String(adminId) === String(id)) throw new AppError('You cannot delete your own account here', 400);

    const user = await User.findById(_id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Demote the admin before deleting', 403);

    const interviewIds = (await Interview.find({ user: _id }).select('_id').lean()).map((i) => i._id);

    await Promise.all([
      Question.deleteMany({ interview: { $in: interviewIds } }),
      Answer.deleteMany({ interview: { $in: interviewIds } }),
      Evaluation.deleteMany({ user: _id }),
      InterviewSession.deleteMany({ user: _id }),
      InterviewRecording.deleteMany({ user: _id }),
      Interview.deleteMany({ user: _id }),
      Resume.deleteMany({ user: _id }),
      ResumeAnalysis.deleteMany({ userId: _id }),
      ResumeDraft.deleteMany({ user: _id }),
      StudyPlan.deleteMany({ user: _id }),
      AssessmentSession.deleteMany({ user: _id }),
      UserAbility.deleteMany({ user: _id }),
      AbilityTrace.deleteMany({ user: _id }),
      HumanRating.deleteMany({ rater: _id }),
    ]);
    await user.deleteOne();
    return { message: 'User and all related data deleted' };
  }

  async exportCsv() {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5000).select(SAFE).lean();
    const rows = await withStats(users);

    const cell = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // blocks spreadsheet formula injection
      return `"${s.replace(/"/g, '""')}"`;
    };
    const header = ['Name', 'Email', 'Status', 'Verified', 'Joined', 'Interviews', 'AvgScore', 'Resumes', 'Assessments'];
    const lines = rows.map((u) =>
      [u.name, u.email, u.accountStatus, u.isVerified ? 'yes' : 'no',
        new Date(u.createdAt).toISOString().slice(0, 10),
        u.stats.interviews, u.stats.avgScore ?? '', u.stats.resumes, u.stats.assessments].map(cell).join(',')
    );
    return [header.map(cell).join(','), ...lines].join('\n');
  }
}

export default new AdminService();