import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { AuthContext, Algorithm, API_BASE_URL } from '../../App';
import { api } from '../services/apiClient';

// Profil düzenleme modalı
interface EditProfileProps {
  visible: boolean;
  onClose: () => void;
  onSave: (userData: UserProfileData) => void;
  initialData: UserProfileData;
  loading: boolean;
}

interface UserProfileData {
  username: string;
  email: string;
  password?: string;
  currentPassword?: string;
}

const EditProfile = ({ visible, onClose, onSave, initialData, loading }: EditProfileProps) => {
  const [userData, setUserData] = useState<UserProfileData>({
    username: initialData.username || '',
    email: initialData.email || '',
    password: '',
    currentPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof UserProfileData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    // Hata varsa sil
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Kullanıcı adı kontrolü
    if (!userData.username || userData.username.trim().length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    }
    
    // Email kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    // Şifre kontrolü
    if (userData.password) {
      if (userData.password.length < 6) {
        newErrors.password = 'Şifre en az 6 karakter olmalıdır';
      }
      
      if (!userData.currentPassword) {
        newErrors.currentPassword = 'Şifre değiştirmek için mevcut şifreyi girmelisiniz';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(userData);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profil Düzenle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
              <TextInput
                style={[styles.textInput, errors.username ? styles.inputError : null]}
                value={userData.username}
                onChangeText={(text) => updateField('username', text)}
                placeholder="Kullanıcı adınız"
                autoCapitalize="none"
              />
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <TextInput
                style={[styles.textInput, errors.email ? styles.inputError : null]}
                value={userData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="E-posta adresiniz"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mevcut Şifre</Text>
              <TextInput
                style={[styles.textInput, errors.currentPassword ? styles.inputError : null]}
                value={userData.currentPassword}
                onChangeText={(text) => updateField('currentPassword', text)}
                placeholder="Şifre değiştirmek için mevcut şifrenizi girin"
                secureTextEntry
              />
              {errors.currentPassword ? (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Yeni Şifre (İsteğe Bağlı)</Text>
              <TextInput
                style={[styles.textInput, errors.password ? styles.inputError : null]}
                value={userData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Boş bırakırsanız değişmez"
                secureTextEntry
              />
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, loading ? styles.disabledButton : null]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = ({ navigation }: any) => {
  const auth = useContext(AuthContext);
  const { isLoggedIn, viewedAlgorithms, logout, username, setUsername } = auth;
  const userId = auth.userId;
  
  const [recentlyViewedAlgorithms, setRecentlyViewedAlgorithms] = useState<any[]>([]);
  const [recentlyViewedLoading, setRecentlyViewedLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    username: username || '',
    email: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && userId) {
      loadUserProfile();
      loadRecentlyViewedAlgorithms();
    }
  }, [isLoggedIn, userId]);

  // Kullanıcı kimliği kontrolü
  const checkUserIdBeforeAction = () => {
    if (!userId) {
      console.error('Kullanıcı kimliği bulunamadı');
      Alert.alert(
        'Oturum Hatası',
        'Kullanıcı kimliğiniz bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.',
        [
          {
            text: 'Çıkış Yap',
            onPress: () => {
              logout();
              navigation.navigate('Login');
            }
          }
        ]
      );
      return false;
    }
    return true;
  };

  const loadUserProfile = async () => {
    try {
      if (!userId) {
        console.error('loadUserProfile: UserId tanımlı değil');
        Alert.alert('Hata', 'Kullanıcı bilgilerinize erişilemiyor. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const data = await api.users.getProfile(userId);
      setUserProfile({
        username: data.username,
        email: data.email,
      });
    } catch (error) {
      console.error('Kullanıcı bilgileri yükleme hatası:', error);
      Alert.alert(
        'Hata',
        'Kullanıcı bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const updateUserProfile = async (userData: UserProfileData) => {
    try {
      setUpdateLoading(true);
      
      if (!userId) {
        console.error('updateUserProfile: UserId tanımlı değil');
        throw new Error('UserId tanımlı değil');
      }
      
      console.log('Güncelleme başlatılıyor - UserID:', userId);
      
      // Sadece değişen alanları içeren veri gönder
      const updateData: any = {};
      if (userData.username !== userProfile.username) updateData.username = userData.username;
      if (userData.email !== userProfile.email) updateData.email = userData.email;
      if (userData.password) {
        updateData.password = userData.password;
        updateData.currentPassword = userData.currentPassword;
      }
      
      // Değişen bir şey yoksa işlemi iptal et
      if (Object.keys(updateData).length === 0) {
        setEditModalVisible(false);
        return;
      }
      
      console.log('Gönderilecek veriler:', JSON.stringify(updateData));
      
      const data = await api.users.updateProfile(userId, updateData);
      console.log('Sunucu yanıtı:', JSON.stringify(data));
      
      if (!data.error) {
        // Profil başarıyla güncellendi
        setUserProfile({
          ...userProfile,
          username: data.username,
          email: data.email,
        });
        
        // Auth context'deki kullanıcı adını güncelle
        setUsername(data.username);
        
        // Modal'ı kapat
        setEditModalVisible(false);
        
        // Başarı mesajı göster
        Alert.alert(
          'Başarılı',
          'Profil bilgileriniz güncellendi',
          [{ text: 'Tamam' }]
        );
      } else {
        // Hata mesajı göster
        Alert.alert(
          'Hata',
          data.error || 'Profil güncellenirken bir hata oluştu',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      Alert.alert(
        'Hata',
        'Profil güncellenirken bir hata oluştu. Lütfen tekrar giriş yapıp deneyiniz.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const loadRecentlyViewedAlgorithms = async () => {
    try {
      if (!userId) {
        console.error('loadRecentlyViewedAlgorithms: UserId tanımlı değil');
        return;
      }
      
      setRecentlyViewedLoading(true);
      const data = await api.users.getRecentlyViewedAlgorithms(userId);
      setRecentlyViewedAlgorithms(data);
    } catch (error) {
      console.error('Son görüntülenen algoritmaları yükleme hatası:', error);
    } finally {
      setRecentlyViewedLoading(false);
    }
  };

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

  const renderAlgorithmItem = (algorithm: any) => (
    <TouchableOpacity
      key={algorithm.id}
      style={styles.algorithmItem}
      onPress={() => navigation.navigate('AlgorithmDetail', { 
        algorithmId: algorithm.id,
        title: algorithm.title
      })}
    >
      <View style={styles.algorithmContent}>
        <Text style={styles.algorithmTitle}>{algorithm.title}</Text>
        <Text style={styles.algorithmDescription} numberOfLines={1}>
          {algorithm.description}
        </Text>
        {algorithm.lastViewed && (
          <Text style={styles.algorithmLastViewed}>
            Son görüntülenme: {new Date(algorithm.lastViewed).toLocaleDateString('tr-TR')}
          </Text>
        )}
      </View>
      <View style={styles.algorithmArrow}>
        <Text>→</Text>
      </View>
    </TouchableOpacity>
  );

  // Profil düzenleme modalını gösterme
  const handleEditProfile = () => {
    if (checkUserIdBeforeAction()) {
      setEditModalVisible(true);
    }
  };

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
      <EditProfile
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={updateUserProfile}
        initialData={userProfile}
        loading={updateLoading}
      />
      
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
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Text style={styles.profileImageText}>
                {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.usernameText}>{userProfile.username || 'Kullanıcı'}</Text>
              <Text style={styles.emailText}>{userProfile.email || 'Email yükleniyor...'}</Text>
            </View>
          </View>
          
          <View style={styles.profileActions}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Profili Düzenle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Son Görüntülenen Algoritmalar</Text>
          {recentlyViewedAlgorithms.length > 0 ? (
            <View style={styles.algorithmList}>
              {recentlyViewedAlgorithms.map(algorithm => renderAlgorithmItem(algorithm))}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 15,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImageText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  algorithmList: {
    width: '100%',
  },
  algorithmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  algorithmContent: {
    flex: 1,
  },
  algorithmTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  algorithmDescription: {
    fontSize: 14,
    color: '#666',
  },
  algorithmArrow: {
    marginLeft: 10,
  },
  algorithmLastViewed: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ProfileScreen; 