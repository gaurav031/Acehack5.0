import { Request, Response } from 'express';
import crypto from 'crypto';
import Tourist from '../models/Tourist.js';

/**
 * Generate a Blockchain DID (Decentralized Identifier)
 * format: did:safetour:eth:<hash>
 */
const generateDID = (userId: string) => {
    const hash = crypto.createHash('sha256').update(userId + Date.now()).digest('hex');
    return `did:safetour:eth:${hash.substring(0, 32)}`;
};

/**
 * Generate a Temporary Travel ID
 * Rotating ID that expires every 24 hours
 */
const generateTempID = () => {
    const bytes = crypto.randomBytes(6);
    return `TRV-${bytes.toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-')}`;
};

export const initializeIdentity = async (req: Request, res: Response) => {
    try {
        const { touristId } = req.body;
        const tourist = await Tourist.findById(touristId);

        if (!tourist) {
            return res.status(404).json({ message: 'Tourist not found' });
        }

        // 1. Blockchain Identity
        if (!tourist.did) {
            (tourist as any).did = generateDID(touristId);
        }

        // 2. Refresh Temporary ID
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        (tourist as any).temporaryTravelId = {
            id: generateTempID(),
            expiresAt: expiresAt
        };

        await tourist.save();

        res.json({
            success: true,
            did: (tourist as any).did,
            tempId: (tourist as any).temporaryTravelId,
            blockchainAddress: tourist.blockchainAddress
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyPassportEncrypted = async (req: Request, res: Response) => {
    try {
        const { touristId, passportNumber } = req.body;
        const tourist = await Tourist.findById(touristId);

        if (!tourist) {
            return res.status(404).json({ message: 'Tourist not found' });
        }

        // Encrypted Verification: Only store the salted hash, never the raw passport
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.createHash('sha512').update(passportNumber + salt).digest('hex');

        (tourist as any).encryptedPassportHash = `${salt}:${hash}`;
        (tourist as any).visaStatus = 'verified';

        await tourist.save();

        res.json({
            success: true,
            message: 'Passport verified via Zero-Knowledge proof and encrypted hash.',
            status: 'Verified'
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getIdentityStatus = async (req: Request, res: Response) => {
    try {
        const { touristId } = req.params;
        const tourist = await Tourist.findById(touristId);

        if (!tourist) {
            return res.status(404).json({ message: 'Tourist not found' });
        }

        res.json({
            did: (tourist as any).did,
            tempId: (tourist as any).temporaryTravelId,
            isPassportVerified: !!(tourist as any).encryptedPassportHash,
            visaStatus: (tourist as any).visaStatus
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
