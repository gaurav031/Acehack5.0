import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    Linking,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import {
    ChevronLeft,
    Shield,
    ScanLine,
    Zap,
    AlertTriangle,
    Camera as CameraIcon,
} from 'lucide-react-native';
import axios from 'axios';
import { IP } from '../services/api';

const { width, height } = Dimensions.get('window');
const SCANNER_API_URL = `http://${IP}:8000`; // Works with 'adb reverse tcp:8000 tcp:8000'

const ScannerScreen = ({ navigation }: any) => {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camera = useRef<Camera>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [lastScanTime, setLastScanTime] = useState(0);
    const [status, setStatus] = useState('Position item in frame...');

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    // Live Detection Logic
    useEffect(() => {
        const interval = setInterval(async () => {
            if (isScanning || !!scanResult || !camera.current) return;

            // Only scan every 5 seconds for Gemini API (avoid rate limits)
            const now = Date.now();
            if (now - lastScanTime < 5000) return;

            try {
                setStatus('Analyzing live frame...');
                setIsScanning(true);

                const photo = await camera.current.takeSnapshot();

                const formData = new FormData();
                formData.append('file', {
                    uri: Platform.OS === 'android' ? `file://${photo.path}` : photo.path,
                    type: 'image/jpeg',
                    name: 'scan.jpg',
                } as any);

                const res = await axios.post(`${SCANNER_API_URL}/scan`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 15000, // Increased to 15s to allow for AI analysis
                });

                if (res.data.success) {
                    setScanResult(res.data);
                    setStatus('Deep Analysis Complete!');
                } else {
                    setStatus('Could not identify item...');
                    setLastScanTime(Date.now());
                }
            } catch (error) {
                console.log('Live Scan Error:', error);
                // More helpful status message
                if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                    setStatus('Scanner Slow - retrying...');
                } else {
                    setStatus('Scanner Offline (Check Connection)');
                }
            } finally {
                setIsScanning(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isScanning, scanResult, lastScanTime]);

    const resetScanner = () => {
        setScanResult(null);
        setLastScanTime(0);
        setStatus('Position item in frame...');
    };

    if (!hasPermission) {
        return (
            <View style={styles.errorContainer}>
                <Shield size={64} color="#EF4444" />
                <Text style={styles.errorTitle}>Camera Permission Required</Text>
                <Text style={styles.errorText}>Please enable camera access in settings to use the live price scanner.</Text>
                <TouchableOpacity style={styles.btn} onPress={requestPermission}>
                    <Text style={styles.btnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.errorContainer}>
                <AlertTriangle size={64} color="#F59E0B" />
                <Text style={styles.errorTitle}>No Camera Found</Text>
                <Text style={styles.errorText}>Your device doesn't seem to have a back camera available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
            />

            {/* Overlays */}
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ChevronLeft color="#FFF" size={28} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Zap size={20} color="#FFD700" />
                        <Text style={styles.headerTitle}>GUARDIAN AI SCANNER</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Scan Frame */}
                {!scanResult && (
                    <View style={styles.scanFrameContainer}>
                        <View style={styles.scannerCorners} />
                        <View style={styles.scanLine} />
                    </View>
                )}

                {/* Status Indicator */}
                <View style={styles.statusContainer}>
                    {isScanning ? (
                        <ActivityIndicator color="#EF4444" size="small" />
                    ) : (
                        <Zap size={16} color="#FFD700" fill="#FFD700" />
                    )}
                    <Text style={styles.statusText}>{status}</Text>
                </View>

                {/* Result Card */}
                {scanResult && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Shield size={18} color="#10B981" />
                            <Text style={styles.resultBadge}>AI VERIFIED MARKET PRICE</Text>
                        </View>

                        <Text style={styles.itemName}>{scanResult.item_name}</Text>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>FAIR STREET PRICE (INR)</Text>
                            <Text style={styles.priceValue}>₹{scanResult.fair_price_inr}</Text>
                            <Text style={styles.marketContext}>{scanResult.market_context}</Text>
                        </View>

                        <View style={styles.linksRow}>
                            <TouchableOpacity
                                style={styles.miniLink}
                                onPress={() => Linking.openURL(scanResult.shopping_links.amazon)}
                            >
                                <Text style={styles.linkText}>View on Amazon</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.miniLink}
                                onPress={() => Linking.openURL(scanResult.shopping_links.flipkart)}
                            >
                                <Text style={styles.linkText}>View on Flipkart</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.advice}>
                            💡 {scanResult.authenticity_tip}
                        </Text>

                        <TouchableOpacity style={styles.rescanBtn} onPress={resetScanner}>
                            <CameraIcon color="#FFF" size={20} />
                            <Text style={styles.rescanText}>CONTINUE SCANNING</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingVertical: 50 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backBtn: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    headerTitle: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1, fontSize: 13 },

    scanFrameContainer: {
        width: 250,
        height: 250,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerCorners: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 40,
        borderStyle: 'dashed',
    },
    scanLine: {
        position: 'absolute',
        width: '90%',
        height: 2,
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },

    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 20,
    },
    statusText: { color: '#F8FAFC', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

    resultCard: {
        marginHorizontal: 20,
        backgroundColor: '#1E293B',
        borderRadius: 30,
        padding: 25,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        shadowColor: '#000',
        elevation: 20,
    },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
    resultBadge: { color: '#10B981', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
    itemName: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', marginBottom: 15 },
    priceContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 15,
    },
    priceLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
    priceValue: { color: '#FFD700', fontSize: 28, fontWeight: '900' },
    marketContext: { color: '#94A3B8', fontSize: 11, marginTop: 5, lineHeight: 16 },
    linksRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    miniLink: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    linkText: { color: '#60A5FA', fontSize: 10, fontWeight: 'bold' },
    advice: { color: '#94A3B8', fontSize: 12, lineHeight: 18, fontStyle: 'italic', marginBottom: 20 },
    rescanBtn: {
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 15,
        borderRadius: 15,
    },
    rescanText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    errorContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
    errorText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 30 },
    btn: { backgroundColor: '#EF4444', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
    btnText: { color: '#FFF', fontWeight: 'bold' },
});

export default ScannerScreen;
