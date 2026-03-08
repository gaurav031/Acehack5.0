import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Dimensions,
} from 'react-native';
import {
    ChevronLeft,
    MapPin,
    Star,
    Clock,
    Ticket,
    Navigation,
    Calendar,
    Shield,
    User,
    ExternalLink,
} from 'lucide-react-native';
import axios from 'axios';
import API_BASE_URL from '../services/api';

const { width } = Dimensions.get('window');

const PlaceDetailScreen = ({ route, navigation }: any) => {
    const { placeId, place: passedPlace } = route.params || {};
    const [place, setPlace] = useState<any>(passedPlace || null);
    const [loading, setLoading] = useState(!passedPlace);

    useEffect(() => {
        if (!passedPlace && placeId) {
            fetchPlace();
        }
    }, [placeId]);

    const fetchPlace = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/places/${placeId}`);
            if (response.data.success) setPlace(response.data.data);
        } catch (error) {
            console.log('Error fetching place:', error);
        } finally {
            setLoading(false);
        }
    };

    const openMaps = () => {
        if (!place) return;
        const { lat, lng } = place.coordinates || {};
        if (lat && lng) {
            const url = `https://www.google.com/maps/dir/New+Delhi,India/${lat},${lng}`;
            Linking.openURL(url);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
            </View>
        );
    }

    if (!place) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: '#F8FAFC' }}>Place not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: place.image }} style={styles.heroImage} />
                    <View style={styles.heroOverlay} />
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft color="#F8FAFC" size={28} />
                    </TouchableOpacity>
                    <View style={styles.heroBadges}>
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.ratingText}>{place.rating}</Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <Shield size={12} color="#10B981" fill="#10B981" />
                            <Text style={styles.verifiedText}>VERIFIED</Text>
                        </View>
                    </View>
                    <View style={styles.heroInfo}>
                        <Text style={styles.heroName}>{place.name}</Text>
                        <View style={styles.heroLocation}>
                            <MapPin size={16} color="#FFD700" />
                            <Text style={styles.heroLocationText}>{place.location}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Quick Info Grid */}
                    <View style={styles.quickInfoGrid}>
                        <View style={styles.quickInfoItem}>
                            <Clock size={20} color="#EF4444" />
                            <Text style={styles.quickInfoLabel}>Timings</Text>
                            <Text style={styles.quickInfoValue}>{place.timings || '6AM–6PM'}</Text>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <View style={styles.quickInfoItem}>
                            <Ticket size={20} color="#EF4444" />
                            <Text style={styles.quickInfoLabel}>Entry Fee</Text>
                            <Text style={styles.quickInfoValue}>{place.entryFee || 'Free'}</Text>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <View style={styles.quickInfoItem}>
                            <Navigation size={20} color="#EF4444" />
                            <Text style={styles.quickInfoLabel}>Distance</Text>
                            <Text style={styles.quickInfoValue}>{place.distanceFromDelhi || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Address */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MapPin size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>Address</Text>
                        </View>
                        <View style={styles.addressCard}>
                            <Text style={styles.addressText}>{place.address}</Text>
                        </View>
                    </View>

                    {/* History */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Calendar size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>History & Heritage</Text>
                        </View>
                        {(place.builtYear || place.builtBy) && (
                            <View style={styles.builtRow}>
                                {place.builtYear && (
                                    <View style={styles.builtItem}>
                                        <Text style={styles.builtLabel}>Built In</Text>
                                        <Text style={styles.builtValue}>{place.builtYear}</Text>
                                    </View>
                                )}
                                {place.builtBy && (
                                    <View style={styles.builtItem}>
                                        <Text style={styles.builtLabel}>Built By</Text>
                                        <Text style={styles.builtValue}>{place.builtBy}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={styles.historyCard}>
                            <Text style={styles.historyText}>{place.history}</Text>
                        </View>
                    </View>

                    {/* Tags */}
                    {place.tags && place.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {place.tags.map((tag: string, index: number) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Route from New Delhi */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Navigation size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>How to Reach from New Delhi</Text>
                        </View>
                        <View style={styles.routeCard}>
                            <Text style={styles.routeText}>{place.routeFromDelhi || 'Route information not available.'}</Text>
                        </View>
                        <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
                            <ExternalLink size={18} color="#F8FAFC" />
                            <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Verified By */}
                    <View style={styles.verifiedByCard}>
                        <Shield size={16} color="#10B981" />
                        <Text style={styles.verifiedByText}>Verified by {place.verifiedBy || 'Ministry of Tourism, India'}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    loadingContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
    heroContainer: { height: 340, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        background: 'linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.95) 100%)',
    },
    backButton: {
        position: 'absolute',
        top: 55,
        left: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        padding: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(248, 250, 252, 0.2)',
    },
    heroBadges: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        gap: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    ratingText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    verifiedText: { color: '#10B981', fontSize: 11, fontWeight: '900' },
    heroInfo: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
    },
    heroName: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    heroLocationText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
    content: { padding: 20 },
    quickInfoGrid: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 20,
        paddingVertical: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    quickInfoItem: { flex: 1, alignItems: 'center', gap: 6 },
    quickInfoDivider: { width: 1, backgroundColor: '#334155' },
    quickInfoLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    quickInfoValue: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '900' },
    addressCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    addressText: { color: '#CBD5E1', fontSize: 15, lineHeight: 22 },
    builtRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    builtItem: {
        flex: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    builtLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    builtValue: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
    historyCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    historyText: { color: '#CBD5E1', fontSize: 14, lineHeight: 24 },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    tag: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    tagText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
    routeCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    routeText: { color: '#CBD5E1', fontSize: 14, lineHeight: 24 },
    mapsButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    mapsButtonText: { color: '#F8FAFC', fontSize: 15, fontWeight: '900' },
    verifiedByCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        marginBottom: 30,
    },
    verifiedByText: { color: '#10B981', fontSize: 13, fontWeight: '600', flex: 1 },
});

export default PlaceDetailScreen;
