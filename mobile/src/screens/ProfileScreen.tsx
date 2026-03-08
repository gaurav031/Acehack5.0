import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Shield, User, Mail, Phone, Globe, Camera, ChevronLeft, Save, LogOut, Search, FileText, Calendar, CheckCircle2, Fingerprint, RefreshCcw } from 'lucide-react-native';
import axios from 'axios';
import API_BASE_URL from '../services/api';

const ProfileScreen = ({ route, navigation }: any) => {
    const { t, i18n } = useTranslation();
    const { touristId } = route.params || { touristId: 'demo_user' };

    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('john.doe@example.com');
    const [phone, setPhone] = useState('+91 98765 43210');
    const [nationality, setNationality] = useState('United States');
    const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [identityStatus, setIdentityStatus] = useState<any>(null);
    const [isLoadingIdentity, setIsLoadingIdentity] = useState(false);

    // Avatar Presets
    const avatars = [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/profile/${touristId}`);
                if (response.data.success) {
                    const { name, email, phone, nationality, profileImage, visaNumber: savedVisa } = response.data.data;
                    setName(name || '');
                    setEmail(email || '');
                    setPhone(phone || '');
                    setNationality(nationality || '');
                    if (profileImage) setProfileImage(profileImage);
                    if (savedVisa) {
                        setVisaNumber(savedVisa);
                        // Auto-verify if already saved to show details
                        autoVerifyVisa(savedVisa);
                    }
                }
            } catch (error) {
                console.log('Error fetching profile:', error);
            }
        };

        const fetchIdentity = async () => {
            setIsLoadingIdentity(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/identity/status/${touristId}`);
                setIdentityStatus(response.data);
            } catch (error) {
                console.log('Error fetching identity status:', error);
            } finally {
                setIsLoadingIdentity(false);
            }
        };

        fetchProfile();
        fetchIdentity();
    }, [touristId]);

    const autoVerifyVisa = async (num: string) => {
        setIsLoadingVisa(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/visa/${num}`);
            if (response.data.success) {
                setVisaData(response.data.data);
            }
        } catch (error) {
            console.log('Auto-verify error:', error);
        } finally {
            setIsLoadingVisa(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/profile/${touristId}`, {
                name,
                email,
                phone,
                nationality,
                profileImage
            });
            if (response.data.success) {
                setIsEditing(false);
                Alert.alert('Security Update', 'Your profile information has been securely updated and encrypted.');
            }
        } catch (error: any) {
            Alert.alert('Update Failed', error.response?.data?.message || 'Could not update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const [visaNumber, setVisaNumber] = useState('');
    const [visaData, setVisaData] = useState<any>(null);
    const [isLoadingVisa, setIsLoadingVisa] = useState(false);

    const [hasSavedVisa, setHasSavedVisa] = useState(false);

    // Update hasSavedVisa when visaNumber changes from fetch
    useEffect(() => {
        const checkSavedVisa = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/profile/${touristId}`);
                if (res.data.data?.visaNumber) {
                    setHasSavedVisa(true);
                }
            } catch (e) { }
        };
        checkSavedVisa();
    }, [touristId]);

    const handleVisaVerify = async () => {
        if (!visaNumber) {
            Alert.alert('Required', 'Please enter your Visa Number to verify.');
            return;
        }
        setIsLoadingVisa(true);
        setVisaData(null);
        try {
            // 1. Verify with Govt Database
            const response = await axios.get(`${API_BASE_URL}/visa/${visaNumber}`);
            if (response.data.success) {
                const verifiedData = response.data.data;
                setVisaData(verifiedData);

                // 2. Save to User Profile Permanently
                await axios.put(`${API_BASE_URL}/profile/${touristId}`, {
                    visaNumber: visaNumber
                });

                setHasSavedVisa(true);
                Alert.alert('Visa Linked', 'Your visa has been verified and permanently linked to your secure identity.');
            }
        } catch (error: any) {
            console.log('Visa error:', error);
            Alert.alert('Verification Failed', 'Visa verification failed. Please check the number or your connection.');
        } finally {
            setIsLoadingVisa(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to end your secure session?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color="#F8FAFC" size={28} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('secure_profile')}</Text>

                    <View style={{ width: 40 }} />
                </View>

                {/* Avatar Picker Modal */}
                <Modal visible={showAvatarPicker} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Choose Identity Avatar</Text>
                            <View style={styles.avatarGrid}>
                                {avatars.map((url, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => {
                                            setProfileImage(url);
                                            setShowAvatarPicker(false);
                                        }}
                                    >
                                        <Image source={{ uri: url }} style={styles.avatarChoice} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAvatarPicker(false)}>
                                <Text style={styles.closeBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Profile Image Section */}
                    <View style={styles.imageSection}>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: profileImage }}
                                style={styles.profileImage}
                            />
                            <TouchableOpacity
                                style={styles.cameraBtn}
                                onPress={() => {
                                    setIsEditing(true);
                                    setShowAvatarPicker(true);
                                }}
                            >
                                <Camera size={20} color="#F8FAFC" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{name}</Text>
                        {isEditing ? (
                            <View style={[styles.verifiedBadge, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <RefreshCcw size={12} color="#EF4444" />
                                <Text style={[styles.verifiedText, { color: '#EF4444' }]}>EDITING MODE ACTIVE</Text>
                            </View>
                        ) : (
                            <View style={styles.verifiedBadge}>
                                <Shield size={14} color="#10B981" fill="#10B981" />
                                <Text style={styles.verifiedText}>{t('govt_verified')}</Text>

                            </View>
                        )}
                    </View>

                    {/* Stats Section */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>{t('trips')}</Text>

                        </View>
                        <View style={[styles.statItem, styles.statBorder]}>
                            <Text style={styles.statValue}>5/5</Text>
                            <Text style={styles.statLabel}>{t('safety_score')}</Text>

                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{t('active')}</Text>

                            <Text style={styles.statLabel}>{t('protection')}</Text>

                        </View>
                    </View>

                    {/* Language Selection Section - Moved Higher for Visibility */}
                    <View style={styles.languageSection}>
                        <View style={styles.sectionHeader}>
                            <Globe size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>{t('change_language')}</Text>
                        </View>
                        <View style={styles.languageGrid}>
                            {[
                                { code: 'en', label: 'English' },
                                { code: 'fr', label: 'Français' },
                                { code: 'es', label: 'Español' },
                                { code: 'zh', label: '中文' },
                                { code: 'ur', label: 'اردو' },
                            ].map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.langBtn,
                                        i18n.language.startsWith(lang.code) && styles.activeLangBtn
                                    ]}
                                    onPress={() => i18n.changeLanguage(lang.code)}
                                >
                                    <Text style={[
                                        styles.langBtnText,
                                        i18n.language.startsWith(lang.code) && styles.activeLangBtnText
                                    ]}>
                                        {lang.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>


                    {/* Crypto Identity Button */}
                    <TouchableOpacity
                        style={[styles.identityBanner, identityStatus?.did && { borderColor: '#10B981' }]}
                        onPress={() => navigation.navigate('Identity', { touristId })}
                    >
                        <View style={styles.identityBannerLeft}>
                            <View style={[styles.fingerprintCircle, identityStatus?.did && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Fingerprint color={identityStatus?.did ? "#10B981" : "#EF4444"} size={24} />
                            </View>
                            <View>
                                <Text style={styles.identityTitle}>
                                    {identityStatus?.did ? 'Identity Synced' : 'Crypto Identity Dashboard'}
                                </Text>
                                <Text style={styles.identitySubtitle}>
                                    {identityStatus?.did
                                        ? `DID: ${identityStatus.did.substring(0, 15)}...`
                                        : 'Blockchain DID & Temporary Travel IDs'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            {isLoadingIdentity && <ActivityIndicator size="small" color="#EF4444" />}
                            <ChevronLeft color="#94A3B8" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                        </View>
                    </TouchableOpacity>

                    {/* Form Section */}

                    <View style={styles.formSection}>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <User size={18} color="#EF4444" />
                                <Text style={styles.label}>{t('full_name') || 'Full Name'}</Text>

                            </View>
                            <TextInput
                                style={[styles.input, !isEditing && styles.disabledInput]}
                                value={name}
                                onChangeText={setName}
                                editable={isEditing}
                                placeholderTextColor="#64748B"
                                onTouchStart={() => !isEditing && setIsEditing(true)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Mail size={18} color="#EF4444" />
                                <Text style={styles.label}>{t('email_address') || 'Email Address'}</Text>

                            </View>
                            <TextInput
                                style={[styles.input, !isEditing && styles.disabledInput]}
                                value={email}
                                onChangeText={setEmail}
                                editable={isEditing}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#64748B"
                                onTouchStart={() => !isEditing && setIsEditing(true)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Phone size={18} color="#EF4444" />
                                <Text style={styles.label}>{t('phone_number') || 'Phone Number'}</Text>

                            </View>
                            <TextInput
                                style={[styles.input, !isEditing && styles.disabledInput]}
                                value={phone}
                                onChangeText={setPhone}
                                editable={isEditing}
                                keyboardType="phone-pad"
                                placeholderTextColor="#64748B"
                                onTouchStart={() => !isEditing && setIsEditing(true)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Globe size={18} color="#EF4444" />
                                <Text style={styles.label}>{t('nationality')}</Text>

                            </View>
                            <TextInput
                                style={[styles.input, !isEditing && styles.disabledInput]}
                                value={nationality}
                                onChangeText={setNationality}
                                editable={isEditing}
                                placeholderTextColor="#64748B"
                                onTouchStart={() => !isEditing && setIsEditing(true)}
                            />
                        </View>
                    </View>

                    {/* Visa Verification Section */}
                    <View style={styles.visaSection}>
                        <View style={styles.sectionHeader}>
                            <FileText size={20} color="#EF4444" />
                            <Text style={styles.sectionTitle}>{t('visa_verification')}</Text>

                        </View>

                        <View style={styles.visaInputRow}>
                            <TextInput
                                style={[styles.visaInput, hasSavedVisa && styles.disabledInput]}
                                placeholder="Enter Visa Number (e.g. IND12345678)"
                                placeholderTextColor="#64748B"
                                value={visaNumber}
                                onChangeText={setVisaNumber}
                                autoCapitalize="characters"
                                editable={!hasSavedVisa}
                            />
                            <TouchableOpacity
                                style={[styles.visaBtn, hasSavedVisa && { backgroundColor: '#334155' }]}
                                onPress={handleVisaVerify}
                                disabled={isLoadingVisa || hasSavedVisa}
                            >
                                {isLoadingVisa ? (
                                    <ActivityIndicator size="small" color="#F8FAFC" />
                                ) : (
                                    hasSavedVisa ? <CheckCircle2 size={20} color="#10B981" /> : <Search size={20} color="#F8FAFC" />
                                )}
                            </TouchableOpacity>
                        </View>

                        {visaData && (
                            <View style={styles.visaCard}>
                                <View style={styles.visaCardHeader}>
                                    <View>
                                        <Text style={styles.visaType}>{visaData.visaType}</Text>
                                        <Text style={styles.visaId}>{visaData.visaNumber}</Text>
                                    </View>
                                    <View style={styles.activeBadge}>
                                        <CheckCircle2 size={12} color="#10B981" />
                                        <Text style={styles.activeText}>ACTIVE</Text>
                                    </View>
                                </View>

                                <View style={styles.visaGrid}>
                                    <View style={styles.visaGridItem}>
                                        <Text style={styles.visaLabel}>Passport</Text>
                                        <Text style={styles.visaValue}>{visaData.passportNumber}</Text>
                                    </View>
                                    <View style={styles.visaGridItem}>
                                        <Text style={styles.visaLabel}>Entry</Text>
                                        <Text style={styles.visaValue}>{visaData.entryType}</Text>
                                    </View>
                                    <View style={styles.visaGridItem}>
                                        <Calendar size={14} color="#94A3B8" />
                                        <Text style={styles.visaLabel}>Expires</Text>
                                        <Text style={[styles.visaValue, { color: '#EF4444' }]}>{visaData.expiryDate}</Text>
                                    </View>
                                </View>

                                <View style={styles.govtFooter}>
                                    <Shield size={12} color="#94A3B8" />
                                    <Text style={styles.govtFooterText}>Verified by Bureau of Immigration, India</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actionSection}>
                        {isEditing ? (
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#F8FAFC" />
                                ) : (
                                    <>
                                        <Save size={20} color="#F8FAFC" />
                                        <Text style={styles.saveBtnText}>{t('save_securely')}</Text>

                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                                <Text style={styles.editBtnText}>Edit Identity Information</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <LogOut size={20} color="#EF4444" />
                            <Text style={styles.logoutBtnText}>{t('logout')}</Text>

                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        alignItems: 'center',
        marginTop: 30,
    },
    imageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#EF4444',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#EF4444',
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#0F172A',
    },
    userName: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    verifiedText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        marginHorizontal: 20,
        marginTop: 30,
        borderRadius: 20,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#334155',
    },
    statValue: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 4,
    },
    // Identity Banner Styles
    identityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E293B',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    identityBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    fingerprintCircle: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 10,
        borderRadius: 15,
    },
    identityTitle: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: 'bold',
    },
    identitySubtitle: {
        color: '#94A3B8',
        fontSize: 11,
        marginTop: 2,
    },
    formSection: {
        paddingHorizontal: 20,
        marginTop: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    label: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        color: '#F8FAFC',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    disabledInput: {
        opacity: 0.7,
        borderColor: 'transparent',
    },
    actionSection: {
        paddingHorizontal: 20,
        marginTop: 20,
        gap: 15,
    },
    editBtn: {
        backgroundColor: '#EF4444',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    editBtnText: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '900',
    },
    saveBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    saveBtnText: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '900',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        width: '85%',
        borderRadius: 25,
        padding: 25,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
    },
    avatarChoice: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#334155',
    },
    closeBtn: {
        marginTop: 25,
        backgroundColor: '#334155',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#F8FAFC',
        fontWeight: 'bold',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 15,
    },
    logoutBtnText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Visa Section Styles
    visaSection: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    visaInputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    visaInput: {
        flex: 1,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        color: '#F8FAFC',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    visaBtn: {
        backgroundColor: '#EF4444',
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visaCard: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        marginTop: 15,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    visaCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderColor: '#334155',
        paddingBottom: 15,
        marginBottom: 15,
    },
    visaType: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    visaId: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 5,
    },
    activeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '900',
    },
    visaGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    visaGridItem: {
        flex: 1,
    },
    visaLabel: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    visaValue: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
    },
    govtFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 6,
    },
    govtFooterText: {
        color: '#64748B',
        fontSize: 10,
        fontStyle: 'italic',
    },
    languageSection: {
        marginTop: 25,
        marginHorizontal: 20,
        padding: 20,
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    languageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    langBtn: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        minWidth: '30%',
        alignItems: 'center',
    },
    activeLangBtn: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    langBtnText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    activeLangBtnText: {
        color: '#EF4444',
    },
});


export default ProfileScreen;
