import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Incident from '../models/Incident.js';
import aiService from '../services/aiService.js';

export const reportIncident = async (req: AuthRequest, res: Response) => {
    try {
        const { description, location, mediaUrl } = req.body;
        const touristId = req.user.id;

        // Trigger AI Analysis
        const analysis = await aiService.analyzeIncident(description);

        const incident = new Incident({
            tourist: touristId,
            description,
            location,
            mediaUrl,
            aiAnalysis: analysis,
            status: 'pending'
        });

        await incident.save();

        res.status(201).json({
            message: 'Incident reported successfully',
            incident
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getNearIncidents = async (req: AuthRequest, res: Response) => {
    try {
        const { lat, lng, radiusKm = 5 } = req.query;

        const incidents = await Incident.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)]
                    },
                    $maxDistance: Number(radiusKm) * 1000 // meters
                }
            }
        });

        res.json(incidents);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
