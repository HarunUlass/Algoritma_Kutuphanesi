import React, { useContext, useState, useEffect } from 'react';
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
  TextInput,
  Keyboard,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AuthContext, API_BASE_URL } from '../../App';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// AlgorithmListScreen'den algoritma verilerini import ediyoruz
import { 
  dataStructuresSubCategories,
  deepLearningSubCategories,
  machineLearningSubCategories,
  allCategories,
  CategoryMap,
  Algorithm
} from './AlgorithmListScreen';

const { width } = Dimensions.get('window');

// Yeni kategoriler
const categories = [
  {
    id: '1',
    title: 'Veri Yapıları',
    iconName: 'storage',
    description: 'Diziler, Bağlı Listeler, Ağaçlar, Hash Tabloları ve daha fazlası',
    color: '#3498db',
    subCategories: ['Diziler', 'Bağlı Listeler', 'Ağaçlar', 'Hash Tabloları', 'Yığınlar ve Kuyruklar']
  },
  {
    id: '2',
    title: 'Derin Öğrenme',
    iconName: 'memory',
    description: 'Yapay Sinir Ağları, CNN, RNN ve derin öğrenme mimarileri',
    color: '#9b59b6',
    subCategories: ['Sinir Ağları', 'CNN', 'RNN', 'Transformers', 'GAN']
  },
  {
    id: '3',
    title: 'Makine Öğrenmesi',
    iconName: 'auto-awesome',
    description: 'Regresyon, Sınıflandırma, Kümeleme ve diğer ML algoritmaları',
    color: '#e74c3c',
    subCategories: ['Denetimli Öğrenme', 'Denetimsiz Öğrenme', 'Pekiştirmeli Öğrenme']
  },
  {
    id: '4',
    title: 'Doğal Dil İşleme',
    iconName: 'chat',
    description: 'Metin işleme, Dil modelleri ve NLP teknikleri',
    color: '#2ecc71',
    subCategories: ['Tokenizasyon', 'Vektör Modeller', 'Duygu Analizi', 'Makine Çevirisi']
  },
  {
    id: '5',
    title: 'Makine Görünümü',
    iconName: 'remove-red-eye',
    description: 'Görüntü işleme, Nesne tanıma ve diğer CV teknikleri',
    color: '#f39c12',
    subCategories: ['Görüntü İşleme', 'Nesne Tespiti', 'Segmentasyon', '3D Görüntüleme']
  },
];

// Tüm kategori verilerini birleştiren nesne - allCategories'i kullanıyoruz
const algorithmsByCategory = allCategories;

const HomeScreen = ({ navigation }: any) => {
  const { isLoggedIn, setIsLoggedIn, username } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    loadRecentSearches();
    if (isLoggedIn) {
      fetchQuizzes();
    }
  }, [isLoggedIn]);

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem('recentSearches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches', error);
    }
  };

  const saveSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const updatedSearches = [
        query,
        ...recentSearches.filter(item => item !== query)
      ].slice(0, 5); // Keep only 5 most recent searches
      
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving search', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: any[] = [];

    // Kategorilerde arama
    categories.forEach(category => {
      // Kategori başlıklarında arama
      if (category.title.toLowerCase().includes(query.toLowerCase())) {
        results.push({ ...category, type: 'category' });
      }
      
      // Alt kategorilerde arama
      const matchingSubcategories = category.subCategories.filter(
        sub => sub.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchingSubcategories.length > 0) {
        results.push({ 
          ...category, 
          type: 'category',
          matchedSubcategories: matchingSubcategories
        });
      }
      
      // Algoritmalarda arama
      const categoryAlgorithms = allCategories[category.id];
      if (categoryAlgorithms) {
        Object.keys(categoryAlgorithms).forEach(subCategory => {
          const algorithms = categoryAlgorithms[subCategory];
          const matchingAlgorithms = algorithms.filter(
            (algo: Algorithm) => algo.title.toLowerCase().includes(query.toLowerCase())
          );
          
          if (matchingAlgorithms.length > 0) {
            matchingAlgorithms.forEach((algo: Algorithm) => {
              results.push({
                ...algo,
                categoryId: category.id,
                categoryTitle: category.title,
                subCategory: subCategory,
                type: 'algorithm'
              });
            });
          }
        });
      }
    });
    
    setSearchResults(results);
  };

  const performSearch = () => {
    saveSearch(searchQuery);
    setShowSearchModal(false);
    setIsSearching(false);
    
    // Navigate to search results or filter the current page
    if (searchResults.length > 0 && searchQuery.trim()) {
      // You could navigate to a dedicated results page or just show results on the current page
      // For now, we'll close the search modal and the results will be used as needed
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem('recentSearches');
      setRecentSearches([]);
    } catch (error) {
      console.error('Error clearing recent searches', error);
    }
  };

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes`);
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        console.error('Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const renderSearchResult = ({ item }: any) => {
    if (item.type === 'category') {
      return (
        <TouchableOpacity 
          style={styles.searchResultItem}
          onPress={() => {
            saveSearch(searchQuery);
            setShowSearchModal(false);
            setIsSearching(false);
            // Kategori detayına git
            navigation.navigate('AlgorithmList', { category: item });
          }}
        >
          <View style={[styles.searchResultIconContainer, { backgroundColor: item.color }]}>
            <Text style={styles.searchResultIconText}>{item.title.charAt(0)}</Text>
          </View>
          <View style={styles.searchResultContent}>
            <Text style={styles.searchResultTitle}>{item.title}</Text>
            {item.matchedSubcategories && (
              <Text style={styles.searchResultSubtitle}>
                {item.matchedSubcategories.slice(0, 2).join(', ')}
                {item.matchedSubcategories.length > 2 ? '...' : ''}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'algorithm') {
      return (
        <TouchableOpacity 
          style={styles.searchResultItem}
          onPress={() => {
            saveSearch(searchQuery);
            setShowSearchModal(false);
            setIsSearching(false);
            // Algoritma detayına git
            navigation.navigate('AlgorithmDetail', { algorithm: item });
          }}
        >
          <View style={[styles.searchResultIconContainer, { backgroundColor: '#3498db' }]}>
            <Text style={styles.searchResultIconText}>A</Text>
          </View>
          <View style={styles.searchResultContent}>
            <Text style={styles.searchResultTitle}>{item.title}</Text>
            <Text style={styles.searchResultSubtitle}>
              {item.categoryTitle} / {item.subCategory}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  const renderCategoryItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.categoryItem, { backgroundColor: item.color + '15' }]}
      onPress={() => navigation.navigate('AlgorithmList', { category: item })}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Text style={styles.categoryIconText}>{item.title.charAt(0)}</Text>
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

  const renderQuizItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => {
        if (isLoggedIn) {
          // Quiz ekranına yönlendir
          navigation.navigate('Quiz', { 
            quizId: item._id,
            quizTitle: item.title,
            timeLimit: item.timeLimit
          });
        }
      }}
    >
      <View style={[styles.quizDifficultyBadge, {
        backgroundColor: item.difficulty === 'Kolay' ? '#27ae60' : 
                         item.difficulty === 'Orta' ? '#f39c12' : '#e74c3c'
      }]}>
        <Text style={styles.quizDifficultyText}>{item.difficulty}</Text>
      </View>
      <View style={styles.quizContent}>
        <Text style={styles.quizTitle}>{item.title}</Text>
        <Text style={styles.quizDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.quizFooter}>
          <Text style={styles.quizPoints}>{item.totalPoints} Puan</Text>
          <Text style={styles.quizTime}>{item.timeLimit} dakika</Text>
        </View>
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
            {username ? (
              <Text style={styles.profileButtonText}>
                {username.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Text style={styles.profileButtonText}>P</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.searchContainer} 
        onPress={() => setShowSearchModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Algoritma veya kategori ara...</Text>
        </View>
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowSearchModal(false);
          setIsSearching(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                setShowSearchModal(false);
                setIsSearching(false);
                setSearchQuery('');
              }}
            >
              <Text style={{fontSize: 24, color: '#333'}}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.modalSearchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Algoritma veya kategori ara..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                  setIsSearching(text.length > 0);
                }}
                autoFocus={true}
                returnKeyType="search"
                onSubmitEditing={performSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setIsSearching(false);
                  }}
                >
                  <Text style={{fontSize: 20, color: '#999'}}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isSearching ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `search-result-${index}`}
              renderItem={renderSearchResult}
              ListEmptyComponent={
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>Sonuç bulunamadı</Text>
                </View>
              }
            />
          ) : (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.recentSearchesHeader}>
                <Text style={styles.recentSearchesTitle}>Son Aramalar</Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearSearchesButton}>Temizle</Text>
                  </TouchableOpacity>
                )}
              </View>
              {recentSearches.length > 0 ? (
                <FlatList
                  data={recentSearches}
                  keyExtractor={(item, index) => `search-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.recentSearchItem}
                      onPress={() => {
                        setSearchQuery(item);
                        handleSearch(item);
                        setIsSearching(true);
                      }}
                    >
                      <Text style={{fontSize: 20, color: '#999', marginRight: 10}}>⏱</Text>
                      <Text style={styles.recentSearchText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={styles.noRecentSearchesText}>Henüz arama yapmadınız</Text>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Featured Section */}
        <View style={styles.featuredContainer}>
          <Text style={styles.sectionTitle}>Öne Çıkanlar</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {/* Diziler - Veri Yapıları kategorisinden */}
            <TouchableOpacity 
              style={styles.featuredCard}
              onPress={() => {
                // İlgili alt kategoriye yönlendir
                navigation.navigate('AlgorithmList', { 
                  category: categories[0],
                  initialSubCategory: 'Diziler'
                });
              }}
            >
              <View style={[styles.featuredImage, { backgroundColor: categories[0].color }]}>
                <Text style={styles.featuredIconText}>D</Text>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>Diziler</Text>
                <Text style={styles.featuredDescription}>Temel veri yapısı</Text>
              </View>
            </TouchableOpacity>

            {/* Bağlı Listeler - Veri Yapıları kategorisinden */}
            <TouchableOpacity 
              style={styles.featuredCard}
              onPress={() => {
                navigation.navigate('AlgorithmList', { 
                  category: categories[0],
                  initialSubCategory: 'Bağlı Listeler'
                });
              }}
            >
              <View style={[styles.featuredImage, { backgroundColor: categories[0].color }]}>
                <Text style={styles.featuredIconText}>B</Text>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>Bağlı Listeler</Text>
                <Text style={styles.featuredDescription}>Dinamik veri yapısı</Text>
              </View>
            </TouchableOpacity>

            {/* Sinir Ağları - Derin Öğrenme kategorisinden */}
            <TouchableOpacity 
              style={styles.featuredCard}
              onPress={() => {
                navigation.navigate('AlgorithmList', { 
                  category: categories[1],
                  initialSubCategory: 'Sinir Ağları'
                });
              }}
            >
              <View style={[styles.featuredImage, { backgroundColor: categories[1].color }]}>
                <Text style={styles.featuredIconText}>S</Text>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>Sinir Ağları</Text>
                <Text style={styles.featuredDescription}>Derin öğrenmenin temeli</Text>
              </View>
            </TouchableOpacity>

            {/* Denetimli Öğrenme - Makine Öğrenmesi kategorisinden */}
            <TouchableOpacity 
              style={styles.featuredCard}
              onPress={() => {
                navigation.navigate('AlgorithmList', { 
                  category: categories[2],
                  initialSubCategory: 'Denetimli Öğrenme'
                });
              }}
            >
              <View style={[styles.featuredImage, { backgroundColor: categories[2].color }]}>
                <Text style={styles.featuredIconText}>D</Text>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>Denetimli Öğrenme</Text>
                <Text style={styles.featuredDescription}>Etiketli verilerle öğrenme</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Quizzes Section */}
        <View style={styles.quizzesContainer}>
          <Text style={styles.sectionTitle}>Testler</Text>
          
          {isLoggedIn ? (
            loadingQuizzes ? (
              <ActivityIndicator size="large" color="#FF8C00" style={{marginVertical: 20}} />
            ) : quizzes.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={quizzes}
                keyExtractor={(item) => item._id}
                renderItem={renderQuizItem}
                contentContainerStyle={styles.quizzesScroll}
              />
            ) : (
              <View style={styles.noQuizzesContainer}>
                <Text style={styles.noQuizzesText}>Henüz test bulunmamaktadır</Text>
              </View>
            )
          ) : (
            <View style={styles.loginMessageContainer}>
              <Text style={styles.loginMessageText}>
                Testleri görüntülemek ve rozetler kazanmak için giriş yapın
              </Text>
              <TouchableOpacity 
                style={styles.loginMessageButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginMessageButtonText}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>Kategoriler</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          scrollEnabled={false}
        />
      </ScrollView>
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
  categoryIconText: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    padding: 5,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    padding: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  searchResultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchResultIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
  },
  recentSearchesContainer: {
    padding: 10,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearSearchesButton: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  recentSearchText: {
    fontSize: 16,
    color: '#333',
  },
  noRecentSearchesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  featuredIconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  quizzesContainer: {
    marginVertical: 10,
  },
  quizzesScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  quizCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 15,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  quizDifficultyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 1,
  },
  quizDifficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quizContent: {
    padding: 15,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginRight: 50, // Leave space for the difficulty badge
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quizPoints: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  quizTime: {
    fontSize: 13,
    color: '#999',
  },
  noQuizzesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noQuizzesText: {
    fontSize: 16,
    color: '#666',
  },
  loginMessageContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  loginMessageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  loginMessageButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginMessageButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen; 