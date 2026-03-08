import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ScrollView,
    Image,
    Dimensions,
    Linking,
    ActivityIndicator,
    Platform,
    Alert,
    Modal,
    Animated,
    Easing,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import {
    Shield,
    AlertTriangle,
    MessageSquare,
    MapPin,
    Star,
    Landmark,
    Building2,
    User,
    Headset,
    ChevronRight,
    ArrowRight,
    Fingerprint,
    FileText,
    Globe,
    Calendar,
    CheckCircle2,
    Maximize,
    Minimize,
    Search,
    Navigation,
    Box,
    Camera,
    ScanLine,
    Phone,
    Languages,
    X,
    Mic,
    MicOff,
} from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import API_BASE_URL, { IP } from '../services/api';
import socketService from '../services/socketService';

const SCANNER_API_URL = `http://${IP}:8000`; // Works with 'adb reverse tcp:8000 tcp:8000'

const { width } = Dimensions.get('window');

const MapScreen = ({ route, navigation }: any) => {
    const { t } = useTranslation();
    const { touristId, suggestedRoute } = route.params || { touristId: 'demo_user' };

    const [heritagePlaces, setHeritagePlaces] = useState<any[]>([]);
    const [verifiedHotels, setVerifiedHotels] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);

    const [loadingPlaces, setLoadingPlaces] = useState(true);
    const [loadingHotels, setLoadingHotels] = useState(true);

    const [identityData, setIdentityData] = useState<any>(null);
    const [visaData, setVisaData] = useState<any>(null);

    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [safeRoute, setSafeRoute] = useState<any[] | null>(null);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [isSatellite, setIsSatellite] = useState(true);
    const [is3DMode, setIs3DMode] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string, safetyScore: number } | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<{ latitude: number, longitude: number } | null>(null);

    // ── Translator state ─────────────────────────────────────────
    const [showTranslator, setShowTranslator] = useState(false);
    const [transListening, setTransListening] = useState(false);
    const [transTranscript, setTransTranscript] = useState('');
    const [transDetectedLang, setTransDetectedLang] = useState('');
    const [transEnglishText, setTransEnglishText] = useState('');
    const [transLoading, setTransLoading] = useState(false);
    const [transIsSpeaking, setTransIsSpeaking] = useState(false);
    const transWebViewRef = useRef<any>(null);
    const transAudioWebViewRef = useRef<any>(null);
    const transWaveAnims = useRef([...Array(9)].map(() => new Animated.Value(0.2))).current;
    const transWaveLoopRef = useRef<any>(null);

    const mapRef = React.useRef<WebView>(null);

    useEffect(() => {
        setupTracking();
        fetchPlaces();
        fetchHotels();
        fetchZones();
        fetchIdentityAndVisa();

        return () => {
            socketService.disconnect();
        };
    }, []);

    useEffect(() => {
        if (suggestedRoute) {
            setSafeRoute(suggestedRoute);
            setIsMapExpanded(true);
        }
    }, [suggestedRoute]);

    useEffect(() => {
        const { destinationName } = route.params || {};
        if (destinationName && destinationName !== searchQuery) {
            setSearchQuery(destinationName);
            setIsMapExpanded(true);
        }
    }, [route.params?.destinationName]);

    // Internal auto-search when destination changes and location is ready
    useEffect(() => {
        if (searchQuery && userLocation && !safeRoute) {
            handleSearch();
        }
    }, [userLocation, searchQuery]);

    const pushStateToMap = () => {
        if (mapRef.current) {
            const script = `
                if (typeof setZones === 'function') setZones(${JSON.stringify(zones)});
                if (typeof setMarkers === 'function') {
                    setMarkers(${JSON.stringify(heritagePlaces)}, 'place');
                    setMarkers(${JSON.stringify(verifiedHotels)}, 'hotel');
                }
                if (typeof toggleLayer === 'function') toggleLayer(${isSatellite});
                ${userLocation ? `if (typeof updateUserLocation === 'function') updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});` : ''}
                ${safeRoute ? `if (typeof setRoute === 'function') setRoute(${JSON.stringify(safeRoute)});` : ''}
            `;
            mapRef.current.injectJavaScript(script);
        }
    };

    useEffect(() => {
        pushStateToMap();
    }, [isSatellite, zones, heritagePlaces, verifiedHotels, userLocation]);

    useEffect(() => {
        if (safeRoute) {
            pushStateToMap();
        }
    }, [safeRoute]);

    useEffect(() => {
        if (userLocation && destinationCoords && routeInfo) {
            // Calculate distance in KM using Haversine formula
            const toRad = (n: number) => (n * Math.PI) / 180;
            const R = 6371; // Earth radius in km
            const dLat = toRad(destinationCoords.latitude - userLocation.latitude);
            const dLon = toRad(destinationCoords.longitude - userLocation.longitude);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(userLocation.latitude)) * Math.cos(toRad(destinationCoords.latitude)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = (R * c).toFixed(1);

            setRouteInfo(prev => prev ? { ...prev, distance } : null);
        }
    }, [userLocation, destinationCoords]);

    const setupTracking = async () => {
        const granted = await socketService.requestLocationPermission();
        if (granted) {
            socketService.connect();
            socketService.startTracking(touristId);

            // Get initial location for Leaflet
            Geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation(position.coords);
                },
                (error) => console.log('Location Error:', error),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );

            // Watch for updates
            Geolocation.watchPosition(
                (position) => {
                    setUserLocation(position.coords);
                    updateMap(position.coords);
                },
                (error) => console.log('Watch Error:', error),
                { enableHighAccuracy: true, distanceFilter: 10 }
            );
        }
    };

    const updateMap = (coords: any) => {
        if (mapRef.current) {
            const script = `
                if (typeof updateUserLocation === 'function') {
                    updateUserLocation(${coords.latitude}, ${coords.longitude}, ${coords.heading || 0});
                }
            `;
            mapRef.current.injectJavaScript(script);
        }
    };

    const getLeafletHtml = () => {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
            <script src='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js'></script>
            <script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>
            <style>
                body { margin: 0; padding: 0; overflow: hidden; background: #0F172A; }
                #map { height: 100vh; width: 100vw; background: #0F172A; }
                .maplibregl-canvas { outline: none; }
                .user-arrow {
                    width: 0;
                    height: 0;
                    border-left: 12px solid transparent;
                    border-right: 12px solid transparent;
                    border-bottom: 30px solid #3B82F6;
                    filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.9));
                    transition: transform 0.2s ease-out;
                }
                .marker-pulse {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    background: rgba(59, 130, 246, 0.3);
                    border-radius: 50%;
                    top: -15px;
                    left: -15px;
                    animation: pulse 2s infinite;
                    z-index: -1;
                }
                @keyframes pulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(3); opacity: 0; }
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                const map = new maplibregl.Map({
                    container: 'map',
                    style: {
                        "version": 8,
                        "sources": {
                            "osm": {
                                "type": "raster",
                                "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                                "tileSize": 256,
                                "attribution": "&copy; OpenStreetMap Contributors"
                            }
                        },
                        "layers": [] // Layers will be added via toggleLayer
                    },
                    center: [77.2090, 28.6139],
                    zoom: 12,
                    pitch: 0,
                    bearing: 0,
                    antialias: true,
                    dragRotate: true,
                    touchZoomRotate: true
                });

                let userMarker;
                let currentZones = [];

                function toggleLayer(isSatellite) {
                    if (map.getLayer('osm')) map.removeLayer('osm');
                    if (map.getLayer('satellite')) map.removeLayer('satellite');

                    if (isSatellite) {
                        if (!map.getSource('satellite')) {
                            map.addSource('satellite', {
                                "type": "raster",
                                "tiles": ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                                "tileSize": 256
                            });
                        }
                        map.addLayer({
                            "id": "satellite",
                            "type": "raster",
                            "source": "satellite"
                        }, map.getLayer('route-layer') ? 'route-layer' : undefined);
                    } else {
                        map.addLayer({
                            "id": "osm",
                            "type": "raster",
                            "source": "osm"
                        }, map.getLayer('route-layer') ? 'route-layer' : undefined);
                    }
                }

                map.on('load', () => {
                    map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                    map.addLayer({
                        id: 'route-layer',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: {
                            'line-color': ['get', 'color'],
                            'line-width': 8,
                            'line-opacity': 0.8
                        }
                    });

                    // Set initial layer based on state
                    toggleLayer(${isSatellite});

                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
                });

                function toggle3D(enabled) {
                    map.easeTo({
                        pitch: enabled ? 60 : 0,
                        duration: 800
                    });
                }

                function updateUserLocation(lat, lng, heading) {
                    if (!userMarker) {
                        const el = document.createElement('div');
                        el.innerHTML = '<div class="marker-pulse"></div><div class="user-arrow" id="nav-arrow"></div>';
                        userMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
                            .setLngLat([lng, lat])
                            .addTo(map);
                        map.flyTo({ center: [lng, lat], zoom: 16 });
                    } else {
                        userMarker.setLngLat([lng, lat]);
                        const arrow = document.getElementById('nav-arrow');
                        if (arrow) arrow.style.transform = 'rotate(' + (heading || 0) + 'deg)';
                    }
                }

                function setZones(zones) {
                    currentZones = zones;
                    if (!map.getSource('zones')) {
                        map.addSource('zones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                        map.addLayer({
                            id: 'zones-layer',
                            type: 'fill',
                            source: 'zones',
                            paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 }
                        });
                    }
                    
                    const features = zones.map(zone => {
                        if (!zone.geometry) return null;
                        return {
                            type: 'Feature',
                            properties: { color: zone.type === 'danger' ? '#EF4444' : '#F59E0B' },
                            geometry: zone.geometry
                        };
                    }).filter(f => f);

                    map.getSource('zones').setData({ type: 'FeatureCollection', features });
                }

                function setMarkers(items, type) {
                    // Remove old markers of this type
                    const layerId = 'markers-' + type;
                    const sourceId = 'source-' + type;

                    if (map.getLayer(layerId)) map.removeLayer(layerId);
                    if (map.getSource(sourceId)) map.removeSource(sourceId);

                    const features = items.map(item => ({
                        type: 'Feature',
                        properties: { name: item.name, color: type === 'hotel' ? '#10B981' : '#EF4444' },
                        geometry: { type: 'Point', coordinates: [item.longitude, item.latitude] }
                    }));

                    map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features } });
                    map.addLayer({
                        id: layerId,
                        type: 'circle',
                        source: sourceId,
                        paint: {
                            'circle-radius': 6,
                            'circle-color': ['get', 'color'],
                            'circle-stroke-color': '#fff',
                            'circle-stroke-width': 2
                        }
                    });
                }

                function checkRouteSafety(geometry) {
                    let score = 100;
                    currentZones.forEach(zone => {
                        if (!zone.geometry) return;
                        try {
                            const zonePoly = turf.polygon(zone.geometry.coordinates);
                            const routeLine = { type: 'Feature', geometry: geometry };
                            if (turf.booleanIntersects(routeLine, zonePoly)) {
                                score -= (zone.type === 'danger' ? 95 : 40);
                            }
                        } catch (e) {}
                    });
                    return Math.max(0, score);
                }

                function setRoute(geometry) {
                    const safetyScore = checkRouteSafety(geometry);
                    const color = safetyScore < 50 ? '#EF4444' : (safetyScore < 85 ? '#F59E0B' : '#10B981');
                    
                    map.getSource('route').setData({
                        type: 'Feature',
                        properties: { color: color },
                        geometry: geometry
                    });

                    const bounds = new maplibregl.LngLatBounds();
                    geometry.coordinates.forEach(c => bounds.extend(c));
                    map.fitBounds(bounds, { padding: 50 });

                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'ROUTE_STATUS',
                        safetyScore: safetyScore,
                        isSafe: safetyScore > 70
                    }));
                }

                window.syncMap = () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
                window.setZones = setZones;
                window.setMarkers = setMarkers;
                window.setRoute = setRoute;
                window.updateUserLocation = updateUserLocation;
                window.toggle3D = toggle3D;
            </script>
        </body>
        </html>
        `;
    };

    const fetchZones = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/geo`);
            if (response.data.success) setZones(response.data.data);
        } catch (error) {
            console.log('Error fetching zones:', error);
        }
    };

    const fetchPlaces = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/places`);
            if (response.data.success) setHeritagePlaces(response.data.data);
        } catch (error) {
            console.log('Error fetching places:', error);
        } finally {
            setLoadingPlaces(false);
        }
    };

    const fetchHotels = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/hotels`);
            if (response.data.success) setVerifiedHotels(response.data.data);
        } catch (error) {
            console.log('Error fetching hotels:', error);
        } finally {
            setLoadingHotels(false);
        }
    };

    const fetchIdentityAndVisa = async () => {
        try {
            const identityRes = await axios.post(`${API_BASE_URL}/identity/initialize`, { touristId });
            setIdentityData(identityRes.data);
            const profileRes = await axios.get(`${API_BASE_URL}/profile/${touristId}`);
            if (profileRes.data?.success && profileRes.data?.data?.visaNumber) {
                const visaRes = await axios.get(`${API_BASE_URL}/visa/${profileRes.data.data.visaNumber}`);
                if (visaRes.data?.success) setVisaData(visaRes.data.data);
            }
        } catch (error) {
            console.log('Error fetching identity/visa:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        if (!userLocation) {
            Alert.alert('GPS Required', 'Please wait for your GPS location to lock before searching.');
            return;
        }
        setIsSearching(true);

        try {
            const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
                headers: { 'User-Agent': 'TouristSafetyApp/1.0' }
            });

            if (geoRes.data.length === 0) {
                Alert.alert('Not Found', 'We could not locate this address or PIN code.');
                setIsSearching(false);
                return;
            }

            const dest = geoRes.data[0];
            const destLat = parseFloat(dest.lat);
            const destLon = parseFloat(dest.lon);
            setDestinationCoords({ latitude: destLat, longitude: destLon });

            const routeRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${destLon},${destLat}?overview=full&geometries=geojson&alternatives=true`);

            if (routeRes.data.routes && routeRes.data.routes.length > 0) {
                const route = routeRes.data.routes[0];
                const mainRoute = route.geometry;

                // Calculate detailed info
                const distanceKm = (route.distance / 1000).toFixed(1);
                const durationMin = Math.round(route.duration / 60);

                setRouteInfo({
                    distance: distanceKm,
                    duration: `${durationMin} min`,
                    safetyScore: 100 // Default, will be updated by ROUTE_STATUS message
                });

                setSafeRoute(mainRoute);

                if (mapRef.current) {
                    setTimeout(() => {
                        mapRef.current?.injectJavaScript(`if (typeof setRoute === 'function') setRoute(${JSON.stringify(mainRoute)});`);
                    }, 1000);
                }
            }
        } catch (error) {
            console.log('Search Error:', error);
            Alert.alert('Navigation Error', 'Failed to calculate route. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const toggle3DMode = () => {
        const nextState = !is3DMode;
        setIs3DMode(nextState);
        if (mapRef.current) {
            mapRef.current.injectJavaScript(`toggle3D(${nextState});`);
        }
    };

    const toggleSatellite = () => {
        const nextState = !isSatellite;
        setIsSatellite(nextState);
        if (mapRef.current) {
            mapRef.current.injectJavaScript(`toggleLayer(${nextState});`);
        }
    };

    const toggleMap = () => {
        setIsMapExpanded(!isMapExpanded);
    };

    // ── Translator helpers ───────────────────────────────────────
    const startTransWave = () => {
        const anims = transWaveAnims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 55),
                    Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.sin, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0.15, duration: 300, easing: Easing.sin, useNativeDriver: true }),
                ])
            )
        );
        transWaveLoopRef.current = Animated.parallel(anims);
        transWaveLoopRef.current.start();
    };

    const stopTransWave = () => {
        transWaveLoopRef.current?.stop();
        transWaveAnims.forEach(a => a.setValue(0.2));
    };

    useEffect(() => {
        if (transListening) startTransWave();
        else stopTransWave();
    }, [transListening]);

    const openTranslator = () => {
        setTransTranscript('');
        setTransEnglishText('');
        setTransDetectedLang('');
        setShowTranslator(true);
        setTransListening(false);
    };

    const stopTranslatedAudio = () => {
        transAudioWebViewRef.current?.injectJavaScript(`
            if (window.ttsPlayer) {
                window.ttsPlayer.pause();
                window.ttsPlayer.src = '';
            }
        `);
        setTransIsSpeaking(false);
    };

    const playTranslatedAudio = async (text: string) => {
        try {
            setTransIsSpeaking(true);
            const res = await axios.post(`${SCANNER_API_URL}/tts`, { text });
            if (res.data.success && res.data.audio) {
                transAudioWebViewRef.current?.injectJavaScript(`
                    (function() {
                        if (window.ttsPlayer) {
                            window.ttsPlayer.pause();
                            window.ttsPlayer.src = '';
                        }
                        window.ttsPlayer = new Audio('data:audio/mpeg;base64,${res.data.audio}');
                        window.ttsPlayer.onended = function() {
                            window.ReactNativeWebView.postMessage('tts_ended');
                        };
                        window.ttsPlayer.onerror = function() {
                            window.ReactNativeWebView.postMessage('tts_ended');
                        };
                        var p = window.ttsPlayer.play();
                        if (p) p.catch(function() { window.ReactNativeWebView.postMessage('tts_ended'); });
                    })();
                `);
            } else {
                setTransIsSpeaking(false);
            }
        } catch (err) {
            console.log('TTS playback error:', err);
            setTransIsSpeaking(false);
        }
    };

    const closeTranslator = () => {
        transWebViewRef.current?.injectJavaScript('stopRecognition(); true;');
        stopTranslatedAudio();
        setShowTranslator(false);
        setTransListening(false);
        stopTransWave();
    };

    const handleTransWebViewMessage = async (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'STARTED') {
                setTransListening(true);
                setTransTranscript('');
                setTransEnglishText('');
                setTransDetectedLang('');
            } else if (data.type === 'RESULT') {
                setTransTranscript(data.text);
                if (data.isFinal) {
                    setTransListening(false);
                    // Send audio blob to translate-audio endpoint
                    // Since we're using Web Speech API (text-only), use Groq Llama for translation
                    await translateWithLlm(data.text);
                }
            } else if (data.type === 'ENDED') {
                setTransListening(false);
            } else if (data.type === 'ERROR') {
                console.log('Trans WebView Error:', data.message);
                setTransListening(false);
            } else if (data.type === 'LANG') {
                setTransDetectedLang(data.language);
            }
        } catch (e) {
            console.log('Trans message parse error:', e);
        }
    };

    const translateWithLlm = async (originalText: string) => {
        if (!originalText.trim()) return;
        setTransLoading(true);
        try {
            const res = await axios.post(`${SCANNER_API_URL}/chat`, {
                message: `Translate the following text to English. If it's already English, just return it. Detect the source language. Return ONLY a JSON: {"detected_language": "<language name>", "english_text": "<translation>"}\n\nText: ${originalText}`,
                history: []
            });

            let detected = '';
            let english = originalText;

            if (res.data.detected_language) {
                detected = res.data.detected_language;
                english = res.data.english_text || originalText;
            } else if (res.data.text) {
                try {
                    const raw = res.data.text.trim();
                    const start = raw.indexOf('{');
                    const end = raw.lastIndexOf('}') + 1;
                    if (start !== -1 && end > start) {
                        const parsed = JSON.parse(raw.slice(start, end));
                        detected = parsed.detected_language || '';
                        english = parsed.english_text || originalText;
                    } else {
                        english = raw;
                    }
                } catch {
                    english = res.data.text;
                }
            }

            setTransDetectedLang(detected);
            setTransEnglishText(english);

            // 🔊 Auto-play the English translation
            if (english && english.trim()) {
                await playTranslatedAudio(english);
            }
        } catch (err) {
            console.log('Translation error:', err);
            setTransEnglishText(originalText);
        } finally {
            setTransLoading(false);
        }
    };

    const getTranslatorHtml = () => `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:transparent;">
<script>
  var recognition; var started = false;
  function startRecognition() {
    if (started) return;
    try {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { window.ReactNativeWebView.postMessage(JSON.stringify({type:'ERROR',message:'not-supported'})); return; }
      recognition = new SR();
      recognition.lang = 'auto';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onstart = () => { started=true; window.ReactNativeWebView.postMessage(JSON.stringify({type:'STARTED'})); };
      recognition.onresult = (e) => {
        var t=''; var f=false;
        for(var i=e.resultIndex;i<e.results.length;i++){t+=e.results[i][0].transcript; if(e.results[i].isFinal)f=true;}
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'RESULT',text:t,isFinal:f}));
      };
      recognition.onerror = (e) => { started=false; window.ReactNativeWebView.postMessage(JSON.stringify({type:'ERROR',message:e.error})); };
      recognition.onend = () => { started=false; window.ReactNativeWebView.postMessage(JSON.stringify({type:'ENDED'})); };
      recognition.start();
    } catch(e){ window.ReactNativeWebView.postMessage(JSON.stringify({type:'ERROR',message:e.message})); }
  }
  function stopRecognition(){ if(recognition&&started)recognition.stop(); }
  window.onload = () => setTimeout(startRecognition, 200);
  window.startRecognition=startRecognition;
  window.stopRecognition=stopRecognition;
</script>
</body></html>
`;

    // Only show first 3 cards in home
    const displayPlaces = heritagePlaces.slice(0, 3);
    const displayHotels = verifiedHotels.slice(0, 3);
    const hasMorePlaces = heritagePlaces.length > 3;
    const hasMoreHotels = verifiedHotels.length > 3;

    return (
        <View style={styles.container}>
            {/* Premium Safety Poster Banner */}
            <View style={styles.govBanner}>
                <View style={styles.govBannerLeft}>
                    <Shield size={28} color="#FFD700" fill="rgba(255, 215, 0, 0.1)" />
                    <View style={styles.govBannerTextContainer}>
                        <Text style={styles.govBannerText}>
                            {t('welcome_banner')}
                        </Text>
                        <Text style={styles.govSubText}>{t('safety_priority')}</Text>
                    </View>
                </View>
                {/* Translator + Profile buttons */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                        onPress={openTranslator}
                        style={styles.translatorBtn}
                        activeOpacity={0.8}
                    >
                        <Languages size={20} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile', { touristId })}
                        style={styles.profileBtn}
                    >
                        <User size={24} color="#F8FAFC" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Speech-to-English Translator Modal ───────────────── */}
            <Modal
                transparent
                visible={showTranslator}
                animationType="slide"
                onRequestClose={closeTranslator}
            >
                <View style={styles.transOverlay}>
                    <View style={styles.transCard}>
                        {/* Header */}
                        <View style={styles.transHeader}>
                            <Languages size={20} color="#10B981" />
                            <Text style={styles.transTitle}>SPEAK TO TRANSLATE</Text>
                            <TouchableOpacity onPress={closeTranslator} style={{ padding: 4 }}>
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.transSubtitle}>
                            Speak in any language → get English translation
                        </Text>

                        {/* Waveform area */}
                        <View style={styles.transWaveContainer}>
                            {/* Straight center line */}
                            <View style={styles.transBaseLine} />
                            {/* Animated bars — color shifts: red=listening, blue=speaking, dark=idle */}
                            {transWaveAnims.map((anim, i) => (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.transWaveBar,
                                        {
                                            transform: [{ scaleY: anim }],
                                            backgroundColor: transListening
                                                ? (i % 3 === 0 ? '#EF4444' : i % 3 === 1 ? '#F87171' : '#FCA5A5')
                                                : transIsSpeaking
                                                    ? (i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#34D399' : '#6EE7B7')
                                                    : '#1E293B',
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Status */}
                        <Text style={styles.transListeningLabel}>
                            {transListening
                                ? '🔴  Listening... speak now'
                                : transLoading
                                    ? '⏳  Translating...'
                                    : transIsSpeaking
                                        ? '🔊  Speaking in English...'
                                        : transTranscript
                                            ? '✅  Done'
                                            : '⏳  Starting microphone...'}
                        </Text>

                        {/* Original transcript */}
                        {transTranscript ? (
                            <View style={styles.transOriginalBox}>
                                <Text style={styles.transBoxLabel}>
                                    {transDetectedLang ? `Detected: ${transDetectedLang}` : 'Original'}
                                </Text>
                                <Text style={styles.transOriginalText}>{transTranscript}</Text>
                            </View>
                        ) : null}

                        {/* English result */}
                        {transLoading ? (
                            <View style={styles.transResultBox}>
                                <ActivityIndicator color="#10B981" size="small" />
                                <Text style={styles.transLoadingText}>Translating with AI...</Text>
                            </View>
                        ) : transEnglishText ? (
                            <View style={[styles.transResultBox, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <View style={styles.transResultHeader}>
                                        <Globe size={14} color="#10B981" />
                                        <Text style={styles.transResultLabel}>ENGLISH TRANSLATION</Text>
                                    </View>
                                    {/* Stop / Replay audio */}
                                    <TouchableOpacity
                                        style={styles.transAudioBtn}
                                        onPress={() => {
                                            if (transIsSpeaking) {
                                                stopTranslatedAudio();
                                            } else {
                                                playTranslatedAudio(transEnglishText);
                                            }
                                        }}
                                    >
                                        <Text style={styles.transAudioBtnText}>
                                            {transIsSpeaking ? '⏹ Stop' : '🔊 Replay'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.transResultText}>{transEnglishText}</Text>
                            </View>
                        ) : null}

                        {/* Actions */}
                        <View style={styles.transActions}>
                            <TouchableOpacity
                                style={styles.transRetryBtn}
                                onPress={() => {
                                    setTransTranscript('');
                                    setTransEnglishText('');
                                    setTransDetectedLang('');
                                    setTransListening(false);
                                    setTimeout(() => {
                                        transWebViewRef.current?.injectJavaScript('startRecognition(); true;');
                                    }, 200);
                                }}
                            >
                                <Mic size={18} color="#10B981" />
                                <Text style={styles.transRetryText}>Speak Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.transDoneBtn} onPress={closeTranslator}>
                                <Text style={styles.transDoneText}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Hidden: SpeechRecognition WebView */}
                        <View style={{ height: 1, width: 1, overflow: 'hidden' }}>
                            <WebView
                                ref={transWebViewRef}
                                originWhitelist={['*']}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                mediaPlaybackRequiresUserAction={false}
                                allowsInlineMediaPlayback={true}
                                source={{ html: getTranslatorHtml() }}
                                onMessage={handleTransWebViewMessage}
                            />
                        </View>
                        {/* Hidden: TTS Audio WebView */}
                        <View style={{ height: 1, width: 1, overflow: 'hidden' }}>
                            <WebView
                                ref={transAudioWebViewRef}
                                originWhitelist={['*']}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                mediaPlaybackRequiresUserAction={false}
                                allowsInlineMediaPlayback={true}
                                source={{ html: '<html><body style="background:transparent;"></body></html>' }}
                                onMessage={(event) => {
                                    if (event.nativeEvent.data === 'tts_ended') {
                                        setTransIsSpeaking(false);
                                    }
                                }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Conditional Fullscreen Map or Scrollable Content */}
            {isMapExpanded ? (
                <View style={styles.mapExpandedContainer}>
                    <WebView
                        ref={mapRef}
                        originWhitelist={['*']}
                        source={{ html: getLeafletHtml() }}
                        style={styles.map}
                        onLoadEnd={() => {
                            if (mapRef.current) {
                                mapRef.current.injectJavaScript('if(window.syncMap) window.syncMap();');
                            }
                        }}
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                if (data.type === 'READY') {
                                    pushStateToMap();
                                }
                                if (data.type === 'ROUTE_STATUS') {
                                    setRouteInfo(prev => prev ? { ...prev, safetyScore: data.safetyScore } : null);
                                    if (!data.isSafe) {
                                        Alert.alert('Safety Warning', 'This route passes through or near high-risk danger zones.');
                                    }
                                }
                            } catch (e) { console.log('Message Error:', e); }
                        }}
                    />

                    {/* Floating Search Bar (Expanded) */}
                    <View style={styles.mapSearchOverlay}>
                        <View style={styles.searchInner}>
                            <Search size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('search_safest_path')}
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                            />
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <TouchableOpacity onPress={handleSearch}>
                                    <View style={{ backgroundColor: '#EF4444', padding: 8, borderRadius: 10 }}>
                                        <Navigation size={18} color="#F8FAFC" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Map Controls (Expanded) */}
                    <View style={styles.mapControls}>
                        <TouchableOpacity style={styles.controlBtn} onPress={toggle3DMode}>
                            <Box size={20} color={is3DMode ? '#10B981' : '#F8FAFC'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlBtn} onPress={toggleSatellite}>
                            <Globe size={20} color={isSatellite ? '#10B981' : '#F8FAFC'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlBtn} onPress={toggleMap}>
                            <Minimize size={20} color="#F8FAFC" />
                        </TouchableOpacity>
                    </View>

                    {/* Route Info Card */}
                    {routeInfo && (
                        <View style={styles.routeInsightCard}>
                            <View style={styles.insightHeader}>
                                <Navigation size={22} color="#10B981" />
                                <Text style={styles.insightTitle}>Safest Path Selected</Text>
                                <View style={[
                                    styles.safetyBadge,
                                    { backgroundColor: routeInfo.safetyScore < 50 ? 'rgba(239, 68, 68, 0.15)' : (routeInfo.safetyScore < 85 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)') }
                                ]}>
                                    <Shield size={12} color={routeInfo.safetyScore < 50 ? '#EF4444' : (routeInfo.safetyScore < 85 ? '#F59E0B' : '#10B981')} />
                                    <Text style={[
                                        styles.safetyPercent,
                                        { color: routeInfo.safetyScore < 50 ? '#EF4444' : (routeInfo.safetyScore < 85 ? '#F59E0B' : '#10B981') }
                                    ]}>{routeInfo.safetyScore}% SAFE</Text>
                                </View>
                            </View>
                            <View style={styles.insightGrid}>
                                <View style={styles.insightItem}>
                                    <Text style={styles.insightVal}>{routeInfo.distance}</Text>
                                    <Text style={styles.insightLab}>KM</Text>
                                </View>
                                <View style={styles.insightDivider} />
                                <View style={styles.insightItem}>
                                    <Text style={styles.insightVal}>{routeInfo.duration}</Text>
                                    <Text style={styles.insightLab}>TIME</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                    {/* Real Time Map Area - Home View */}
                    <View style={styles.mapContainer}>
                        <WebView
                            ref={mapRef}
                            originWhitelist={['*']}
                            source={{ html: getLeafletHtml() }}
                            style={styles.map}
                            scrollEnabled={false}
                            onLoadEnd={() => {
                                if (mapRef.current) {
                                    mapRef.current.injectJavaScript('if(window.syncMap) window.syncMap();');
                                }
                            }}
                            onMessage={(event) => {
                                try {
                                    const data = JSON.parse(event.nativeEvent.data);
                                    if (data.type === 'READY') {
                                        pushStateToMap();
                                    }
                                } catch (e) { }
                            }}
                        />

                        {/* Floating Search Bar */}
                        <View style={styles.mapSearchOverlay}>
                            <View style={styles.searchInner}>
                                <Search size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Find Safest Path..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                />
                                {isSearching ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <TouchableOpacity onPress={handleSearch}>
                                        <View style={{ backgroundColor: '#EF4444', padding: 8, borderRadius: 10 }}>
                                            <Navigation size={18} color="#F8FAFC" />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Map Controls */}
                        <View style={styles.homeMapControls}>
                            <TouchableOpacity style={styles.controlBtn} onPress={toggleMap}>
                                <Maximize size={20} color="#F8FAFC" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statusBadge}>
                            <View style={styles.pulse} />
                            <Text style={styles.statusText}>ENCRYPTED GPS MONITORING ACTIVE</Text>
                        </View>
                    </View>

                    {/* Secure Identity Card */}
                    {identityData && (
                        <View style={styles.identityCardWrapper}>
                            <TouchableOpacity
                                style={styles.idCard}
                                onPress={() => navigation.navigate('Identity', { touristId })}
                                activeOpacity={0.8}
                            >
                                <View style={styles.idCardHeader}>
                                    <Fingerprint size={18} color="#10B981" />
                                    <Text style={styles.idCardTitle}>Secure Crypto ID</Text>
                                    <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                                </View>
                                <View style={styles.didBoxSm}>
                                    <Text style={styles.didTextSm} numberOfLines={1} ellipsizeMode="middle">
                                        DID: {identityData.did}
                                    </Text>
                                </View>
                                {visaData && (
                                    <View style={styles.visaInfoRow}>
                                        <View style={styles.visaBadge}>
                                            <Shield size={10} color="#F8FAFC" />
                                            <Text style={styles.visaBadgeText}>{visaData.status}</Text>
                                        </View>
                                        <Text style={styles.visaNumText}>VISA: {visaData.visaNumber}</Text>
                                        <Text style={styles.visaType}>({visaData.visaType})</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Govt Visa Details Card */}
                    {visaData && (
                        <View style={styles.visaCardWrapper}>
                            <View style={styles.vCard}>
                                <View style={styles.vHeader}>
                                    <View style={styles.vIconBox}>
                                        <FileText size={20} color="#EF4444" />
                                    </View>
                                    <View>
                                        <Text style={styles.vTitle}>{t('travel_authorization')}</Text>
                                        <View style={styles.vStatusBadge}>
                                            <View style={styles.vStatusDot} />
                                            <Text style={styles.vStatusText}>{t('officially_verified')}</Text>
                                        </View>

                                    </View>
                                    <Shield size={22} color="rgba(248, 250, 252, 0.2)" style={{ marginLeft: 'auto' }} />
                                </View>

                                <View style={styles.vGrid}>
                                    <View style={styles.vItem}>
                                        <Globe size={12} color="#94A3B8" />
                                        <Text style={styles.vLabel}>NATIONALITY</Text>
                                        <Text style={styles.vValue}>UNITED STATES</Text>
                                    </View>
                                    <View style={styles.vItem}>
                                        <Shield size={12} color="#94A3B8" />
                                        <Text style={styles.vLabel}>PASSPORT</Text>
                                        <Text style={styles.vValue}>{visaData.passportNumber}</Text>
                                    </View>
                                </View>

                                <View style={styles.vDivider} />

                                <View style={styles.vGrid}>
                                    <View style={styles.vItem}>
                                        <Calendar size={12} color="#94A3B8" />
                                        <Text style={styles.vLabel}>EXPIRY DATE</Text>
                                        <Text style={[styles.vValue, { color: '#EF4444' }]}>{visaData.expiryDate}</Text>
                                    </View>
                                    <View style={styles.vItem}>
                                        <CheckCircle2 size={12} color="#94A3B8" />
                                        <Text style={styles.vLabel}>GOVT REF</Text>
                                        <Text style={styles.vValue}>{visaData.govtRef}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Embassy Contact Card */}
                    <View style={styles.embassyCardWrapper}>
                        <TouchableOpacity
                            style={styles.embassyCard}
                            onPress={() => Linking.openURL('tel:6353245961')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.embassyIconBox}>
                                <Phone size={22} color="#F8FAFC" />
                            </View>
                            <View style={styles.embassyTextContainer}>
                                <Text style={styles.embassyTitle}>{t('contact_embassy')}</Text>
                                <Text style={styles.embassySubtitle}>{t('embassy_support')}</Text>
                            </View>
                            <ChevronRight size={20} color="rgba(248, 250, 252, 0.3)" />
                        </TouchableOpacity>
                    </View>

                    {/* Content Section */}
                    <View style={styles.content}>

                        {/* ===== HERITAGE & FAMOUS PLACES ===== */}
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionHeaderLeft}>
                                <Landmark size={24} color="#EF4444" />
                                <Text style={styles.sectionTitle}>{t('heritage_places')}</Text>

                            </View>
                            {hasMorePlaces && (
                                <TouchableOpacity
                                    style={styles.viewMoreBtn}
                                    onPress={() => navigation.navigate('Places')}
                                >
                                    <Text style={styles.viewMoreText}>{t('view_all')}</Text>

                                    <ArrowRight size={14} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {loadingPlaces ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#EF4444" />
                                <Text style={styles.loadingText}>{t('loading_places')}</Text>

                            </View>
                        ) : (
                            <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {displayPlaces.map((place) => (
                                        <TouchableOpacity
                                            key={place._id || place.id}
                                            style={styles.card}
                                            onPress={() => navigation.navigate('PlaceDetail', { place })}
                                            activeOpacity={0.85}
                                        >
                                            <Image source={{ uri: place.image }} style={styles.cardImage} />
                                            <View style={styles.cardOverlay}>
                                                <View style={styles.ratingBadge}>
                                                    <Star size={12} color="#FFD700" fill="#FFD700" />
                                                    <Text style={styles.ratingText}>{place.rating}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.cardContent}>
                                                <Text style={styles.cardName} numberOfLines={1}>{place.name}</Text>
                                                <View style={styles.cardLocation}>
                                                    <MapPin size={14} color="#94A3B8" />
                                                    <Text style={styles.locationText}>{place.city || place.location}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}

                                    {/* "Show More" card if more than 3 */}
                                    {hasMorePlaces && (
                                        <TouchableOpacity
                                            style={[styles.card, styles.showMoreCard]}
                                            onPress={() => navigation.navigate('Places')}
                                        >
                                            <View style={styles.showMoreInner}>
                                                <View style={styles.showMoreCircle}>
                                                    <ArrowRight size={24} color="#EF4444" />
                                                </View>
                                                <Text style={styles.showMoreCount}>+{heritagePlaces.length - 3}</Text>
                                                <Text style={styles.showMoreLabel}>{t('more_places')}</Text>

                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>

                                {hasMorePlaces && (
                                    <TouchableOpacity
                                        style={styles.viewMoreBanner}
                                        onPress={() => navigation.navigate('Places')}
                                    >
                                        <Landmark size={18} color="#EF4444" />
                                        <Text style={styles.viewMoreBannerText}>
                                            View All {heritagePlaces.length} Heritage Places
                                        </Text>
                                        <ChevronRight size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* ===== VERIFIED SAFE HOTELS ===== */}
                        <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
                            <View style={styles.sectionHeaderLeft}>
                                <Building2 size={24} color="#EF4444" />
                                <Text style={styles.sectionTitle}>{t('verified_hotels')}</Text>

                            </View>
                            {hasMoreHotels && (
                                <TouchableOpacity
                                    style={styles.viewMoreBtn}
                                    onPress={() => navigation.navigate('Hotels')}
                                >
                                    <Text style={styles.viewMoreText}>View All</Text>
                                    <ArrowRight size={14} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {loadingHotels ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#EF4444" />
                                <Text style={styles.loadingText}>{t('loading_hotels')}</Text>

                            </View>
                        ) : (
                            <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {displayHotels.map((hotel) => (
                                        <TouchableOpacity
                                            key={hotel._id || hotel.id}
                                            style={styles.card}
                                            onPress={() => navigation.navigate('HotelDetail', { hotel })}
                                            activeOpacity={0.85}
                                        >
                                            <Image source={{ uri: hotel.image }} style={styles.cardImage} />
                                            <View style={styles.cardOverlay}>
                                                <View style={[styles.ratingBadge, styles.verifiedHotelBadge]}>
                                                    <Shield size={12} color="#10B981" />
                                                    <Text style={[styles.ratingText, { color: '#10B981' }]}>VERIFIED</Text>
                                                </View>
                                            </View>
                                            <View style={styles.cardContent}>
                                                <Text style={styles.cardName} numberOfLines={1}>{hotel.name}</Text>
                                                <Text style={styles.priceText}>{hotel.pricePerNight}/night</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}

                                    {/* "Show More" card if more than 3 */}
                                    {hasMoreHotels && (
                                        <TouchableOpacity
                                            style={[styles.card, styles.showMoreCard]}
                                            onPress={() => navigation.navigate('Hotels')}
                                        >
                                            <View style={styles.showMoreInner}>
                                                <View style={styles.showMoreCircle}>
                                                    <ArrowRight size={24} color="#10B981" />
                                                </View>
                                                <Text style={styles.showMoreCount}>+{verifiedHotels.length - 3}</Text>
                                                <Text style={styles.showMoreLabel}>{t('more_hotels')}</Text>

                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>

                                {hasMoreHotels && (
                                    <TouchableOpacity
                                        style={[styles.viewMoreBanner, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}
                                        onPress={() => navigation.navigate('Hotels')}
                                    >
                                        <Building2 size={18} color="#10B981" />
                                        <Text style={[styles.viewMoreBannerText, { color: '#10B981' }]}>
                                            View All {verifiedHotels.length} Verified Hotels
                                        </Text>
                                        <ChevronRight size={18} color="#10B981" />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* Local Safety Reports */}
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionHeaderLeft}>
                                <AlertTriangle size={24} color="#EF4444" />
                                <Text style={styles.sectionTitle}>{t('local_safety_reports')}</Text>

                            </View>
                        </View>
                        <TouchableOpacity style={styles.reportBanner}>
                            <Text style={styles.reportBannerText}>{t('see_nearby_events')}</Text>

                            <ChevronRight color="#F8FAFC" size={20} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Custom Bottom Docked Footer */}
            <View style={styles.footerDock}>
                <View style={styles.footerBackground} />
                <TouchableOpacity
                    style={styles.footerTab}
                    onPress={() => Linking.openURL('tel:112')}
                >
                    <View style={[styles.footerIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <Shield size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.footerTabText, { color: '#EF4444' }]}>{t('sos') || 'SOS'}</Text>
                </TouchableOpacity>

                <View style={styles.scannerBtnWrapper}>
                    <TouchableOpacity
                        style={styles.scannerBtnMain}
                        onPress={() => navigation.navigate('Scanner')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.scannerGlow} />
                        <View style={styles.scannerInner}>
                            <Camera size={32} color="#FFF" />
                        </View>
                        <View style={styles.scanBadge}>
                            <Text style={styles.scanBadgeText}>AI</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.scannerLabel}>{t('verify_price') || 'Verify Price'}</Text>
                </View>

                <TouchableOpacity
                    style={styles.footerTab}
                    onPress={() => navigation.navigate('Chat', { refresh: Date.now() })}
                >
                    <View style={[styles.footerIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <MessageSquare size={22} color="#3B82F6" />
                    </View>
                    <Text style={[styles.footerTabText, { color: '#3B82F6' }]}>{t('ai_chat') || 'AI Chat'}</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    govBanner: {
        backgroundColor: '#0F172A',
        paddingVertical: 18,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        paddingTop: 55,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    govBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 15,
    },
    govBannerTextContainer: {
        flex: 1,
        borderLeftWidth: 3,
        borderColor: '#EF4444',
        paddingLeft: 12,
    },
    profileBtn: {
        backgroundColor: 'rgba(248, 250, 252, 0.15)',
        padding: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(248, 250, 252, 0.2)',
    },
    translatorBtn: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        padding: 10,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },

    // Translator Modal
    transOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'flex-end',
    },
    transCard: {
        backgroundColor: '#0F172A',
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 30,
    },
    transHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    transTitle: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
    },
    transSubtitle: {
        color: '#475569',
        fontSize: 12,
        marginBottom: 22,
        marginLeft: 2,
    },

    // Waveform
    transWaveContainer: {
        height: 90,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginBottom: 14,
        position: 'relative',
    },
    transBaseLine: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
    },
    transWaveBar: {
        width: 6,
        height: 70,
        borderRadius: 5,
    },

    transListeningLabel: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 18,
        letterSpacing: 0.5,
    },

    transOriginalBox: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    transBoxLabel: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    transOriginalText: {
        color: '#94A3B8',
        fontSize: 15,
        lineHeight: 22,
        fontStyle: 'italic',
    },

    transResultBox: {
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    transResultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    transResultLabel: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    transResultText: {
        color: '#F8FAFC',
        fontSize: 17,
        lineHeight: 26,
        fontWeight: '600',
    },
    transLoadingText: {
        color: '#10B981',
        fontSize: 13,
        marginLeft: 10,
        fontWeight: '600',
    },

    transActions: {
        flexDirection: 'row',
        gap: 12,
    },
    transRetryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(16, 185, 129, 0.5)',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    transRetryText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '900',
    },
    transDoneBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 16,
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    transDoneText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
    },
    transAudioBtn: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    transAudioBtnText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '900',
    },
    govBannerText: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '900',
        lineHeight: 18,
        letterSpacing: 0.5,
    },
    govSubText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
        letterSpacing: 1,
    },
    mapContainer: { height: 350, width: '100%', position: 'relative', backgroundColor: '#1E293B', overflow: 'hidden' },
    mapExpandedContainer: {
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1000,
    },
    map: { flex: 1, width: '100%', borderWidth: 2, borderColor: '#EF4444' },
    mapSearchOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 1001,
    },
    searchInner: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#334155',
        paddingHorizontal: 15,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
        padding: 0,
    },
    mapControls: {
        position: 'absolute',
        bottom: 260,
        right: 20,
        zIndex: 1001,
        gap: 10,
    },
    homeMapControls: {
        position: 'absolute',
        bottom: 70, // Moved up to avoid overlap with Secure Crypto ID card
        right: 20,
        zIndex: 1001,
    },
    routeInsightCard: {
        position: 'absolute',
        bottom: 110,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.8)',
        shadowColor: '#000',
        elevation: 20,
    },
    insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
    insightTitle: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 16, flex: 1 },
    safetyBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
    safetyPercent: { color: '#10B981', fontWeight: '900', fontSize: 10 },
    insightGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    insightItem: { alignItems: 'center' },
    insightVal: { color: '#F8FAFC', fontSize: 24, fontWeight: '900' },
    insightLab: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
    insightDivider: { width: 1, height: 30, backgroundColor: '#334155' },
    controlBtn: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    mapPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: { color: '#F8FAFC', marginTop: 10, fontWeight: 'bold' },
    placeholderSub: { color: '#94A3B8', fontSize: 10, marginTop: 4 },
    statusBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: { color: '#10B981', fontSize: 8, fontWeight: '900' },
    pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },

    // Identity Card
    identityCardWrapper: {
        paddingHorizontal: 20,
        marginTop: -50, // Overlap onto the map
        zIndex: 10,
    },
    idCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    idCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    idCardTitle: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: 'bold',
    },
    didBoxSm: {
        backgroundColor: '#0F172A',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        marginBottom: 12,
    },
    didTextSm: {
        color: '#10B981',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    visaInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    visaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
    },
    visaBadgeText: { color: '#F8FAFC', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
    visaNumText: { color: '#E2E8F0', fontSize: 11, fontWeight: '600' },
    visaType: { color: '#94A3B8', fontSize: 10, fontStyle: 'italic' },

    // Detailed Visa Card Styles
    visaCardWrapper: {
        paddingHorizontal: 20,
        marginTop: 15,
        marginBottom: 10,
    },
    vCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
    },
    vHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    vIconBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 10,
        borderRadius: 14,
    },
    vTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    vStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    vStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    vStatusText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    vGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    vItem: {
        flex: 1,
    },
    vLabel: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '900',
        marginTop: 6,
        letterSpacing: 1,
    },
    vValue: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 2,
    },
    vDivider: {
        height: 1,
        backgroundColor: '#334155',
        marginBottom: 15,
        opacity: 0.5,
    },

    content: { padding: 20 },

    // Section Header Row
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 8,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    sectionTitle: { fontSize: 17, fontWeight: '900', color: '#F8FAFC', flex: 1 },
    viewMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    viewMoreText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

    // Loading Row
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 20,
        marginBottom: 20,
    },
    loadingText: { color: '#64748B', fontSize: 13 },

    // Horizontal scroll
    horizontalScroll: { marginBottom: 12, marginLeft: -20, paddingLeft: 20 },

    // Cards
    card: {
        width: width * 0.6,
        backgroundColor: '#1E293B',
        borderRadius: 20,
        marginRight: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardImage: { width: '100%', height: 130 },
    cardOverlay: { position: 'absolute', top: 10, right: 10 },
    ratingBadge: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    verifiedHotelBadge: {
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    ratingText: { color: '#F8FAFC', fontSize: 10, fontWeight: 'bold' },
    cardContent: { padding: 12 },
    cardName: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    locationText: { color: '#94A3B8', fontSize: 12 },
    priceText: { color: '#10B981', fontSize: 13, fontWeight: 'bold' },

    // Show More Card
    showMoreCard: {
        borderStyle: 'dashed',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    showMoreInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    showMoreCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    showMoreCount: { color: '#EF4444', fontSize: 22, fontWeight: '900' },
    showMoreLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

    // View More Banner (below cards)
    viewMoreBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 14,
        paddingVertical: 13,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    viewMoreBannerText: { color: '#EF4444', fontSize: 14, fontWeight: '800' },

    // Safety Report
    reportBanner: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30, // Reduced as ScrollView has paddingBottom
        borderWidth: 1,
        borderColor: '#334155',
    },
    reportBannerText: { color: '#F8FAFC', fontWeight: 'bold' },

    // Floating Controls
    floatingControls: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        backgroundColor: 'transparent',
    },
    sosBtnFloating: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    sosBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', marginTop: 2 },
    aiBtnFloating: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    aiBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900', marginTop: 2 },

    // Footer Dock Styles
    footerDock: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 1000,
    },
    footerBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        // borderTopLeftRadius: 30,
        // borderTopRightRadius: 30,
    },
    footerTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    footerIconBox: {
        padding: 10,
        borderRadius: 14,
    },
    footerTabText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    scannerBtnWrapper: {
        alignItems: 'center',
        marginTop: -40,
        flex: 1.2,
    },
    scannerBtnMain: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 15,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        borderWidth: 4,
        borderColor: '#0F172A',
        position: 'relative',
    },
    scannerGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 40,
        backgroundColor: '#EF4444',
        opacity: 0.3,
        transform: [{ scale: 1.15 }],
    },
    scannerInner: {
        zIndex: 2,
    },
    scanBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#0F172A',
    },
    scanBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
    },
    scannerLabel: {
        color: '#F8FAFC',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 8,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

    // Scanner Overlay UI
    closeScannerBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 3000,
    },
    closeScannerText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
    scannerOverlayUI: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
        zIndex: 2500,
        justifyContent: 'space-between',
        padding: 40,
        backgroundColor: 'transparent',
    },
    scannerHeader: {
        marginTop: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    scannerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
        textShadowColor: 'red',
        textShadowRadius: 10,
    },
    scannerHint: {
        alignSelf: 'center',
        marginBottom: 100,
        alignItems: 'center',
    },
    scannerCorners: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 40,
        borderStyle: 'dashed',
    },
    hintText: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 20,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },

    // Native Scanner UI Styles
    nativeScanContent: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
    },
    scanLoadingContainer: {
        alignItems: 'center',
        gap: 20,
    },
    scanLoadingText: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    resultContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 30,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    itemBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 15,
    },
    itemFoundText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    itemNameText: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 20,
        textAlign: 'center',
    },
    priceRangeCard: {
        backgroundColor: '#0F172A',
        width: '100%',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        marginBottom: 20,
    },
    fairPriceLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 10,
    },
    priceValueText: {
        color: '#10B981',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 10,
    },
    trustBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trustText: {
        color: '#10B981',
        fontSize: 9,
        fontWeight: '900',
    },
    scanAdviceBox: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        marginBottom: 25,
    },
    adviceTitle: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    adviceText: {
        color: '#94A3B8',
        fontSize: 13,
        lineHeight: 18,
    },
    rescanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#EF4444',
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 15,
    },
    rescanText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
    },
    emptyScanContainer: {
        alignItems: 'center',
    },
    emptyScanText: {
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
    },
    embassyCardWrapper: {
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 10,
    },
    embassyCard: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    embassyIconBox: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        padding: 12,
        borderRadius: 15,
        marginRight: 15,
    },
    embassyTextContainer: {
        flex: 1,
    },
    embassyTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    embassySubtitle: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
});

export default MapScreen;
