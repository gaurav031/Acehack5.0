import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapScreen from '../screens/MapScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import IdentityScreen from '../screens/IdentityScreen';
import PlacesScreen from '../screens/PlacesScreen';
import HotelsScreen from '../screens/HotelsScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import HotelDetailScreen from '../screens/HotelDetailScreen';
import ScannerScreen from '../screens/ScannerScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#0F172A' }
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MapScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Identity" component={IdentityScreen} />
                <Stack.Screen name="Places" component={PlacesScreen} />
                <Stack.Screen name="Hotels" component={HotelsScreen} />
                <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
                <Stack.Screen name="HotelDetail" component={HotelDetailScreen} />
                <Stack.Screen name="Scanner" component={ScannerScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
