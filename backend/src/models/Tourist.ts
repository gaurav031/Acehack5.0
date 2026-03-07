import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const touristSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    blockchainAddress: { type: String },
    did: { type: String, unique: true, sparse: true },
    encryptedPassportHash: { type: String },
    temporaryTravelId: {
        id: { type: String },
        expiresAt: { type: Date }
    },
    visaStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },
    currentLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    profileImage: { type: String, default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
    phone: { type: String },
    nationality: { type: String },
    visaNumber: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'emergency'], default: 'active' }
}, { timestamps: true });

touristSchema.index({ currentLocation: '2dsphere' });

touristSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

touristSchema.methods.comparePassword = async function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Tourist', touristSchema);
