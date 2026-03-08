import { io, Socket } from 'socket.io-client';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert, Vibration } from 'react-native';

import { SOCKET_URL } from './api';

class SocketService {
    private socket: Socket | null = null;
    private watchId: number | null = null;

    connect() {
        this.socket = io(SOCKET_URL);
        this.socket.on('connect', () => {
            console.log('Connected to safety server');
        });

        this.socket?.on('safety_alert', (data) => {
            console.warn('SAFETY ALERT:', data.message);
            // Start repeated vibration for "alert sound" substitute
            Vibration.vibrate([1000, 1000, 1000, 1000], true);

            Alert.alert(
                'DANGER ZONE ALERT',
                `${data.message}\nMake sure to move to a safe location.`,
                [{ text: 'I Understand', onPress: () => Vibration.cancel() }],
                { cancelable: false }
            );
        });
    }

    async requestLocationPermission() {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        }

        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'Smart Tourist Safety needs access to your location to keep you safe.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return false;
    }

    startTracking(touristId: string) {
        if (this.watchId !== null) return;

        this.watchId = Geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log('Location Update:', latitude, longitude);

                this.socket?.emit('update_location', {
                    touristId,
                    lat: latitude,
                    lng: longitude,
                });
            },
            (error) => {
                console.error('Location error:', error);
            },
            {
                enableHighAccuracy: true,
                distanceFilter: 10, // Update every 10 meters
                interval: 30000,    // Update every 30 seconds
                fastestInterval: 15000,
            }
        );
    }

    stopTracking() {
        if (this.watchId !== null) {
            Geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    sendSOS(touristId: string, lat: number, lng: number, details?: string) {
        this.socket?.emit('sos_signal', {
            touristId,
            lat,
            lng,
            details,
        });
    }

    disconnect() {
        this.stopTracking();
        this.socket?.disconnect();
    }
}

export default new SocketService();
