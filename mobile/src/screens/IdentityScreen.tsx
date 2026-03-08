import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    Alert,
    Share,
} from 'react-native';
import {
    Shield,
    Fingerprint,
    Link,
    RefreshCcw,
    Clock,
    Copy,
    CheckCircle2,
    ChevronLeft,
    Eye,
    EyeOff,
    Info,
    Smartphone
} from 'lucide-react-native';
import axios from 'axios';
import API_BASE_URL from '../services/api';

const IdentityScreen = ({ route, navigation }: any) => {
    const { touristId } = route.params || { touristId: 'demo_user' };

    const [isLoading, setIsLoading] = useState(true);
    const [identityData, setIdentityData] = useState<any>(null);
    const [showFullDID, setShowFullDID] = useState(false);

    const fetchIdentity = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/identity/initialize`, { touristId });
            setIdentityData(response.data);
        } catch (error) {
            Alert.alert('Error', 'Could not sync identity with blockchain node.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIdentity();
    }, []);

    const handleRefreshTempId = async () => {
        fetchIdentity();
        Alert.alert('Identity Rotated', 'Your temporary travel ID has been updated for privacy.');
    };

    const copyToClipboard = (text: string, label: string) => {
        // In a real app, use Clipboard.setString
        Alert.alert('Copied', `${label} copied to secure clipboard.`);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={styles.loadingText}>Syncing Blockchain Instance...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color="#F8FAFC" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CRYPTO IDENTITY</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <Shield color="#EF4444" size={50} />
                        <View style={styles.pulseContainer}>
                            <RefreshCcw color="#10B981" size={20} />
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>Privacy-First Identification</Text>
                    <Text style={styles.heroSub}>Zero-Knowledge identification for secure travel across India.</Text>
                </View>

                {/* Blockchain DID Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Fingerprint color="#EF4444" size={24} />
                        <Text style={styles.cardTitle}>Blockchain Tourist Identity (DID)</Text>
                    </View>

                    <View style={styles.didBox}>
                        <Text style={styles.didText}>
                            {identityData?.did
                                ? (showFullDID ? identityData.did : `${identityData.did.substring(0, 20)}...`)
                                : "Generating Decentralized ID..."}
                        </Text>
                        <View style={styles.didActions}>
                            <TouchableOpacity onPress={() => setShowFullDID(!showFullDID)}>
                                {showFullDID ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => identityData?.did && copyToClipboard(identityData.did, 'DID')}>
                                <Copy size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Link size={14} color="#10B981" />
                        <Text style={styles.infoText}>Anchored to Polygon Proof-of-Stake Network</Text>
                    </View>
                </View>

                {/* Temporary Travel ID Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Smartphone color="#EF4444" size={24} />
                        <Text style={styles.cardTitle}>Temporary Travel ID</Text>
                        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshTempId}>
                            <RefreshCcw size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.tempIdValue}>{identityData?.tempId?.id || "----"}</Text>

                    <View style={styles.expiryRow}>
                        <Clock size={14} color="#94A3B8" />
                        <Text style={styles.expiryText}>
                            Expires in: {identityData?.tempId?.expiresAt
                                ? Math.round((new Date(identityData.tempId.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
                                : "--"} Hours
                        </Text>
                    </View>

                    <Text style={styles.cardNote}>
                        Use this ID for hotels and museum entries to keep your primary identity private.
                    </Text>
                </View>

                {/* Security Features */}
                <View style={styles.securityGrid}>
                    <View style={styles.securityItem}>
                        <View style={styles.securityIcon}>
                            <CheckCircle2 color="#10B981" size={20} />
                        </View>
                        <Text style={styles.securityLabel}>ZKP Verified</Text>
                    </View>
                    <View style={styles.securityItem}>
                        <View style={styles.securityIcon}>
                            <CheckCircle2 color="#10B981" size={20} />
                        </View>
                        <Text style={styles.securityLabel}>Encrypted Hub</Text>
                    </View>
                    <View style={styles.securityItem}>
                        <View style={styles.securityIcon}>
                            <CheckCircle2 color="#10B981" size={20} />
                        </View>
                        <Text style={styles.securityLabel}>Privacy Mode</Text>
                    </View>
                </View>

                {/* Privacy Badge */}
                <View style={styles.privacyBadge}>
                    <Info size={16} color="#64748B" />
                    <Text style={styles.privacyText}>
                        Your actual passport and visa numbers are never transmitted in clear text. They are verified using one-way cryptographic hashes.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#94A3B8', marginTop: 15, fontWeight: 'bold' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    backBtn: { padding: 5 },
    headerTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    heroSection: { alignItems: 'center', marginBottom: 30 },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    pulseContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#1E293B',
        padding: 5,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    heroTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', marginTop: 20 },
    heroSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 12 },
    cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', flex: 1 },
    didBox: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    didText: { color: '#10B981', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    didActions: { flexDirection: 'row', gap: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    infoText: { color: '#64748B', fontSize: 11 },
    refreshBtn: { padding: 5 },
    tempIdValue: {
        color: '#F8FAFC',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginVertical: 10,
        letterSpacing: 2,
    },
    expiryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    expiryText: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
    cardNote: { color: '#64748B', fontSize: 12, marginTop: 15, fontStyle: 'italic', textAlign: 'center' },
    securityGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    securityItem: { alignItems: 'center', gap: 8 },
    securityIcon: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 20 },
    securityLabel: { color: '#F8FAFC', fontSize: 10, fontWeight: 'bold' },
    privacyBadge: {
        backgroundColor: 'rgba(100, 116, 139, 0.1)',
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    privacyText: { color: '#64748B', fontSize: 11, flex: 1, lineHeight: 16 },
});

export default IdentityScreen;
