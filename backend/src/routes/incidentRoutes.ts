import { Router } from 'express';
import { reportIncident, getNearIncidents } from '../controllers/incidentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, reportIncident);
router.get('/near', authenticate, getNearIncidents);

export default router;
