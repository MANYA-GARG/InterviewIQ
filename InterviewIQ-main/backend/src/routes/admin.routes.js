import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import {
  overview, listUsers, userDetail, setStatus, setRole, removeUser, exportCsv,
} from '../controllers/admin.controller.js';

const router = express.Router();
router.use(protect, restrictTo('admin'));

router.get('/overview', overview);
router.get('/users', listUsers);
router.get('/users/export', exportCsv);
router.get('/users/:id', userDetail);
router.put('/users/:id/status', setStatus);
router.put('/users/:id/role', setRole);
router.delete('/users/:id', removeUser);

export default router;