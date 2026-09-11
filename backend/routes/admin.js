import express from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import {
  getAdminIssues,
  getAdminIssueById,
  getAdminStats,
  updateIssueStatus,
  assignIssue,
  reanalyzeIssue,
  getOfficers,
  createOfficer,
  getAdminAnalysis,
  submitResolutionProof,
  approveResolution,
  rejectResolution,
  dismissSpamIssue,
  overrideSpamIssue,
} from '../controllers/adminController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.get('/issues', requireAdmin, getAdminIssues);
router.get('/issues/:id', requireAdmin, getAdminIssueById);
router.get('/stats', requireAdmin, getAdminStats);
router.patch('/issues/:id/status', requireAdmin, updateIssueStatus);
router.patch('/issues/:id/assign', requireAdmin, assignIssue);
router.post('/issues/:id/reanalyze', requireAdmin, reanalyzeIssue);
router.get('/officers', requireAdmin, getOfficers);
router.post('/officers', requireAdmin, createOfficer);
router.get('/analysis', requireAdmin, getAdminAnalysis);

// Department Head Proof & Admin Approval routes
router.post('/issues/:id/proof', requireAdmin, upload.single('photo'), submitResolutionProof);
router.post('/issues/:id/approve', requireAdmin, approveResolution);
router.post('/issues/:id/reject', requireAdmin, rejectResolution);

// Spam Moderation: Dismiss & Override routes
router.post('/issues/:id/dismiss', requireAdmin, dismissSpamIssue);
router.post('/issues/:id/override', requireAdmin, overrideSpamIssue);

export default router;
