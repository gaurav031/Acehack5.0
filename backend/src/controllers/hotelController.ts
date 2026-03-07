import { Request, Response } from 'express';
import Hotel from '../models/Hotel.js';

const defaultHotels = [
    {
        name: 'Taj Palace',
        location: 'New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        address: '2, Sardar Patel Marg, Diplomatic Enclave, New Delhi, Delhi 110021',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        pricePerNight: '₹12,000',
        description: 'The Taj Palace, New Delhi is a luxury hotel in the Diplomatic Enclave of New Delhi. Featuring stunning views of the city skyline, the hotel offers world-class amenities including multiple restaurants, a spa, and a swimming pool. It is one of the finest examples of Indian luxury hospitality.',
        amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service', 'Concierge', 'Valet Parking'],
        phone: '+91-11-2611-0202',
        website: 'https://www.tajhotels.com',
        distanceFromDelhi: '0 km (Located in Delhi)',
        routeFromDelhi: 'Located in the Diplomatic Enclave, New Delhi. Take Metro Violet Line to Khan Market / Janpath, then take a cab. By road, accessible via Sardar Patel Marg.',
        coordinates: { lat: 28.5978, lng: 77.1756 },
        category: 'luxury',
        checkIn: '2:00 PM',
        checkOut: '12:00 PM',
        totalRooms: 403,
        tags: ['5-Star', 'Luxury', 'Diplomatic Area', 'Swimming Pool'],
    },
    {
        name: 'Oberoi Grand',
        location: 'Kolkata, West Bengal',
        city: 'Kolkata',
        state: 'West Bengal',
        address: '15 Jawaharlal Nehru Road, Kolkata, West Bengal 700013',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        pricePerNight: '₹9,500',
        description: 'The Oberoi Grand is positioned in the heart of Kolkata and is known as the jewel of the East. Dating back to 1880, this iconic heritage hotel blends colonial grandeur with modern luxury. The hotel provides an unparalleled experience with its exquisite rooms, fine dining restaurants, and world-class service.',
        amenities: ['Free WiFi', 'Heritage Architecture', 'Swimming Pool', 'Spa', 'Fine Dining', 'Bar', 'Business Centre', 'Concierge'],
        phone: '+91-33-2249-2323',
        website: 'https://www.oberoihotels.com',
        distanceFromDelhi: '1,470 km',
        routeFromDelhi: 'Fly from Indira Gandhi International Airport to Netaji Subhas Chandra Bose Airport (approximately 2 hours). Alternatively, take the Rajdhani Express from New Delhi Railway Station (approximately 17 hours).',
        coordinates: { lat: 22.5726, lng: 88.3639 },
        category: 'heritage',
        checkIn: '2:00 PM',
        checkOut: '12:00 PM',
        totalRooms: 209,
        tags: ['Heritage', '5-Star', 'Colonial', 'Iconic'],
    },
    {
        name: 'ITC Maurya',
        location: 'New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        address: 'Sardar Patel Marg, Diplomatic Enclave, New Delhi, Delhi 110021',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1551882547-ff43c63efe8c?auto=format&fit=crop&w=800&q=80',
        pricePerNight: '₹15,000',
        description: 'ITC Maurya is a luxury hotel in New Delhi, India, built in 1977. Named after the Maurya Empire, the hotel has hosted several heads of state including US Presidents. The hotel features Bukhara and Dum Pukht, two of Delhi\'s most celebrated restaurants.',
        amenities: ['Free WiFi', 'Swimming Pool', 'Luxury Spa', 'Multiple Restaurants', 'Business Centre', 'Club Lounge', '24h Room Service', 'Valet Parking'],
        phone: '+91-11-2611-2233',
        website: 'https://www.itchotels.com',
        distanceFromDelhi: '0 km (Located in Delhi)',
        routeFromDelhi: 'Located in the Diplomatic Enclave. Take Metro to Udyog Bhawan Metro Station (Yellow Line), then a short cab ride. By road, accessible via Sardar Patel Marg from the city centre.',
        coordinates: { lat: 28.5982, lng: 77.1742 },
        category: 'luxury',
        checkIn: '2:00 PM',
        checkOut: '12:00 PM',
        totalRooms: 438,
        tags: ['5-Star', 'Presidential', 'Fine Dining', 'ITC'],
    },
    {
        name: 'Umaid Bhawan Palace',
        location: 'Jodhpur, Rajasthan',
        city: 'Jodhpur',
        state: 'Rajasthan',
        address: 'Near Circuit House, Cantt Area, Jodhpur, Rajasthan 342006',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=800&q=80',
        pricePerNight: '₹35,000',
        description: 'Umaid Bhawan Palace in Jodhpur is a magnificent art deco palace that serves as a heritage hotel managed by the Taj Group. Still home to the royal family, part of the palace is a luxury hotel and another part is a museum. It is one of the world\'s largest private residences.',
        amenities: ['Free WiFi', 'Royal Pool', 'Tennis Court', 'Spa', 'Fine Dining', 'Museum', 'Antique Sittingrooms', 'Butler Service'],
        phone: '+91-291-251-0101',
        website: 'https://www.tajhotels.com/jodhpur',
        distanceFromDelhi: '585 km',
        routeFromDelhi: 'Take NH48 from Delhi towards Jaipur, then NH62 towards Jodhpur. Total driving time is approximately 8-9 hours. By air, fly from IGI Airport to Jodhpur Airport (1.5 hours). Mandore Express train from Delhi is another option.',
        coordinates: { lat: 26.2801, lng: 73.0444 },
        category: 'heritage',
        checkIn: '2:00 PM',
        checkOut: '12:00 PM',
        totalRooms: 70,
        tags: ['Heritage Palace', 'Luxury', 'Rajasthan', 'Royal'],
    },
];

export const seedHotels = async () => {
    const count = await Hotel.countDocuments();
    if (count === 0) {
        await Hotel.insertMany(defaultHotels);
        console.log('✅ Default hotels seeded');
    }
};

// GET all hotels
export const getAllHotels = async (req: Request, res: Response) => {
    try {
        const hotels = await Hotel.find({ isVerified: true }).sort({ rating: -1 });
        res.json({ success: true, data: hotels });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hotels' });
    }
};

// GET single hotel
export const getHotel = async (req: Request, res: Response) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
        res.json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hotel' });
    }
};

// POST create hotel (admin only)
export const createHotel = async (req: Request, res: Response) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        res.status(201).json({ success: true, data: hotel });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// PUT update hotel (admin only)
export const updateHotel = async (req: Request, res: Response) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
        res.json({ success: true, data: hotel });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// DELETE hotel (admin only)
export const deleteHotel = async (req: Request, res: Response) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);
        if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
        res.json({ success: true, message: 'Hotel deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete hotel' });
    }
};
