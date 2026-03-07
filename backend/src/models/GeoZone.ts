import mongoose from 'mongoose';

const geoZoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['safe', 'danger', 'restricted'], required: true },
    geometry: {
        type: {
            type: String,
            enum: ['Polygon'],
            required: true
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of arrays of numbers
            required: true
        }
    },
    severity: { type: Number, default: 0 } // 0-100 for risk
}, { timestamps: true });

geoZoneSchema.index({ geometry: '2dsphere' });

export default mongoose.model('GeoZone', geoZoneSchema);
