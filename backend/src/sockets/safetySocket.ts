import { Server, Socket } from 'socket.io';
import { checkTouristSafety } from '../services/geoService.js';

export const handleSocketEvents = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Location Update Event
        socket.on('update_location', async (data: { touristId: string, lat: number, lng: number }) => {
            try {
                const zones = await checkTouristSafety(data.touristId, data.lat, data.lng);

                // If dangerous zones are found, emit alert to the tourist
                if (zones.length > 0) {
                    const dangerZones = zones.filter(z => z.type !== 'safe');
                    if (dangerZones.length > 0) {
                        socket.emit('safety_alert', {
                            message: 'Warning: You are in a high-risk area.',
                            zones: dangerZones
                        });
                    }
                }

                // Broadcast to Admin Dashboard
                io.to('admin_room').emit('tourist_location_update', {
                    id: data.touristId,
                    lat: data.lat,
                    lng: data.lng,
                    isSafe: !zones.some(z => z.type === 'danger')
                });

            } catch (err) {
                console.error('Socket location update error:', err);
            }
        });

        // SOS Event
        socket.on('sos_signal', (data: { touristId: string, lat: number, lng: number, details?: string }) => {
            console.log('SOS RECEIVED from:', data.touristId);

            // Broadcast to Admins
            io.to('admin_room').emit('emergency_sos', {
                id: data.touristId,
                lat: data.lat,
                lng: data.lng,
                timestamp: new Date(),
                details: data.details || 'Emergency SOS button triggered.'
            });
        });

        // Join Admin Room
        socket.on('join_admin', () => {
            socket.join('admin_room');
            console.log('Admin joined safety command room');
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};
