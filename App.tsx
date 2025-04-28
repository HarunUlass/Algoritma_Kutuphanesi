/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { createContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Image } from 'react-native';
// MongoDB bağlantısı server.js'e taşındı, import kaldırıldı

// Ekranları içe aktar
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import AlgorithmListScreen from './src/screens/AlgorithmListScreen';
import AlgorithmDetailScreen from './src/screens/AlgorithmDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QuizScreen from './src/screens/QuizScreen';
import QuizResultScreen from './src/screens/QuizResultScreen';

// Global API URL (tüm uygulama için tek bir yerden yönetmek için)
export const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Android Emulator için localhost

// Algoritma tipini tanımla
export interface Algorithm {
  id: string;
  title: string;
  description: string;
  complexity: string;
  difficulty: string;
  category?: string;
}

// Logo için başlangıç yükleme kodu
export const loadLogo = () => {
  try {
    return require('./assets/logo.png');
  } catch (e) {
    console.warn('Logo yüklenemedi:', e);
    // Yedek olarak bir emoji döndürelim
    return null;
  }
};

// Auth Context'i oluştur
interface AuthContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  username: string;
  setUsername: (username: string) => void;
  userId: string;
  setUserId: (userId: string) => void;
  viewedAlgorithms: Algorithm[];
  addViewedAlgorithm: (algorithm: Algorithm) => void;
  clearViewedAlgorithms: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  username: '',
  setUsername: () => {},
  userId: '',
  setUserId: () => {},
  viewedAlgorithms: [],
  addViewedAlgorithm: () => {},
  clearViewedAlgorithms: () => {},
  logout: () => {},
});

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [viewedAlgorithms, setViewedAlgorithms] = useState<Algorithm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Son görüntülenen algoritmaları en başa ekler (yeni eklenen aynı algoritma varsa eski kaldırılır)
  const addViewedAlgorithm = (algorithm: Algorithm) => {
    setViewedAlgorithms(prev => {
      // Aynı algoritma zaten görüntülenmişse listeden çıkar
      const filtered = prev.filter(item => item.id !== algorithm.id);
      // Yeni algoritmayı en başa ekle (en son görüntülenen)
      return [algorithm, ...filtered];
    });
  };

  const clearViewedAlgorithms = () => {
    setViewedAlgorithms([]);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setUserId('');
    clearViewedAlgorithms();
  };

  // MongoDB bağlantısı server.js'e taşındı

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      setIsLoggedIn, 
      username, 
      setUsername, 
      userId,
      setUserId,
      viewedAlgorithms,
      addViewedAlgorithm,
      clearViewedAlgorithms,
      logout
    }}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{ 
            headerShown: false,
            cardStyle: { backgroundColor: 'white' },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AlgorithmList" component={AlgorithmListScreen} />
          <Stack.Screen name="AlgorithmDetail" component={AlgorithmDetailScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="QuizResult" component={QuizResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default App;
