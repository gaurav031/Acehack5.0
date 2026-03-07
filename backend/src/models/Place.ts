import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    image: { type: String, required: true },
    history: { type: String, required: true },
    builtYear: { type: String },
    builtBy: { type: String },
    timings: { type: String, default: '6:00 AM – 6:00 PM' },
    entryFee: { type: String, default: 'Free' },
    distanceFromDelhi: { type: String },
    routeFromDelhi: { type: String },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    category: { type: String, enum: ['heritage', 'monument', 'temple', 'palace', 'natural', 'famous'], default: 'heritage' },
    isVerified: { type: Boolean, default: true },
    verifiedBy: { type: String, default: 'Ministry of Tourism, India' },
    tags: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Place', placeSchema);
