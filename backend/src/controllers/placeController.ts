import { Request, Response } from 'express';
import Place from '../models/Place.js';

// Seed default places if DB is empty
const defaultPlaces = [
    {
        name: 'Taj Mahal',
        location: 'Agra, Uttar Pradesh',
        city: 'Agra',
        state: 'Uttar Pradesh',
        address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
        history: 'The Taj Mahal is an ivory-white marble mausoleum on the right bank of the river Yamuna in the Indian city of Agra. It was commissioned in 1631 by the Mughal emperor Shah Jahan to house the tomb of his favourite wife, Mumtaz Mahal; it also houses the tomb of Shah Jahan himself. The tomb is the centrepiece of a 17-hectare complex, which includes a mosque and a guest house, and is set in formal gardens bounded on three sides by a crenellated wall.',
        builtYear: '1631–1648',
        builtBy: 'Emperor Shah Jahan',
        timings: 'Sunrise to Sunset (Closed on Friday)',
        entryFee: '₹200 (Indian), ₹1100 (Foreign)',
        distanceFromDelhi: '233 km',
        routeFromDelhi: 'Take NH19 (Yamuna Expressway) from Delhi towards Agra. The journey takes approximately 3–4 hours by car. Alternatively, take the Gatimaan Express train from Hazrat Nizamuddin Railway Station (1.5 hours) or Shatabdi Express from New Delhi Railway Station.',
        coordinates: { lat: 27.1751, lng: 78.0421 },
        category: 'heritage',
        tags: ['UNESCO', 'World Heritage', 'Mughal', 'Architecture'],
    },
    {
        name: 'Hawa Mahal',
        location: 'Jaipur, Rajasthan',
        city: 'Jaipur',
        state: 'Rajasthan',
        address: 'Hawa Mahal Rd, Badi Choupad, J.D.A. Market, Pink City, Jaipur, Rajasthan 302002',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        history: 'Hawa Mahal (Palace of Winds or Palace of Breeze) is a palace in Jaipur, India. Built from red and pink sandstone, the palace sits on the edge of the City Palace, Jaipur, and extends to the zenana, or womens chambers. The structure was built in 1799 by Maharaja Sawai Pratap Singh, the grandson of Maharaja Sawai Jai Singh, who was the founder of Jaipur.',
        builtYear: '1799',
        builtBy: 'Maharaja Sawai Pratap Singh',
        timings: '9:00 AM – 5:00 PM',
        entryFee: '₹50 (Indian), ₹200 (Foreign)',
        distanceFromDelhi: '282 km',
        routeFromDelhi: 'Take NH48 from Delhi towards Jaipur. The journey takes approximately 4–5 hours by car. You can also take the Pink City Express or Shatabdi Express from New Delhi Railway Station to Jaipur Junction (approximately 4.5 hours).',
        coordinates: { lat: 26.9239, lng: 75.8267 },
        category: 'palace',
        tags: ['Rajasthan', 'Architecture', 'Pink City', 'Royal'],
    },
    {
        name: 'India Gate',
        location: 'New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        address: 'Rajpath, India Gate, New Delhi, Delhi 110001',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
        history: 'India Gate is a war memorial located astride the Rajpath (now called Kartavya Path), on the eastern edge of the ceremonial axis of New Delhi. It commemorates the 70,000 soldiers of the British Indian Army who died in the period 1914–1921 in the First World War, in France, Flanders, Mesopotamia, Persia, East Africa, Gallipoli and elsewhere in the Near and the Far East. India Gate was designed by Sir Edwin Lutyens and was built in 1931.',
        builtYear: '1931',
        builtBy: 'Sir Edwin Lutyens',
        timings: 'Open 24 hours',
        entryFee: 'Free',
        distanceFromDelhi: '0 km (Located in Delhi)',
        routeFromDelhi: 'India Gate is located in the heart of New Delhi. Take the Delhi Metro Blue Line to Central Secretariat Station, then walk approximately 10 minutes to India Gate. By road, it is easily accessible via Kartavya Path (Rajpath).',
        coordinates: { lat: 28.6129, lng: 77.2295 },
        category: 'monument',
        tags: ['War Memorial', 'National Monument', 'Delhi', 'Landmark'],
    },
    {
        name: 'Qutb Minar',
        location: 'New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        address: 'Mehrauli, New Delhi, Delhi 110030',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1515091943-9d5c0ad475af?auto=format&fit=crop&w=800&q=80',
        history: "Qutb Minar is a minaret and victory tower that forms part of the Qutb complex, a UNESCO World Heritage Site in the Mehrauli area of New Delhi, India. It is a 72.5-metre (238 ft) tall tapering tower of five storeys, with a 14.3 m (47 ft) base diameter, reducing to 2.7 m (9 ft) at the top of the peak. It was built in 1193 by Qutb ud-Din Aibak shortly after the defeat of Delhi's last Hindu ruler.",
        builtYear: '1193',
        builtBy: 'Qutb ud-Din Aibak',
        timings: 'Sunrise to Sunset',
        entryFee: '₹40 (Indian), ₹600 (Foreign)',
        distanceFromDelhi: '15 km from Connaught Place',
        routeFromDelhi: 'Take the Delhi Metro Yellow Line to Qutab Minar Station. The minar is a 10-minute walk or short auto-rickshaw ride from the station. By road, take NH48 towards Mehrauli.',
        coordinates: { lat: 28.5245, lng: 77.1855 },
        category: 'heritage',
        tags: ['UNESCO', 'Islamic Architecture', 'Medieval', 'Tower'],
    },
];

export const seedPlaces = async () => {
    const count = await Place.countDocuments();
    if (count === 0) {
        await Place.insertMany(defaultPlaces);
        console.log('✅ Default heritage places seeded');
    }
};

// GET all places
export const getAllPlaces = async (req: Request, res: Response) => {
    try {
        const places = await Place.find({ isVerified: true }).sort({ rating: -1 });
        res.json({ success: true, data: places });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch places' });
    }
};

// GET single place
export const getPlace = async (req: Request, res: Response) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
        res.json({ success: true, data: place });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch place' });
    }
};

// POST create place (admin only)
export const createPlace = async (req: Request, res: Response) => {
    try {
        const place = new Place(req.body);
        await place.save();
        res.status(201).json({ success: true, data: place });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// PUT update place (admin only)
export const updatePlace = async (req: Request, res: Response) => {
    try {
        const place = await Place.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
        res.json({ success: true, data: place });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// DELETE place (admin only)
export const deletePlace = async (req: Request, res: Response) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);
        if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
        res.json({ success: true, message: 'Place deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete place' });
    }
};
