import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Alert,
    Platform,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import {
    Send,
    User,
    Shield,
    CheckSquare,
    Square,
    Volume2,
    VolumeX,
    ChevronRight,
    Map as MapIcon,
    Zap,
    AlertTriangle,
    Mic,
    MicOff,
    X,
} from 'lucide-react-native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import API_BASE_URL, { IP } from '../services/api';

const CHAT_API_URL = `http://${IP}:8000`; // adb reverse tcp:8000 tcp:8000

// ─────────────────────────────────────────────────────────────────
// Web Speech API HTML — runs inside a hidden WebView for mic input
// ─────────────────────────────────────────────────────────────────
const getMicHtml = (lang: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {
    margin: 0; padding: 0;
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    height: 100vh;
  }
</style>
</head>
<body>
<script>
  var recognition;
  var started = false;

  function startRecognition() {
    if (started) return;
    try {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'SpeechRecognition not supported' }));
        return;
      }
      recognition = new SpeechRecognition();
      recognition.lang = '${lang}';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = function() {
        started = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STARTED' }));
      };

      recognition.onresult = function(event) {
        var transcript = '';
        var isFinal = false;
        for (var i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RESULT', text: transcript, isFinal: isFinal }));
      };

      recognition.onerror = function(event) {
        started = false;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: event.error }));
      };

      recognition.onend = function() {
        started = false;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ENDED' }));
      };

      recognition.start();
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
    }
  }

  function stopRecognition() {
    if (recognition && started) {
      recognition.stop();
    }
  }

  // Auto-start when page loads
  window.onload = function() {
    setTimeout(startRecognition, 100);
  };

  window.startRecognition = startRecognition;
  window.stopRecognition = stopRecognition;
</script>
</body>
</html>
`;

const ChatScreen = ({ navigation }: any) => {
    const [step, setStep] = useState(0); // 0-4 for onboarding, 5 for chat
    const [preferences, setPreferences] = useState({
        purpose: [] as string[],
        duration: '',
        budget: '',
        locations: [] as string[],
        style: '',
    });

    const [messages, setMessages] = useState([
        { id: 1, text: "Welcome! I'm Aegis. Let's personalize your India experience.", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const audioEngineRef = useRef<WebView>(null);
    const micWebViewRef = useRef<WebView>(null);
    const [showResumeModal, setShowResumeModal] = useState(false);

    // Mic state
    const [isListening, setIsListening] = useState(false);
    const [showMicOverlay, setShowMicOverlay] = useState(false);
    const [micTranscript, setMicTranscript] = useState('');

    // Waveform animation
    const waveAnims = useRef([...Array(7)].map(() => new Animated.Value(0.3))).current;
    const waveLoopRef = useRef<any>(null);

    const { i18n } = useTranslation();

    // ── Waveform pulse animation ──────────────────────────────────
    const startWave = () => {
        const animations = waveAnims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 60),
                    Animated.timing(anim, { toValue: 1, duration: 350, easing: Easing.sin, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0.2, duration: 350, easing: Easing.sin, useNativeDriver: true }),
                ])
            )
        );
        waveLoopRef.current = Animated.parallel(animations);
        waveLoopRef.current.start();
    };

    const stopWave = () => {
        waveLoopRef.current?.stop();
        waveAnims.forEach(a => a.setValue(0.3));
    };

    useEffect(() => {
        if (isListening) startWave();
        else stopWave();
        return () => stopWave();
    }, [isListening]);

    // ── Open mic overlay ──────────────────────────────────────────
    const openMic = () => {
        setMicTranscript('');
        setShowMicOverlay(true);
        setIsListening(false);
    };

    const closeMicOverlay = () => {
        // Stop recognition in WebView
        micWebViewRef.current?.injectJavaScript('stopRecognition(); true;');
        setShowMicOverlay(false);
        setIsListening(false);
        stopWave();
        if (micTranscript.trim()) {
            setInput(micTranscript.trim());
        }
    };

    const confirmTranscript = () => {
        micWebViewRef.current?.injectJavaScript('stopRecognition(); true;');
        setShowMicOverlay(false);
        setIsListening(false);
        stopWave();
        if (micTranscript.trim()) {
            setInput(micTranscript.trim());
        }
    };

    // ── Handle messages from the mic WebView ──────────────────────
    const handleMicWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'STARTED') {
                setIsListening(true);
            } else if (data.type === 'RESULT') {
                setMicTranscript(data.text);
                if (data.isFinal) {
                    setIsListening(false);
                }
            } else if (data.type === 'ENDED') {
                setIsListening(false);
            } else if (data.type === 'ERROR') {
                console.log('Mic WebView Error:', data.message);
                setIsListening(false);
                if (data.message === 'not-allowed') {
                    Alert.alert('Permission Denied', 'Microphone access was denied. Please allow it in your device settings.');
                }
            }
        } catch (e) {
            console.log('Mic WebView message parse error:', e);
        }
    };

    // ── Session ───────────────────────────────────────────────────
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkExistingSession();
        });
        checkExistingSession();
        return unsubscribe;
    }, [navigation]);

    const checkExistingSession = async () => {
        try {
            const savedChat = await AsyncStorage.getItem('last_chat_messages');
            if (savedChat) {
                const parsed = JSON.parse(savedChat);
                if (parsed && parsed.length > 1) {
                    setShowResumeModal(true);
                }
            }
        } catch (e) {
            console.log("Session Check Error:", e);
        }
    };

    const resumeSession = async () => {
        try {
            const savedChat = await AsyncStorage.getItem('last_chat_messages');
            const savedPrefs = await AsyncStorage.getItem('last_chat_preferences');
            if (savedChat) setMessages(JSON.parse(savedChat));
            if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
            setStep(5);
        } catch (e) {
            console.log("Resume Error:", e);
        } finally {
            setShowResumeModal(false);
        }
    };

    const startNewSession = async () => {
        await AsyncStorage.removeItem('last_chat_messages');
        await AsyncStorage.removeItem('last_chat_preferences');
        setMessages([{ id: 1, text: "Welcome! I'm Aegis. Let's personalize your India experience.", sender: 'ai' }]);
        setStep(0);
        setShowResumeModal(false);
    };

    useEffect(() => {
        if (messages.length > 1) {
            saveSession();
        }
    }, [messages, preferences]);

    const saveSession = async () => {
        try {
            await AsyncStorage.setItem('last_chat_messages', JSON.stringify(messages));
            await AsyncStorage.setItem('last_chat_preferences', JSON.stringify(preferences));
        } catch (e) {
            console.log("Save Session Error:", e);
        }
    };

    const ONBOARDING_QUESTIONS = [
        {
            key: 'purpose',
            question: "What is your purpose of visiting India?",
            options: ["Tourism", "Cultural Exploration", "Religious Visit", "Business", "Adventure"],
            multi: true
        },
        {
            key: 'duration',
            question: "How long is your stay?",
            options: ["1-7 Days", "1-2 Weeks", "1 Month", "6 Months+"],
            multi: false
        },
        {
            key: 'budget',
            question: "What is your travel budget?",
            options: ["Budget (₹)", "Mid-range (₹₹)", "Luxury (₹₹₹)"],
            multi: false
        },
        {
            key: 'locations',
            question: "Preferred locations or interests?",
            options: ["Heritage Sites", "Temples", "Nature", "Nightlife", "Shopping"],
            multi: true
        },
        {
            key: 'style',
            question: "What is your travel style?",
            options: ["Luxury", "Budget Friendly", "Backpacking", "Adventure Centric"],
            multi: false
        }
    ];

    const toggleOption = (option: string) => {
        const q = ONBOARDING_QUESTIONS[step];
        if (q.multi) {
            const current = (preferences as any)[q.key] as string[];
            if (current.includes(option)) {
                setPreferences({ ...preferences, [q.key]: current.filter(o => o !== option) });
            } else {
                setPreferences({ ...preferences, [q.key]: [...current, option] });
            }
        } else {
            setPreferences({ ...preferences, [q.key]: option });
        }
    };

    const nextStep = () => {
        const q = ONBOARDING_QUESTIONS[step];
        const val = (preferences as any)[q.key];
        if (!val || (Array.isArray(val) && val.length === 0)) {
            Alert.alert("Selection Required", "Please select at least one option.");
            return;
        }

        if (step < 4) {
            setStep(step + 1);
        } else {
            setStep(5);
            sendInitialMessage();
        }
    };

    const sendInitialMessage = async () => {
        setIsTyping(true);
        try {
            const res = await axios.post(`${CHAT_API_URL}/chat`, {
                message: "Hello! Based on my preferences, can you suggest an initial route and plan for my visit?",
                preferences: preferences,
                history: []
            });

            if (res.data.text) {
                const cleaned = cleanText(res.data.text);
                setMessages(prev => [...prev, { id: Date.now(), text: cleaned, sender: 'ai', route: res.data.route }]);
                if (cleaned.length < 500) playVoice(cleaned);
            }
        } catch (error) {
            console.log("Chat Error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    const cleanText = (raw: string) => {
        return raw.replace(/\*\*/g, '')
            .replace(/\[\d+\.\d+,\s*\d+\.\d+\]/g, '')
            .replace(/\{"type":.*?\}/g, '')
            .replace(/route:.*?,/g, '')
            .replace(/\{"text":.*?\}/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const history = messages.map(m => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text }));
            const res = await axios.post(`${CHAT_API_URL}/chat`, {
                message: input,
                preferences: preferences,
                history: history
            });

            if (res.data.text) {
                const cleaned = cleanText(res.data.text);
                setMessages(prev => [...prev, { id: Date.now(), text: cleaned, sender: 'ai', route: res.data.route }]);
                if (cleaned.length < 300) playVoice(cleaned);
            }
        } catch (error) {
            console.log("Chat Error:", error);
            setMessages(prev => [...prev, { id: Date.now(), text: "Oh, I'm sorry! I'm having a little trouble connecting right now. Could you try again in a moment?", sender: 'ai' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const stopVoice = () => {
        audioEngineRef.current?.injectJavaScript(`
            if (window.audioPlayer) { 
                window.audioPlayer.pause(); 
                window.audioPlayer.src = "";
            }
        `);
        setIsPlaying(false);
    };

    const playVoice = async (text: string) => {
        try {
            console.log("Aegis is speaking...");
            if (isPlaying) {
                stopVoice();
                await new Promise<void>(resolve => setTimeout(resolve, 100));
            }

            setIsPlaying(true);
            const res = await axios.post(`${CHAT_API_URL}/tts`, { text });
            if (res.data.success && res.data.audio) {
                audioEngineRef.current?.injectJavaScript(`
                    (function() {
                        if (window.audioPlayer) { 
                            window.audioPlayer.pause(); 
                            window.audioPlayer.src = "";
                        }
                        window.audioPlayer = new Audio("data:audio/mpeg;base64,${res.data.audio}");
                        window.audioPlayer.onended = () => { window.ReactNativeWebView.postMessage("audio_ended"); };
                        window.audioPlayer.onerror = (e) => { 
                            console.error("Audio error:", e);
                            window.ReactNativeWebView.postMessage("audio_ended"); 
                        };
                        var playPromise = window.audioPlayer.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.error("Auto-play blocked:", error);
                                window.ReactNativeWebView.postMessage("audio_ended");
                            });
                        }
                    })();
                `);
            } else {
                setIsPlaying(false);
            }
        } catch (e) {
            console.log("Voice Error:", e);
            Alert.alert("Voice Error", "Could not play response. please check connection.");
            setIsPlaying(false);
        }
    };

    const showOnMap = (route: any, msgText: string) => {
        const cities = msgText.match(/[A-Z][a-z]+/g) || [];
        const destination = cities.length > 0 ? cities[cities.length - 1] : '';
        navigation.navigate('Main', {
            suggestedRoute: route,
            destinationName: destination
        });
    };

    // ── Main Render ───────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {/* Hidden Audio Engine */}
            <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
                <WebView
                    ref={audioEngineRef}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mediaPlaybackRequiresUserAction={false}
                    source={{ html: '<html><body style="background:transparent;"></body></html>' }}
                    onMessage={(event) => {
                        if (event.nativeEvent.data === 'audio_ended') {
                            setIsPlaying(false);
                        }
                    }}
                />
            </View>

            {step <= 4 ? (
                /* ONBOARDING VIEW */
                <View style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <Shield color="#EF4444" size={24} />
                        <Text style={styles.headerTitle}>AEGIS ONBOARDING</Text>
                    </View>
                    <View style={styles.onboardContent}>
                        <View style={styles.stepIndicator}>
                            {ONBOARDING_QUESTIONS.map((_, i) => (
                                <View key={i} style={[styles.dot, i <= step && styles.activeDot]} />
                            ))}
                        </View>
                        <Text style={styles.questionText}>{ONBOARDING_QUESTIONS[step].question}</Text>
                        <ScrollView style={styles.optionsList}>
                            {ONBOARDING_QUESTIONS[step].options.map(opt => {
                                const isSelected = ONBOARDING_QUESTIONS[step].multi
                                    ? (preferences as any)[ONBOARDING_QUESTIONS[step].key].includes(opt)
                                    : (preferences as any)[ONBOARDING_QUESTIONS[step].key] === opt;
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.optionCard, isSelected && styles.selectedOption]}
                                        onPress={() => toggleOption(opt)}
                                    >
                                        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>{opt}</Text>
                                        {isSelected ? <CheckSquare color="#EF4444" size={20} /> : <Square color="#64748B" size={20} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                            <Text style={styles.nextBtnText}>{step === 4 ? "COMPLETE" : "NEXT"}</Text>
                            <ChevronRight color="#FFF" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                /* CHATBOT VIEW */
                <View style={{ flex: 1 }}>
                    <View style={[styles.header, { justifyContent: 'space-between' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Shield color="#EF4444" size={24} />
                            <View>
                                <Text style={styles.headerTitle}>AEGIS AI TRAVEL ASSISTANT</Text>
                                <Text style={styles.statusSub}>We provide you the best travel experience</Text>
                            </View>
                        </View>
                        {isPlaying && (
                            <TouchableOpacity style={styles.muteBtn} onPress={stopVoice}>
                                <VolumeX color="#EF4444" size={20} />
                                <Text style={styles.muteText}>MUTE</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
                    >
                        <ScrollView
                            ref={scrollViewRef}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            contentContainerStyle={styles.chatArea}
                        >
                            {messages.map((msg) => {
                                let displayContent = msg.text.replace(/\*\*/g, '').trim();

                                displayContent = displayContent
                                    .replace(/\[\d+\.\d+,\s*\d+\.\d+\]/g, '')
                                    .replace(/\{"type":.*?\}/g, '')
                                    .replace(/route:.*?,/g, '')
                                    .replace(/\s+/g, ' ')
                                    .trim();

                                const isEmergency = displayContent.toLowerCase().includes('help') ||
                                    displayContent.toLowerCase().includes('emergency') ||
                                    displayContent.toLowerCase().includes('112');

                                const stops = displayContent.includes('→') ? displayContent.split('→').map(s => s.trim()) : null;

                                if (displayContent.startsWith('{') && displayContent.includes('"text":')) {
                                    try {
                                        const parsed = JSON.parse(displayContent);
                                        displayContent = parsed.text || "I've created a great plan for you!";
                                    } catch (e) {
                                        displayContent = displayContent.replace(/\{"text":\s*"/, '').split('"')[0];
                                    }
                                }

                                return (
                                    <View key={msg.id} style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble, isEmergency && msg.sender === 'ai' && styles.emergencyBubble]}>
                                        {stops && msg.sender === 'ai' ? (
                                            <View style={styles.roadMapContainer}>
                                                <View style={styles.roadLine} />
                                                {stops.map((stop, i) => (
                                                    <View key={i} style={styles.stopRow}>
                                                        <View style={styles.stopDot} />
                                                        <Text style={styles.stopText}>{stop}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <Text style={[msg.sender === 'user' ? styles.userText : styles.aiText, isEmergency && msg.sender === 'ai' && { color: '#FFF' }]}>
                                                {displayContent}
                                            </Text>
                                        )}

                                        {isEmergency && msg.sender === 'ai' && (
                                            <TouchableOpacity
                                                style={styles.sosInlineBtn}
                                                onPress={() => Linking.openURL('tel:112')}
                                            >
                                                <AlertTriangle color="#FFF" size={14} />
                                                <Text style={styles.sosInlineText}>DIAL 112</Text>
                                            </TouchableOpacity>
                                        )}

                                        {msg.sender === 'ai' && (
                                            <View style={styles.aiActions}>
                                                <TouchableOpacity
                                                    style={styles.actionBtn}
                                                    onPress={() => playVoice(msg.text)}
                                                    disabled={isPlaying}
                                                >
                                                    <Volume2 size={16} color={isPlaying ? "#64748B" : "#EF4444"} />
                                                    <Text style={[styles.actionBtnText, isPlaying && { color: "#64748B" }]}>Listen</Text>
                                                </TouchableOpacity>

                                                {(msg as any).route && (
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, { borderColor: '#10B981' }]}
                                                        onPress={() => showOnMap((msg as any).route, msg.text)}
                                                    >
                                                        <MapIcon size={16} color="#10B981" />
                                                        <Text style={[styles.actionBtnText, { color: '#10B981' }]}>View on Map</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                            {isTyping && (
                                <View style={styles.typingIndicator}>
                                    <ActivityIndicator size="small" color="#EF4444" />
                                    <Text style={styles.typingText}>Aegis is planning your route...</Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.inputArea}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ask about trips, routes, or safety..."
                                placeholderTextColor="#64748B"
                                value={input}
                                onChangeText={setInput}
                                editable={!isTyping}
                            />
                            <TouchableOpacity
                                style={styles.micBtn}
                                onPress={openMic}
                            >
                                <Mic color="#EF4444" size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.disabledBtn]} onPress={handleSend}>
                                <Send color="#FFF" size={20} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            )}

            {/* ── Mic Recording Modal ─────────────────────────────────── */}
            <Modal
                transparent
                visible={showMicOverlay}
                animationType="slide"
                onRequestClose={closeMicOverlay}
            >
                <View style={styles.micModalOverlay}>
                    <View style={styles.micModalCard}>
                        {/* Header */}
                        <View style={styles.micModalHeader}>
                            <Mic color="#EF4444" size={20} />
                            <Text style={styles.micModalTitle}>VOICE INPUT</Text>
                            <TouchableOpacity onPress={closeMicOverlay} style={styles.micCloseBtn}>
                                <X color="#94A3B8" size={20} />
                            </TouchableOpacity>
                        </View>

                        {/* Status */}
                        <Text style={styles.micStatusText}>
                            {isListening ? '🔴  Listening...' : micTranscript ? '✅  Done! Review below.' : '⏳  Starting microphone...'}
                        </Text>

                        {/* Waveform visualizer */}
                        <View style={styles.waveformArea}>
                            {/* Center line */}
                            <View style={styles.waveBaseLine} />
                            {/* Animated bars */}
                            {waveAnims.map((anim, i) => (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.waveBar,
                                        {
                                            transform: [{ scaleY: anim }],
                                            backgroundColor: isListening
                                                ? (i % 2 === 0 ? '#EF4444' : '#F87171')
                                                : '#334155',
                                        }
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Transcript preview */}
                        <View style={styles.transcriptBox}>
                            <Text style={styles.transcriptText} numberOfLines={4}>
                                {micTranscript || 'Your words will appear here...'}
                            </Text>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.micActions}>
                            <TouchableOpacity style={styles.micCancelBtn} onPress={closeMicOverlay}>
                                <Text style={styles.micCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.micConfirmBtn, !micTranscript && styles.micConfirmDisabled]}
                                onPress={confirmTranscript}
                                disabled={!micTranscript}
                            >
                                <Text style={styles.micConfirmText}>Use This</Text>
                                <ChevronRight color="#FFF" size={18} />
                            </TouchableOpacity>
                        </View>

                        {/* Hidden WebView for speech recognition */}
                        <View style={{ height: 1, width: 1, overflow: 'hidden' }}>
                            <WebView
                                ref={micWebViewRef}
                                originWhitelist={['*']}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                mediaPlaybackRequiresUserAction={false}
                                allowsInlineMediaPlayback={true}
                                source={{ html: getMicHtml(i18n.language || 'en-US') }}
                                onMessage={handleMicWebViewMessage}
                                onError={(e) => console.log('Mic WebView error:', e.nativeEvent)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Resume Session Modal */}
            <Modal
                transparent
                visible={showResumeModal}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Zap size={40} color="#EF4444" style={{ marginBottom: 20 }} />
                        <Text style={styles.modalTitle}>Resume Trip Planning?</Text>
                        <Text style={styles.modalSub}>We found your previous conversation. Would you like to continue or start over?</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnPrimary]}
                                onPress={resumeSession}
                            >
                                <Text style={styles.modalBtnTextPrimary}>Continue Previous</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnSecondary]}
                                onPress={startNewSession}
                            >
                                <Text style={styles.modalBtnTextSecondary}>Start New Chat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#1E293B', gap: 12 },
    headerTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    statusSub: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },

    muteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EF4444' },
    muteText: { color: '#EF4444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    roadMapContainer: { marginVertical: 10, paddingLeft: 10 },
    roadLine: { position: 'absolute', left: 4, top: 10, bottom: 10, width: 2, backgroundColor: '#EF4444', opacity: 0.3 },
    stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 15 },
    stopDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#0F172A', zIndex: 2 },
    stopText: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold' },

    onboardContent: { flex: 1, padding: 30, justifyContent: 'center' },
    stepIndicator: { flexDirection: 'row', gap: 8, marginBottom: 30, alignSelf: 'center' },
    dot: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#334155' },
    activeDot: { backgroundColor: '#EF4444' },
    questionText: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', marginBottom: 30 },
    optionsList: { marginBottom: 30 },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155'
    },
    selectedOption: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
    optionText: { color: '#94A3B8', fontSize: 16, fontWeight: 'bold' },
    selectedOptionText: { color: '#F8FAFC' },
    nextBtn: { backgroundColor: '#EF4444', flexDirection: 'row', padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 10 },
    nextBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },

    chatArea: { flexGrow: 1, padding: 20, paddingBottom: 40 },
    messageBubble: { padding: 16, borderRadius: 20, marginBottom: 16, maxWidth: '85%' },
    aiBubble: { backgroundColor: '#1E293B', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    userBubble: { backgroundColor: '#EF4444', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    aiText: { color: '#F8FAFC', fontSize: 15, lineHeight: 22 },
    userText: { color: '#FFF', fontSize: 15, lineHeight: 22 },

    mapAction: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    mapActionText: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },

    aiActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
    actionBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    emergencyBubble: { backgroundColor: 'transparent', borderColor: '#EF4444', borderWidth: 2 },
    sosInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
    sosInlineText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 10, marginBottom: 20 },
    typingText: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },

    inputArea: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 10,
        gap: 12,
        backgroundColor: '#1E293B',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        backgroundColor: '#0F172A',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        color: '#F8FAFC',
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sendBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    disabledBtn: { backgroundColor: '#334155', elevation: 0 },
    micBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#EF4444',
    },
    errorContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 40 },

    // ── Mic Modal ────────────────────────────────────────────────
    micModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    micModalCard: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 30,
    },
    micModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    micModalTitle: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    micCloseBtn: {
        padding: 4,
    },
    micStatusText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 24,
        textAlign: 'center',
    },

    // Waveform
    waveformArea: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        marginBottom: 24,
        position: 'relative',
    },
    waveBaseLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    waveBar: {
        width: 5,
        height: 60,
        borderRadius: 4,
    },

    // Transcript box
    transcriptBox: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        minHeight: 80,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    transcriptText: {
        color: '#F8FAFC',
        fontSize: 16,
        lineHeight: 24,
        fontStyle: 'italic',
    },

    // Mic action buttons
    micActions: {
        flexDirection: 'row',
        gap: 12,
    },
    micCancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    micCancelText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: 'bold',
    },
    micConfirmBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        gap: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    micConfirmDisabled: {
        backgroundColor: '#334155',
        shadowOpacity: 0,
        elevation: 0,
    },
    micConfirmText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '900',
    },

    // Resume Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderRadius: 30,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        elevation: 20,
    },
    modalTitle: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalSub: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    modalBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnPrimary: {
        backgroundColor: '#EF4444',
    },
    modalBtnSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalBtnTextPrimary: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 16,
    },
    modalBtnTextSecondary: {
        color: '#94A3B8',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default ChatScreen;
