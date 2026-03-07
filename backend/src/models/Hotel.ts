import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    image: { type: String, required: true },
    pricePerNight: { type: String, required: true },
    description: { type: String, required: true },
    amenities: [{ type: String }],
    phone: { type: String },
    website: { type: String },
    distanceFromDelhi: { type: String },
    routeFromDelhi: { type: String },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    category: { type: String, enum: ['luxury', 'budget', 'heritage', 'business', 'boutique'], default: 'luxury' },
    isVerified: { type: Boolean, default: true },
    verifiedBy: { type: String, default: 'Ministry of Tourism, India' },
    checkIn: { type: String, default: '12:00 PM' },
    checkOut: { type: String, default: '11:00 AM' },
    totalRooms: { type: Number },
    tags: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Hotel', hotelSchema);
