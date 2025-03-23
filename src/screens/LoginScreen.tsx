import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { AuthContext, loadLogo } from '../../App';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { setIsLoggedIn, setUsername: setContextUsername } = useContext(AuthContext);
  const [logoSource, setLogoSource] = useState(null);

  useEffect(() => {
    // Logo kaynağını ayarla
    const logo = loadLogo();
    if (logo) {
      setLogoSource(logo);
    }
  }, []);

  const handleLogin = () => {
    // Basit kontroller
    if (username.length === 0 || password.length === 0) {
      Alert.alert('Uyarı', 'Lütfen kullanıcı adı ve şifre girin');
      return;
    }
    
    // Giriş başarılı varsayalım ve kullanıcı durumunu güncelleyelim
    setIsLoggedIn(true);
    setContextUsername(username);
    navigation.navigate('Home');
  };

  const handleSignUp = () => {
    // Basit kontroller
    if (username.length === 0 || password.length === 0) {
      Alert.alert('Uyarı', 'Lütfen kullanıcı adı ve şifre girin');
      return;
    }
    
    // Kayıt başarılı varsayalım ve kullanıcı durumunu güncelleyelim
    setIsLoggedIn(true);
    setContextUsername(username);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Ana Sayfa</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          {/* Logo */}
          {logoSource ? (
            <Image 
              source={logoSource} 
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.fallbackLogo}>
              <Text style={styles.fallbackText}>AK</Text>
            </View>
          )}
          <Text style={styles.logoText}>Algoritma Kütüphanesi</Text>
          <Text style={styles.tagline}>
            {isSignUp 
              ? 'Algoritma dünyasına katılın'
              : 'Algoritmalar ve Veri Yapıları Dünyasına Hoş Geldiniz'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı Adı"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />
          
          {isSignUp ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.signUpButton]} 
              onPress={handleSignUp}
            >
              <Text style={styles.actionButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.loginButton]} 
              onPress={handleLogin}
            >
              <Text style={styles.actionButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.switchModeButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchModeText}>
              {isSignUp
                ? 'Zaten hesabınız var mı? Giriş yapın'
                : 'Hesabınız yok mu? Kayıt olun'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Özellikler</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.featureIconText}>📚</Text>
              </View>
              <Text style={styles.featureText}>100+ Algoritma ve Veri Yapısı</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFA500' }]}>
                <Text style={styles.featureIconText}>🎬</Text>
              </View>
              <Text style={styles.featureText}>Görsel Algoritma Simülasyonları</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FF8C00' }]}>
                <Text style={styles.featureIconText}>💻</Text>
              </View>
              <Text style={styles.featureText}>Kapsamlı Kod Örnekleri</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FF4500' }]}>
                <Text style={styles.featureIconText}>📊</Text>
              </View>
              <Text style={styles.featureText}>Algoritma Karmaşıklık Analizleri</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: '500',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 15,
  },
  fallbackLogo: {
    width: 150,
    height: 150,
    backgroundColor: '#FF8C00',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  fallbackText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  logoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#333',
  },
  actionButton: {
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#FF8C00',
  },
  signUpButton: {
    backgroundColor: '#FF4500',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchModeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#FF8C00',
    fontSize: 15,
    fontWeight: '500',
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
});

export default LoginScreen; 