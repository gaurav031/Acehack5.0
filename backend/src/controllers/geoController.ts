import { Request, Response } from 'express';
import GeoZone from '../models/GeoZone.js';

export const getGeoZones = async (req: Request, res: Response) => {
    try {
        const zones = await GeoZone.find({});
        res.status(200).json({ success: true, data: zones });
    } catch (error) {
        console.error('Error fetching geo zones:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createGeoZone = async (req: Request, res: Response) => {
    try {
        console.log('Creating geo zone with body:', JSON.stringify(req.body, null, 2));
        const { name, description, type, coordinates, severity } = req.body;

        let finalCoordinates = coordinates;
        // Defensive: If it's 4D (original buggy frontend code sent 4 brackets), unwrap to 3D for GeoJSON Polygon
        if (Array.isArray(coordinates) &&
            Array.isArray(coordinates[0]) &&
            Array.isArray(coordinates[0][0]) &&
            Array.isArray(coordinates[0][0][0])) {
            console.log('Auto-unwrapping 4D coordinates to 3D...');
            finalCoordinates = coordinates[0];
        }

        // coordinates should be [[[lng, lat], [lng, lat], ...]]
        const zone = new GeoZone({
            name,
            description,
            type: type || 'danger',
            geometry: {
                type: 'Polygon',
                coordinates: finalCoordinates
            },
            severity
        });

        await zone.save();
        res.status(201).json({ success: true, data: zone });
    } catch (error) {
        console.error('Error creating geo zone:', error);
        res.status(500).json({ success: false, message: 'Failed to create geo zone' });
    }
};

export const updateGeoZone = async (req: Request, res: Response) => {
    try {
        console.log('Updating geo zone with body:', JSON.stringify(req.body, null, 2));
        const { id } = req.params;
        const { name, description, type, coordinates, severity } = req.body;

        let finalCoordinates = coordinates;
        // Defensive: If it's 4D (original buggy frontend code sent 4 brackets), unwrap to 3D for GeoJSON Polygon
        if (Array.isArray(coordinates) &&
            Array.isArray(coordinates[0]) &&
            Array.isArray(coordinates[0][0]) &&
            Array.isArray(coordinates[0][0][0])) {
            console.log('Auto-unwrapping 4D coordinates to 3D for update...');
            finalCoordinates = coordinates[0];
        }

        const updateData: any = {
            name,
            description,
            type,
            severity
        };

        if (finalCoordinates) {
            updateData.geometry = {
                type: 'Polygon',
                coordinates: finalCoordinates
            };
        }

        const zone = await GeoZone.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ success: true, data: zone });
    } catch (error) {
        console.error('Error updating geo zone:', error);
        res.status(500).json({ success: false, message: 'Failed to update geo zone' });
    }
};

export const deleteGeoZone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await GeoZone.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Geo zone deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete geo zone' });
    }
};
