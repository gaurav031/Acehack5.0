import { Router } from 'express';
import {
    initializeIdentity,
    verifyPassportEncrypted,
    getIdentityStatus
} from '../controllers/identityController.js';

const router = Router();

router.post('/initialize', initializeIdentity);
router.post('/verify-passport', verifyPassportEncrypted);
router.get('/status/:touristId', getIdentityStatus);

export default router;
