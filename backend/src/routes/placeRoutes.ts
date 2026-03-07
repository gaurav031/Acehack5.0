import { Router } from 'express';
import { getAllPlaces, getPlace, createPlace, updatePlace, deletePlace } from '../controllers/placeController.js';

const router = Router();

router.get('/', getAllPlaces);
router.get('/:id', getPlace);
router.post('/', createPlace);
router.put('/:id', updatePlace);
router.delete('/:id', deletePlace);

export default router;
