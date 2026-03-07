import { Request, Response } from 'express';

// Mock Visa Data
const visaDatabase = [
    {
        visaNumber: 'IND12345678',
        name: 'John Doe',
        passportNumber: 'Z1234567',
        visaType: 'Tourist (E-Visa)',
        issueDate: '2026-01-15',
        expiryDate: '2026-07-15',
        status: 'Active',
        entryType: 'Multiple',
        govtRef: 'GOV-IN-9921',
    },
    {
        visaNumber: 'IND98765432',
        name: 'Jane Smith',
        passportNumber: 'Y8765432',
        visaType: 'Business',
        issueDate: '2026-02-10',
        expiryDate: '2027-02-10',
        status: 'Active',
        entryType: 'Multiple',
        govtRef: 'GOV-IN-1044',
    }
];

export const getVisaDetails = async (req: Request, res: Response) => {
    try {
        const { visaNumber } = req.params;

        console.log(`[GOV-API] Searching for Visa Number: ${visaNumber}`);

        const visa = visaDatabase.find(v => v.visaNumber === visaNumber);

        if (!visa) {
            return res.status(404).json({ message: 'Visa not found in Indian Govt database' });
        }

        res.json({
            success: true,
            data: visa
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
