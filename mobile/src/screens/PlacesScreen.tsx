import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Dimensions,
} from 'react-native';
import {
    ChevronLeft,
    MapPin,
    Star,
    Shield,
    Search,
    Landmark,
    SlidersHorizontal,
} from 'lucide-react-native';
import axios from 'axios';
import API_BASE_URL from '../services/api';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'heritage', 'monument', 'temple', 'palace', 'natural', 'famous'];

const PlacesScreen = ({ navigation }: any) => {
    const [places, setPlaces] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchPlaces();
    }, []);

    useEffect(() => {
        filterPlaces();
    }, [searchQuery, selectedCategory, places]);

    const fetchPlaces = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/places`);
            if (response.data.success) {
                setPlaces(response.data.data);
                setFiltered(response.data.data);
            }
        } catch (error) {
            console.log('Error fetching places:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterPlaces = () => {
        let result = [...places];
        if (selectedCategory !== 'All') {
            result = result.filter(p => p.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                p.city.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    };

    const renderPlace = ({ item }: any) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PlaceDetail', { place: item })}
            activeOpacity={0.88}
        >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardImageOverlay} />
            <View style={styles.topBadges}>
                <View style={styles.ratingBadge}>
                    <Star size={12} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                {item.isVerified && (
                    <View style={styles.verifiedBadge}>
                        <Shield size={10} color="#10B981" />
                        <Text style={styles.verifiedText}>VERIFIED</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.locationRow}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={styles.locationText}>{item.location}</Text>
                </View>
                <View style={styles.cardFooter}>
                    <View style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{item.category}</Text>
                    </View>
                    {item.distanceFromDelhi && (
                        <Text style={styles.distanceText}>{item.distanceFromDelhi}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color="#F8FAFC" size={28} />
                </TouchableOpacity>
                <View style={styles.headerTitleRow}>
                    <Landmark size={22} color="#EF4444" />
                    <Text style={styles.headerTitle}>Heritage & Famous Places</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={18} color="#64748B" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search places, cities..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Category Filter */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={CATEGORIES}
                keyExtractor={item => item}
                style={styles.categoryList}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(item)}
                    >
                        <Text style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextActive]}>
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Stats */}
            <View style={styles.statsRow}>
                <Text style={styles.statsText}>{filtered.length} places found</Text>
                <View style={styles.statsBadge}>
                    <Shield size={12} color="#10B981" />
                    <Text style={styles.statsBadgeText}>All Govt Verified</Text>
                </View>
            </View>

            {/* Places List */}
            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#EF4444" />
                    <Text style={styles.loaderText}>Loading places...</Text>
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.emptyState}>
                    <Landmark size={48} color="#334155" />
                    <Text style={styles.emptyText}>No places found</Text>
                    <Text style={styles.emptySubText}>Try adjusting your search or filter</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id || item.id}
                    renderItem={renderPlace}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    numColumns={1}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.15)',
    },
    backBtn: { padding: 4 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
    headerTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#1E293B',
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchInput: { flex: 1, color: '#F8FAFC', fontSize: 14 },
    categoryList: { marginTop: 14, paddingBottom: 4 },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    categoryChipActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: '#EF4444',
    },
    categoryChipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    categoryChipTextActive: { color: '#EF4444' },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 14,
        marginBottom: 6,
    },
    statsText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    statsBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loaderText: { color: '#64748B', fontSize: 14 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyText: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
    emptySubText: { color: '#64748B', fontSize: 14 },
    listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardImage: { width: '100%', height: 180 },
    cardImageOverlay: {
        ...StyleSheet.absoluteFillObject,
        height: 180,
        background: 'linear-gradient(to bottom, transparent 50%, rgba(30,41,59,0.9) 100%)',
    },
    topBadges: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        gap: 6,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10,
    },
    ratingText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    verifiedText: { color: '#10B981', fontSize: 10, fontWeight: '900' },
    cardContent: { padding: 16 },
    cardName: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
    locationText: { color: '#94A3B8', fontSize: 13 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    categoryTag: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    categoryTagText: { color: '#EF4444', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    distanceText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
});

export default PlacesScreen;
