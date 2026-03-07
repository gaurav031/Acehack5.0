import { Router } from 'express';
import { getVisaDetails } from '../controllers/visaController.js';

const router = Router();

router.get('/:visaNumber', getVisaDetails);

export default router;
