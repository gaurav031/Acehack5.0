import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Shield } from 'lucide-react-native';
import axios from 'axios';
import API_BASE_URL from '../services/api';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Required', 'Please enter your email and password to continue.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Login successful, proceeding to Main screen. User ID:', response.data.user.id);

            // Using a small delay and navigate instead of replace to ensure stability during transition
            setTimeout(() => {
                navigation.navigate('Main', { touristId: response.data.user.id });
            }, 100);
        } catch (error: any) {
            console.error('Login error detail:', JSON.stringify(error, null, 2));
            const errorMsg = error.response?.data?.message || 'Connection failed. Please check if your backend is running or your adb reverse tunnel is active.';
            Alert.alert('Login Error', errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.inner}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Shield size={48} color="#EF4444" />
                        </View>
                        <Text style={styles.title}>TOURIST SAFETY</Text>
                        <Text style={styles.subtitle}>Your Digital Guardian in Every Journey</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#64748B"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Secure Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#64748B"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotBtn} disabled={isLoading}>
                            <Text style={styles.forgotText}>Forgot Security Key?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginBtn, isLoading && styles.disabledBtn]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loginBtnText}>INITIALIZE PROTECTION</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New traveler?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
                                <Text style={styles.signupText}> Create Secure Identity</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    flex: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: 2,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        color: '#F8FAFC',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotText: {
        color: '#3B82F6',
        fontSize: 14,
    },
    loginBtn: {
        backgroundColor: '#EF4444',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    disabledBtn: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    signupText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default LoginScreen;
