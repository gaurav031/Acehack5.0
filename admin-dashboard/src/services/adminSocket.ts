import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class AdminSocketService {
    private socket: Socket | null = null;

    connect() {
        this.socket = io(SOCKET_URL);

        this.socket.on('connect', () => {
            console.log('Admin connected to socket');
            this.socket?.emit('join_admin');
        });

        return this.socket;
    }

    onTouristUpdate(callback: (data: any) => void) {
        this.socket?.on('tourist_location_update', callback);
    }

    onEmergencySOS(callback: (data: any) => void) {
        this.socket?.on('emergency_sos', callback);
    }

    disconnect() {
        this.socket?.disconnect();
    }
}

export default new AdminSocketService();
