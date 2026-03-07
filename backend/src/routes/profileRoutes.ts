import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';

const router = Router();

router.get('/:touristId', getProfile);
router.put('/:touristId', updateProfile);

export default router;
