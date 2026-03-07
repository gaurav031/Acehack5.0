import express from 'express';
import { getGeoZones, createGeoZone, deleteGeoZone, updateGeoZone } from '../controllers/geoController.js';

const router = express.Router();

router.get('/', getGeoZones);
router.post('/', createGeoZone);
router.put('/:id', updateGeoZone);
router.delete('/:id', deleteGeoZone);

export default router;
