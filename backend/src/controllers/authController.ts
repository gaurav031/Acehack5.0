import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Tourist from '../models/Tourist.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await Tourist.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const tourist = new Tourist({ name, email, password });
        await tourist.save();

        const token = jwt.sign({ id: tourist._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: tourist._id,
                name: tourist.name,
                email: tourist.email
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const tourist: any = await Tourist.findOne({ email });
        if (!tourist || !(await tourist.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: tourist._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: tourist._id,
                name: tourist.name,
                email: tourist.email
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
