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
    Phone,
    Navigation,
    Shield,
    Clock,
    ExternalLink,
    Wifi,
    ChevronRight,
} from 'lucide-react-native';
import axios from 'axios';
import API_BASE_URL from '../services/api';

const { width } = Dimensions.get('window');

const HotelDetailScreen = ({ route, navigation }: any) => {
    const { hotelId, hotel: passedHotel } = route.params || {};
    const [hotel, setHotel] = useState<any>(passedHotel || null);
    const [loading, setLoading] = useState(!passedHotel);

    useEffect(() => {
        if (!passedHotel && hotelId) {
            fetchHotel();
        }
    }, [hotelId]);

    const fetchHotel = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/hotels/${hotelId}`);
            if (response.data.success) setHotel(response.data.data);
        } catch (error) {
            console.log('Error fetching hotel:', error);
        } finally {
            setLoading(false);
        }
    };

    const openMaps = () => {
        if (!hotel) return;
        const { lat, lng } = hotel.coordinates || {};
        if (lat && lng) {
            const url = `https://www.google.com/maps/dir/New+Delhi,India/${lat},${lng}`;
            Linking.openURL(url);
        }
    };

    const callHotel = () => {
        if (hotel?.phone) Linking.openURL(`tel:${hotel.phone}`);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
            </View>
        );
    }

    if (!hotel) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: '#F8FAFC' }}>Hotel not found</Text>
            </View>
        );
    }

    const categoryColors: Record<string, string> = {
        luxury: '#FFD700',
        heritage: '#F59E0B',
        budget: '#10B981',
        business: '#3B82F6',
        boutique: '#A855F7',
    };

    const catColor = categoryColors[hotel.category] || '#FFD700';

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: hotel.image }} style={styles.heroImage} />
                    <View style={styles.heroOverlay} />
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft color="#F8FAFC" size={28} />
                    </TouchableOpacity>
                    <View style={styles.heroBadges}>
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.ratingText}>{hotel.rating}</Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <Shield size={12} color="#10B981" fill="#10B981" />
                            <Text style={styles.verifiedText}>SAFE & VERIFIED</Text>
                        </View>
                    </View>
                    <View style={styles.heroInfo}>
                        <View style={[styles.categoryBadge, { borderColor: catColor + '60', backgroundColor: catColor + '20' }]}>
                            <Text style={[styles.categoryText, { color: catColor }]}>{hotel.category?.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.heroName}>{hotel.name}</Text>
                        <View style={styles.heroRow}>
                            <MapPin size={15} color="#CBD5E1" />
                            <Text style={styles.heroLocationText}>{hotel.location}</Text>
                        </View>
                        <Text style={[styles.heroPrice, { color: catColor }]}>{hotel.pricePerNight} / night</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Quick Info Grid */}
                    <View style={styles.quickInfoGrid}>
                        <View style={styles.quickInfoItem}>
                            <Clock size={20} color="#EF4444" />
                            <Text style={styles.quickInfoLabel}>Check In</Text>
                            <Text style={styles.quickInfoValue}>{hotel.checkIn || '2:00 PM'}</Text>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <View style={styles.quickInfoItem}>
                            <Clock size={20} color="#EF4444" />
                            <Text style={styles.quickInfoLabel}>Check Out</Text>
                            <Text style={styles.quickInfoValue}>{hotel.checkOut || '12:00 PM'}</Text>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <View style={styles.quickInfoItem}>
                            <Navigation size={20} color="#EF4444" />
                            <Text style={styles.quickInfoLabel}>Distance</Text>
                            <Text style={styles.quickInfoValue}>{hotel.distanceFromDelhi || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        {hotel.phone && (
                            <TouchableOpacity style={styles.callButton} onPress={callHotel}>
                                <Phone size={18} color="#F8FAFC" />
                                <Text style={styles.callButtonText}>Call Hotel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
                            <Navigation size={18} color="#F8FAFC" />
                            <Text style={styles.mapsButtonText}>Navigate</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Address */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MapPin size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>Address</Text>
                        </View>
                        <View style={styles.addressCard}>
                            <Text style={styles.addressText}>{hotel.address}</Text>
                        </View>
                    </View>

                    {/* About */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Shield size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>About This Hotel</Text>
                        </View>
                        <View style={styles.descriptionCard}>
                            <Text style={styles.descriptionText}>{hotel.description}</Text>
                        </View>
                    </View>

                    {/* Amenities */}
                    {hotel.amenities && hotel.amenities.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Wifi size={20} color="#EF4444" />
                                <Text style={styles.sectionTitle}>Amenities</Text>
                            </View>
                            <View style={styles.amenitiesGrid}>
                                {hotel.amenities.map((amenity: string, index: number) => (
                                    <View key={index} style={styles.amenityItem}>
                                        <View style={styles.amenityDot} />
                                        <Text style={styles.amenityText}>{amenity}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Route from Delhi */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Navigation size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>How to Reach from New Delhi</Text>
                        </View>
                        <View style={styles.routeCard}>
                            <Text style={styles.routeText}>{hotel.routeFromDelhi || 'Route information not available.'}</Text>
                        </View>
                        <TouchableOpacity style={styles.mapsButtonFull} onPress={openMaps}>
                            <ExternalLink size={18} color="#F8FAFC" />
                            <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Verified By */}
                    <View style={styles.verifiedByCard}>
                        <Shield size={16} color="#10B981" />
                        <Text style={styles.verifiedByText}>
                            Verified Safe Hotel — {hotel.verifiedBy || 'Ministry of Tourism, India'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    loadingContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
    heroContainer: { height: 360, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    categoryText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    heroName: {
        color: '#F8FAFC',
        fontSize: 26,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 6,
    },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
    heroLocationText: { color: '#CBD5E1', fontSize: 13 },
    heroPrice: { fontSize: 22, fontWeight: '900' },
    content: { padding: 20 },
    quickInfoGrid: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 20,
        paddingVertical: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    quickInfoItem: { flex: 1, alignItems: 'center', gap: 6 },
    quickInfoDivider: { width: 1, backgroundColor: '#334155' },
    quickInfoLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    quickInfoValue: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 14,
    },
    callButtonText: { color: '#F8FAFC', fontSize: 15, fontWeight: '900' },
    mapsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 14,
    },
    mapsButtonText: { color: '#F8FAFC', fontSize: 15, fontWeight: '900' },
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
    descriptionCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    descriptionText: { color: '#CBD5E1', fontSize: 14, lineHeight: 24 },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#334155',
        width: (width - 52) / 2,
    },
    amenityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    amenityText: { color: '#CBD5E1', fontSize: 13, flex: 1 },
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
    mapsButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 14,
    },
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

export default HotelDetailScreen;
