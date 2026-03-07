import GeoZone from '../models/GeoZone.js';
import Tourist from '../models/Tourist.js';

export const checkTouristSafety = async (touristId: string, latitude: number, longitude: number) => {
    try {
        // Update tourist location
        await Tourist.findByIdAndUpdate(touristId, {
            currentLocation: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            lastUpdated: new Date()
        });

        // Find if the tourist is within any dangerous or restricted zones
        const zones = await GeoZone.find({
            geometry: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    }
                }
            }
        });

        return zones;
    } catch (error) {
        console.error('Geo-fencing check failed:', error);
        throw error;
    }
};
