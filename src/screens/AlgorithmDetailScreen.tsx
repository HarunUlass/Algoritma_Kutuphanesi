import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../../App';
import AlgorithmVisualization from '../components/AlgorithmVisualization';
import GraphVisualization from '../components/GraphVisualization';

// API URL
const API_URL = 'http://10.0.2.2:3000/api'; // Android Emulator için localhost

// Example implementation of Bubble Sort in JavaScript
const bubbleSortCode = `function bubbleSort(arr) {
  const n = arr.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Compare adjacent elements
      if (arr[j] > arr[j + 1]) {
        // Swap them if they are in the wrong order
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  
  return arr;
}`;

// Example implementation of Binary Search in JavaScript
const binarySearchCode = `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    // Find the middle index
    const mid = Math.floor((left + right) / 2);
    
    // Check if target is at mid
    if (arr[mid] === target) {
      return mid;
    }
    
    // If target is greater, ignore left half
    if (arr[mid] < target) {
      left = mid + 1;
    } 
    // If target is smaller, ignore right half
    else {
      right = mid - 1;
    }
  }
  
  // Target not found
  return -1;
}`;

const codeExamples: { [key: string]: { javascript: string } } = {
  'Bubble Sort': {
    javascript: bubbleSortCode,
    // We could add other languages like Python, Java, etc.
  },
  'Binary Search': {
    javascript: binarySearchCode,
  },
};

interface ApiAlgorithm {
  title: string;
  complexity: {
    time: {
      best: string;
      average: string;
      worst: string;
    };
    space: string;
  };
  stability: string;
  description: string;
  steps: string[];
  pros: string[];
  cons: string[];
  exampleCode: {
    language: string;
    code: string;
  };
}

interface AlgorithmDetail {
  title: string;
  complexity?: {
    time?: {
      best: string;
      average: string;
      worst: string;
    };
    space: string;
  };
  stability?: string;
  prerequisites?: string;
  description: string;
  steps: string[] | { [key: string]: string[] } | any; // Farklı adım formatlarını destekle
  pros: string[];
  cons: string[];
}

// Statik algoritma detayları (API'den gelene kadar bunlar gösterilecek)
const algorithmDetails: { [key: string]: AlgorithmDetail } = {
  'Binary Search': {
    title: 'Binary Search',
    complexity: {
      time: {
        best: 'O(1)',
        average: 'O(log n)',
        worst: 'O(log n)',
      },
      space: 'O(1)',
    },
    prerequisites: 'Sıralı bir dizi gerektirir.',
    description: 'Binary Search, sıralı bir dizide hedef değeri bulmak için dizinin ortasından başlayarak arama aralığını her adımda yarıya indiren etkili bir arama algoritmasıdır.',
    steps: [
      'Dizinin ortasındaki elemana bak.',
      'Eğer hedef değer bu elemana eşitse, arama tamamlandı.',
      'Eğer hedef değer ortadaki elemandan küçükse, sol yarıda aramaya devam et.',
      'Eğer hedef değer ortadaki elemandan büyükse, sağ yarıda aramaya devam et.',
      'Arama aralığı boş olana kadar yukarıdaki adımları tekrarla.',
    ],
    pros: [
      'Lineer arama (O(n)) ile karşılaştırıldığında çok daha hızlıdır.',
      'Büyük veri kümeleri için idealdir.',
    ],
    cons: [
      'Yalnızca sıralı dizilerde çalışır.',
      'Dinamik veri yapıları için uygun değildir (elemanlar sık sık eklenip çıkarılıyorsa).',
    ],
  },
};

const AlgorithmDetailScreen = ({ route, navigation }: any) => {
  const { algorithm } = route.params;
  const [activeTab, setActiveTab] = useState('description');
  const { isLoggedIn, addViewedAlgorithm } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [algorithmData, setAlgorithmData] = useState<ApiAlgorithm | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // API'den algoritma detayını getir
  useEffect(() => {
    const fetchAlgorithmDetail = async () => {
      try {
        setLoading(true);
        // Algoritma adını temizle (trim) ve encode et
        const encodedTitle = encodeURIComponent(algorithm.title.trim());
        const apiUrl = `${API_URL}/algorithms/${encodedTitle}`;
        
        console.log('Fetching algorithm details from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Algoritma bulunamadı');
          }
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`API bağlantı hatası: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched algorithm data:', JSON.stringify(data).substring(0, 100) + '...');
        setAlgorithmData(data);
      } catch (err: any) {
        console.error('Algoritma detayı getirme hatası:', err);
        setError(err.message || 'Bir hata oluştu');
        
        // API çalışmazsa statik verileri göster (geliştirme aşamasında yardımcı olur)
        if (algorithmDetails[algorithm.title as keyof typeof algorithmDetails]) {
          console.log('Yedek olarak statik algoritma detayları kullanılıyor');
        } else {
          Alert.alert('Hata', 'Algoritma detayları yüklenirken bir hata oluştu.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlgorithmDetail();
  }, [algorithm.title]);
  
  // Statik veya API'den gelen detayları kullan
  const details = algorithmData || algorithmDetails[algorithm.title as keyof typeof algorithmDetails] || {
    title: algorithm.title,
    description: 'Bu algoritma için ayrıntılı bilgi bulunmamaktadır.',
    steps: [],
    pros: [],
    cons: [],
  };
  
  // Kod örneğini statik örneklerden veya API'den al
  const codeExample = algorithmData?.exampleCode?.code || 
                     codeExamples[algorithm.title as keyof typeof codeExamples]?.javascript || 
                     'Bu algoritma için kod örneği bulunmamaktadır.';

  // Kullanıcı giriş yapmışsa görüntülenen algoritmayı kaydet
  useEffect(() => {
    if (isLoggedIn) {
      addViewedAlgorithm({
        id: algorithm.id,
        title: algorithm.title,
        description: algorithm.description,
        complexity: algorithm.complexity,
        difficulty: algorithm.difficulty
      });
    }
  }, []);

  // Karmaşıklık sınıfına göre renk belirleme
  const getComplexityColor = (complexity: string) => {
    if (complexity.includes('O(1)') || complexity.includes('O(log n)')) {
      return '#27ae60'; // Yeşil - iyi
    } else if (complexity.includes('O(n)') || complexity.includes('O(n log n)')) {
      return '#f39c12'; // Turuncu - orta
    } else {
      return '#e74c3c'; // Kırmızı - kötü
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Algoritma bilgileri yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>{algorithm.title}</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>★</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'description' && styles.activeTab]}
          onPress={() => setActiveTab('description')}
        >
          <Text style={[styles.tabText, activeTab === 'description' && styles.activeTabText]}>Açıklama</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'code' && styles.activeTab]}
          onPress={() => setActiveTab('code')}
        >
          <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>Kod</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'visual' && styles.activeTab]}
          onPress={() => setActiveTab('visual')}
        >
          <Text style={[styles.tabText, activeTab === 'visual' && styles.activeTabText]}>Görselleştirme</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === 'description' && (
          <View style={styles.descriptionContainer}>
            {/* Algoritma özeti bölümü */}
            <View style={styles.summarySection}>
              {/* Stabilite bilgisi */}
              {details.stability && (
                <View style={styles.stabilityContainer}>
                  <Text style={styles.stabilityLabel}>Stabilite:</Text>
                  <Text style={styles.stabilityValue}>{details.stability}</Text>
                </View>
              )}

              {/* Algoritma açıklaması */}
              <Text style={styles.descriptionText}>{details.description}</Text>
            </View>

            {/* Karmaşıklık bölümü */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Karmaşıklık</Text>
              {details.complexity && (
                <View style={styles.complexityContainer}>
                  {details.complexity.time && (
                    <View style={styles.complexityBlock}>
                      <Text style={styles.complexityLabel}>Zaman Karmaşıklığı</Text>
                      <View style={styles.complexityValues}>
                        {details.complexity.time.best && (
                          <View style={styles.complexityItem}>
                            <Text style={styles.complexityType}>En İyi:</Text>
                            <Text style={[
                              styles.complexityValue,
                              { color: getComplexityColor(details.complexity.time.best) }
                            ]}>
                              {details.complexity.time.best}
                            </Text>
                          </View>
                        )}
                        
                        {details.complexity.time.average && (
                          <View style={styles.complexityItem}>
                            <Text style={styles.complexityType}>Ortalama:</Text>
                            <Text style={[
                              styles.complexityValue,
                              { color: getComplexityColor(details.complexity.time.average) }
                            ]}>
                              {details.complexity.time.average}
                            </Text>
                          </View>
                        )}
                        
                        {details.complexity.time.worst && (
                          <View style={styles.complexityItem}>
                            <Text style={styles.complexityType}>En Kötü:</Text>
                            <Text style={[
                              styles.complexityValue,
                              { color: getComplexityColor(details.complexity.time.worst) }
                            ]}>
                              {details.complexity.time.worst}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                  
                  {details.complexity.space && (
                    <View style={styles.complexityBlock}>
                      <Text style={styles.complexityLabel}>Alan Karmaşıklığı</Text>
                      <Text style={[
                        styles.complexityValue,
                        { color: getComplexityColor(details.complexity.space) }
                      ]}>
                        {details.complexity.space}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Adımlar bölümü */}
            {details.steps && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Adımlar</Text>
                <View style={styles.stepsContainer}>
                  {Array.isArray(details.steps) ? (
                    // Adımlar bir dizi ise doğrudan görüntüle
                    details.steps.map((step: string, index: number) => (
                      <View key={index} style={styles.stepItem}>
                        <View style={styles.stepNumberContainer}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))
                  ) : typeof details.steps === 'object' && details.steps !== null ? (
                    // Adımlar bir nesne ise (kategorilere ayrılmış adımlar)
                    Object.entries(details.steps).map(([category, steps]: [string, any], categoryIndex: number) => (
                      <View key={category} style={styles.stepCategory}>
                        <Text style={styles.stepCategoryTitle}>{category.replace('_', ' ')}</Text>
                        {Array.isArray(steps) ? (
                          steps.map((step: string, stepIndex: number) => (
                            <View key={`${category}-${stepIndex}`} style={styles.stepItem}>
                              <View style={styles.stepNumberContainer}>
                                <Text style={styles.stepNumber}>{stepIndex + 1}</Text>
                              </View>
                              <Text style={styles.stepText}>{step}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.stepText}>Adım detayları mevcut değil</Text>
                        )}
                      </View>
                    ))
                  ) : (
                    // Adımlar beklenmeyen bir formatta ise
                    <Text style={styles.stepText}>Adım detayları mevcut değil</Text>
                  )}
                </View>
              </View>
            )}

            {/* Avantajlar ve Dezavantajlar bölümü */}
            {(details.pros || details.cons) && (
              <View style={styles.prosConsContainer}>
                {details.pros && details.pros.length > 0 && (
                  <View style={[styles.section, styles.prosSection]}>
                    <Text style={styles.sectionTitle}>Avantajlar</Text>
                    <View style={styles.prosConsContent}>
                      {details.pros.map((pro: string, index: number) => (
                        <View key={index} style={styles.proItem}>
                          <Text style={styles.prosConsIcon}>✓</Text>
                          <Text style={styles.proConText}>{pro}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {details.cons && details.cons.length > 0 && (
                  <View style={[styles.section, styles.consSection]}>
                    <Text style={styles.sectionTitle}>Dezavantajlar</Text>
                    <View style={styles.prosConsContent}>
                      {details.cons.map((con: string, index: number) => (
                        <View key={index} style={styles.conItem}>
                          <Text style={styles.prosConsIcon}>✕</Text>
                          <Text style={styles.proConText}>{con}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'code' && (
          <View style={styles.codeContainer}>
            <View style={styles.codeTitleContainer}>
              <Text style={styles.codeTitle}>JavaScript</Text>
            </View>
            <ScrollView horizontal style={styles.codeScrollView}>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{codeExample}</Text>
              </View>
            </ScrollView>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kod Açıklaması</Text>
              <Text style={styles.sectionText}>
                Yukarıdaki kod, {algorithm.title} algoritmasının JavaScript ile basit bir uygulamasını gösterir. 
                Algoritmanın temel mantığı ve akışı kod içinde adım adım görülebilir.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'visual' && (
          <View style={styles.visualContainer}>
            {/* Algoritma tipine göre uygun görselleştirme bileşenini göster */}
            {['dijkstra', 'breadth first search', 'depth first search'].includes(algorithm.title.toLowerCase()) ? (
              <GraphVisualization 
                algorithmType={algorithm.title}
                title={algorithm.title}
                animationSpeed={1000}
              />
            ) : ['bubble sort', 'merge sort', 'quick sort', 'insertion sort', 'binary search'].includes(algorithm.title.toLowerCase()) ? (
              <AlgorithmVisualization 
                algorithmType={algorithm.title}
                title={algorithm.title}
                animationSpeed={500}
              />
            ) : (
              <View style={styles.visualPlaceholder}>
                <Text style={styles.visualPlaceholderText}>
                  {algorithm.title} Görselleştirmesi
                </Text>
                <Text style={styles.visualDescription}>
                  Bu algoritma için henüz görselleştirme eklenmemiştir.
                  En yaygın algoritmalar için görselleştirmeler mevcuttur.
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Yakında</Text>
                </View>
              </View>
            )}
          </View>
        )}
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
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    color: 'white',
    fontSize: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    paddingBottom: 15,
  },
  tabText: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#6c5ce7',
  },
  activeTabText: {
    color: '#6c5ce7',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  descriptionContainer: {
    flex: 1,
    gap: 15,
  },
  summarySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
  },
  complexityContainer: {
    gap: 10,
  },
  complexityBlock: {
    marginBottom: 15,
  },
  complexityLabel: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  complexityValues: {
    gap: 10,
  },
  complexityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complexityType: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  complexityValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepsContainer: {
    gap: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
  },
  prosConsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  prosSection: {
    flex: 1,
  },
  consSection: {
    flex: 1,
  },
  prosConsContent: {
    gap: 8,
  },
  proItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  conItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  prosConsIcon: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  proConText: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  codeContainer: {
    flex: 1,
    gap: 15,
  },
  codeTitleContainer: {
    backgroundColor: '#2c3e50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  codeScrollView: {
    backgroundColor: '#0f2027',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 5,
  },
  codeBlock: {
    padding: 15,
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#f1f1f1',
    fontSize: 14,
    lineHeight: 20,
  },
  visualContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    minHeight: 300,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  visualPlaceholderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  visualDescription: {
    textAlign: 'center',
    color: '#34495e',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 25,
  },
  comingSoonBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#6c5ce7',
    borderRadius: 20,
  },
  comingSoonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  stepCategory: {
    marginBottom: 16,
  },
  stepCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  stabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stabilityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  stabilityValue: {
    fontSize: 14,
    color: '#34495e',
  },
});

export default AlgorithmDetailScreen; 