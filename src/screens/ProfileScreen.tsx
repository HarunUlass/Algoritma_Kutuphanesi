import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { AuthContext, Algorithm } from '../../App';

const ProfileScreen = ({ navigation }: any) => {
  const { username, isLoggedIn, viewedAlgorithms, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkış Yap',
          onPress: () => {
            logout();
            navigation.navigate('Home');
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderAlgorithmItem = (algorithm: Algorithm) => (
    <TouchableOpacity
      key={algorithm.id}
      style={styles.algorithmItem}
      onPress={() => navigation.navigate('AlgorithmDetail', { algorithm })}
    >
      <View style={styles.algorithmContent}>
        <Text style={styles.algorithmTitle}>{algorithm.title}</Text>
        <Text style={styles.algorithmDescription} numberOfLines={1}>
          {algorithm.description}
        </Text>
      </View>
      <View style={styles.algorithmArrow}>
        <Text>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.backButton} />
        </View>
        
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInText}>Profilinize erişmek için giriş yapın</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageText}>
              {username ? username.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.usernameText}>{username || 'Kullanıcı'}</Text>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Son Görüntülenen Algoritmalar</Text>
          {viewedAlgorithms.length > 0 ? (
            <View style={styles.algorithmList}>
              {viewedAlgorithms.map(algorithm => renderAlgorithmItem(algorithm))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Henüz hiçbir algoritma görüntülemediniz
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#6c5ce7',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  algorithmList: {
    gap: 10,
  },
  algorithmItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  algorithmContent: {
    flex: 1,
  },
  algorithmTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  algorithmDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  algorithmArrow: {
    marginLeft: 10,
  },
  emptyStateContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#95a5a6',
    fontSize: 16,
    textAlign: 'center',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen; 