import { Platform } from 'react-native';

/**
 * CONNECTIVITY GUIDE:
 * 1. Physical Device (USB): Run 'adb reverse tcp:5001 tcp:5001' and use 'localhost'
 * 2. Android Emulator: Use '10.0.2.2'
 * 3. Physical Device (Wi-Fi): Use your computer's local IP (e.g. 192.168.1.X)
 */
export const IP = 'localhost';

export const SOCKET_URL = `http://${IP}:5001`;
export const API_BASE_URL = `http://${IP}:5001/api`;

export default API_BASE_URL;
