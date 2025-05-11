/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { createContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Image, Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import ChatBotTrigger from './src/components/ChatBotTrigger';

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
  saveAuthState: () => Promise<void>;
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
  saveAuthState: async () => {},
});

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [viewedAlgorithms, setViewedAlgorithms] = useState<Algorithm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage anahtarları
  const AUTH_STORAGE_KEY = '@auth_state';
  const VIEWED_ALGOS_KEY = '@viewed_algorithms';

  // Kullanıcı kimlik bilgileri ve oturum durumunu kaydet
  const saveAuthState = async () => {
    try {
      const authData = {
        isLoggedIn,
        username,
        userId
      };
      
      console.log('Kimlik bilgileri kaydediliyor:', JSON.stringify(authData));
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      
      if (viewedAlgorithms.length > 0) {
        await AsyncStorage.setItem(VIEWED_ALGOS_KEY, JSON.stringify(viewedAlgorithms));
      }
    } catch (error) {
      console.error('Kimlik bilgileri kaydedilemedi:', error);
    }
  };

  // Kullanıcı kimlik bilgilerini yükle
  const loadAuthState = async () => {
    try {
      const authDataJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      
      if (authDataJson) {
        const authData = JSON.parse(authDataJson);
        console.log('Kaydedilmiş kimlik bilgileri yükleniyor:', authData);
        
        if (authData.userId) {
          setIsLoggedIn(authData.isLoggedIn);
          setUsername(authData.username);
          setUserId(authData.userId);
          
          // Kullanıcı ID'sini doğrula
          try {
            const response = await fetch(`${API_BASE_URL}/users/${authData.userId}`);
            if (!response.ok) {
              console.warn('Kaydedilmiş kullanıcı ID doğrulanamadı, oturum yenileniyor');
              logout();
            }
          } catch (error) {
            console.error('Kullanıcı ID doğrulama hatası:', error);
            // Çevrimdışı modda çalışıyorsa, kullanıcıyı çıkış yapmaya zorlama
          }
        }
      }
      
      // Görüntülenen algoritmaları yükle
      const viewedAlgosJson = await AsyncStorage.getItem(VIEWED_ALGOS_KEY);
      if (viewedAlgosJson) {
        setViewedAlgorithms(JSON.parse(viewedAlgosJson));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Kimlik bilgileri yüklenemedi:', error);
      setIsLoading(false);
    }
  };

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
    // AsyncStorage'dan da temizle
    AsyncStorage.removeItem(VIEWED_ALGOS_KEY).catch(err => {
      console.error('Görüntülenen algoritmalar temizlenemedi:', err);
    });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setUserId('');
    clearViewedAlgorithms();
    // Oturum bilgilerini sil
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(err => {
      console.error('Oturum bilgileri temizlenemedi:', err);
    });
  };

  // Uygulama başladığında kaydedilmiş kimlik bilgilerini yükle
  useEffect(() => {
    loadAuthState();
  }, []);

  // Kimlik bilgileri değiştiğinde kaydet
  useEffect(() => {
    if (!isLoading) {
      saveAuthState();
    }
  }, [isLoggedIn, username, userId]);

  // MongoDB bağlantısı server.js'e taşındı

  if (isLoading) {
    // Uygulama yüklenirken Splash ekranını göster
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'white' },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

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
      logout,
      saveAuthState
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
        
        {/* Chatbot Tetikleyici - Tüm ekranlarda görünür */}
        <ChatBotTrigger />
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default App;
