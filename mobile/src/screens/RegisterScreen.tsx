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
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Shield, User, Mail, Lock } from 'lucide-react-native';
import axios from 'axios';

import API_BASE_URL from '../services/api';

const RegisterScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Incomplete Form', 'Please fill in all fields to create your secure identity.');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Attempting to register:', { name, email });
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                name,
                email,
                password
            });

            console.log('Registration successful:', response.data);
            Alert.alert(
                'Identity Created',
                'Your secure digital identity has been initialized successfully.',
                [{
                    text: 'Proceed',
                    onPress: () => {
                        setTimeout(() => {
                            navigation.navigate('Main', { touristId: response.data.user.id });
                        }, 100);
                    }
                }]
            );
        } catch (error: any) {
            console.error('Registration error:', error);
            const errorMsg = error.response?.data?.message || 'Could not connect to the security server. Please check your internet connection.';
            Alert.alert('Registration Failed', errorMsg);
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
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Shield size={40} color="#EF4444" />
                        </View>
                        <Text style={styles.title}>CREATE ACCOUNT</Text>
                        <Text style={styles.subtitle}>Secure your digital identity before you travel</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#64748B" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#64748B"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Mail size={20} color="#64748B" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="john@example.com"
                                    placeholderTextColor="#64748B"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Lock size={20} color="#64748B" style={styles.icon} />
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
                        </View>

                        <TouchableOpacity
                            style={[styles.registerBtn, isLoading && styles.disabledBtn]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.registerBtnText}>CREATE SECURE ID</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already protected?</Text>
                            <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
                                <Text style={styles.signupText}> Sign In</Text>
                            </TouchableOpacity>
                        </View>
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
    flex: {
        flex: 1,
    },
    scroll: {
        padding: 30,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        paddingHorizontal: 20,
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
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        paddingHorizontal: 16,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        padding: 16,
        color: '#F8FAFC',
        fontSize: 16,
    },
    registerBtn: {
        backgroundColor: '#EF4444',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
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
    registerBtnText: {
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

export default RegisterScreen;
