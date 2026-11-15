import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  listDrafts,
  createDraft,
  updateDraft,
  deleteDraft,
  improveBullets,
  generateSummary,
  tailorResume,
} from '../controllers/resumeBuilder.controller.js';

const router = express.Router();
router.use(protect);

router.post('/ai/improve', improveBullets);
router.post('/ai/summary', generateSummary);
router.post('/ai/tailor', tailorResume);

router.get('/', listDrafts);
router.post('/', createDraft);
router.put('/:id', updateDraft);
router.delete('/:id', deleteDraft);

export default router;