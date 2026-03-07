import { Request, Response } from 'express';
import Tourist from '../models/Tourist.js';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { touristId } = req.params;
        const tourist = await Tourist.findById(touristId).select('-password');

        if (!tourist) {
            return res.status(404).json({ message: 'Tourist not found' });
        }

        res.json({
            success: true,
            data: tourist
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { touristId } = req.params;
        const updates = req.body;

        // Prevent password updates through this endpoint
        delete updates.password;

        const tourist = await Tourist.findByIdAndUpdate(
            touristId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!tourist) {
            return res.status(404).json({ message: 'Tourist not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: tourist
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
