import { Router } from 'express';
import { getAllHotels, getHotel, createHotel, updateHotel, deleteHotel } from '../controllers/hotelController.js';

const router = Router();

router.get('/', getAllHotels);
router.get('/:id', getHotel);
router.post('/', createHotel);
router.put('/:id', updateHotel);
router.delete('/:id', deleteHotel);

export default router;
