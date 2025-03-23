import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { loadLogo } from '../../App';

const SplashScreen = ({ navigation }: any) => {
  const [logoSource, setLogoSource] = useState(null);

  useEffect(() => {
    // Logo kaynağını ayarla
    const logo = loadLogo();
    if (logo) {
      setLogoSource(logo);
    }

    // 2 saniye sonra ana ekrana geçiş yap
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.logoContainer}>
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
        <Text style={styles.title}>Algoritma Kütüphanesi</Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 20,
  },
  fallbackLogo: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: '#FF8C00',
    borderRadius: width * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  fallbackText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});

export default SplashScreen; 