import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../../App';

const { width } = Dimensions.get('window');

// Yeni kategoriler
const categories = [
  {
    id: '1',
    title: 'Veri Yapıları',
    icon: '🏗️',
    description: 'Diziler, Bağlı Listeler, Ağaçlar, Hash Tabloları ve daha fazlası',
    color: '#3498db',
    subCategories: ['Diziler', 'Bağlı Listeler', 'Ağaçlar', 'Hash Tabloları', 'Yığınlar ve Kuyruklar']
  },
  {
    id: '2',
    title: 'Derin Öğrenme',
    icon: '🧠',
    description: 'Yapay Sinir Ağları, CNN, RNN ve derin öğrenme mimarileri',
    color: '#9b59b6',
    subCategories: ['Sinir Ağları', 'CNN', 'RNN', 'Transformers', 'GAN']
  },
  {
    id: '3',
    title: 'Makine Öğrenmesi',
    icon: '🤖',
    description: 'Regresyon, Sınıflandırma, Kümeleme ve diğer ML algoritmaları',
    color: '#e74c3c',
    subCategories: ['Denetimli Öğrenme', 'Denetimsiz Öğrenme', 'Pekiştirmeli Öğrenme']
  },
  {
    id: '4',
    title: 'Doğal Dil İşleme',
    icon: '💬',
    description: 'Metin işleme, Dil modelleri ve NLP teknikleri',
    color: '#2ecc71',
    subCategories: ['Tokenizasyon', 'Vektör Modeller', 'Duygu Analizi', 'Makine Çevirisi']
  },
  {
    id: '5',
    title: 'Makine Görünümü',
    icon: '👁️',
    description: 'Görüntü işleme, Nesne tanıma ve diğer CV teknikleri',
    color: '#f39c12',
    subCategories: ['Görüntü İşleme', 'Nesne Tespiti', 'Segmentasyon', '3D Görüntüleme']
  },
];

const HomeScreen = ({ navigation }: any) => {
  const { isLoggedIn, setIsLoggedIn, username } = useContext(AuthContext);

  const renderCategoryItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.categoryItem, { backgroundColor: item.color + '15' }]}
      onPress={() => navigation.navigate('AlgorithmList', { category: item })}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Text style={styles.categoryIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <Text style={styles.categoryDescription}>{item.description}</Text>
      <View style={styles.subCategoriesContainer}>
        {item.subCategories.slice(0, 3).map((subCat: string, index: number) => (
          <View key={index} style={styles.subCategoryTag}>
            <Text style={styles.subCategoryText}>{subCat}</Text>
          </View>
        ))}
        {item.subCategories.length > 3 && (
          <View style={styles.moreTag}>
            <Text style={styles.moreTagText}>+{item.subCategories.length - 3}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF8C00" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Algoritma Kütüphanesi</Text>
        {!isLoggedIn ? (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Giriş / Kaydol</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>
              {username ? username.charAt(0).toUpperCase() : '👤'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Algoritma Ara...</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Section */}
      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>Öne Çıkanlar</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
        >
          <TouchableOpacity style={styles.featuredCard}>
            <View style={styles.featuredImage}>
              <Text style={styles.featuredContent}>🔍</Text>
            </View>
            <Text style={styles.featuredTitle}>Arama Algoritmaları</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featuredCard}>
            <View style={styles.featuredImage}>
              <Text style={styles.featuredContent}>🔄</Text>
            </View>
            <Text style={styles.featuredTitle}>Sıralama Algoritmaları</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featuredCard}>
            <View style={styles.featuredImage}>
              <Text style={styles.featuredContent}>📊</Text>
            </View>
            <Text style={styles.featuredTitle}>Grafik Algoritmaları</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Categories Section */}
      <Text style={styles.sectionTitle}>Kategoriler</Text>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FF8C00',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
    fontSize: 16,
  },
  searchPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  featuredContainer: {
    paddingHorizontal: 20,
  },
  featuredScroll: {
    paddingBottom: 10,
  },
  featuredCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginRight: 15,
    width: 280,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featuredImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    padding: 15,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  featuredDifficulty: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  easyText: {
    color: '#2ecc71',
  },
  mediumText: {
    color: '#f39c12',
  },
  hardText: {
    color: '#e74c3c',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryIcon: {
    fontSize: 30,
    color: 'white',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    lineHeight: 20,
  },
  subCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subCategoryTag: {
    backgroundColor: '#ecf0f1',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  subCategoryText: {
    fontSize: 12,
    color: '#34495e',
  },
  moreTag: {
    backgroundColor: '#bdc3c7',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  moreTagText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
});

export default HomeScreen; 