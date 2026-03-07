import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
    tourist: { type: mongoose.Schema.Types.ObjectId, ref: 'Tourist', required: true },
    description: { type: String, required: true },
    mediaUrl: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    aiAnalysis: {
        riskScore: Number,
        category: String,
        immediateAction: String,
        priority: String
    },
    status: { type: String, enum: ['pending', 'investigating', 'resolved'], default: 'pending' },
    reportedAt: { type: Date, default: Date.now }
}, { timestamps: true });

incidentSchema.index({ location: '2dsphere' });

export default mongoose.model('Incident', incidentSchema);
