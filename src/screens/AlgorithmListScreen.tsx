import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

// TypeScript için interface tanımlamaları
export interface Algorithm {
  id: string;
  title: string;
  complexity: string;
  difficulty: string;
  description: string;
}

export interface SubCategoryMap {
  [subCategory: string]: Algorithm[];
}

export interface CategoryMap {
  [categoryId: string]: SubCategoryMap;
}

// Veri Yapıları alt kategorileri ve algoritmaları
export const dataStructuresSubCategories: SubCategoryMap = {
  'Diziler': [
    {
      id: '1',
      title: 'Linear Search',
      complexity: 'O(n)',
      difficulty: 'Kolay',
      description: 'Diziyi baştan sona tarayarak arama yapar.',
    },
    {
      id: '2',
      title: 'Binary Search',
      complexity: 'O(log n)',
      difficulty: 'Orta',
      description: 'Sıralı dizide ortadan ikiye bölerek arama yapar.',
    },
    {
      id: '3',
      title: 'Bubble Sort',
      complexity: 'O(n²)',
      difficulty: 'Kolay',
      description: 'Her eleman çifti için komşu elemanları karşılaştırarak sıralama yapar.',
    },
    {
      id: '4',
      title: 'Quick Sort',
      complexity: 'O(n log n)',
      difficulty: 'Orta',
      description: 'Böl ve fethet stratejisini kullanarak hızlı sıralama yapar.',
    },
    {
      id: '5',
      title: 'Merge Sort',
      complexity: 'O(n log n)',
      difficulty: 'Orta',
      description: 'Diziyi ikiye bölerek, alt dizileri sıralayıp birleştirerek sıralama yapar.',
    }
  ],
  'Bağlı Listeler': [
    {
      id: '1',
      title: 'Tekli Bağlı Liste',
      complexity: 'Erişim: O(n)',
      difficulty: 'Kolay',
      description: 'Her düğüm bir sonraki düğüme işaret eden bir veri yapısı.',
    },
    {
      id: '2',
      title: 'Çiftli Bağlı Liste',
      complexity: 'Erişim: O(n)',
      difficulty: 'Orta',
      description: 'Her düğüm bir önceki ve bir sonraki düğüme işaret eden veri yapısı.',
    },
    {
      id: '3',
      title: 'Dairesel Bağlı Liste',
      complexity: 'Erişim: O(n)',
      difficulty: 'Orta',
      description: 'Son düğümün ilk düğüme işaret ettiği bağlı liste türü.',
    }
  ],
  'Ağaçlar': [
    {
      id: '1',
      title: 'İkili Arama Ağacı',
      complexity: 'Erişim: O(log n)',
      difficulty: 'Orta',
      description: 'Solundaki tüm değerler küçük, sağındaki tüm değerler büyük olan düğümlerden oluşan ağaç yapısı.',
    },
    {
      id: '2',
      title: 'AVL Ağacı',
      complexity: 'Erişim: O(log n)',
      difficulty: 'Zor',
      description: 'Kendi kendini dengeleyen ikili arama ağacı türü.',
    },
    {
      id: '3',
      title: 'Kırmızı-Siyah Ağaç',
      complexity: 'Erişim: O(log n)',
      difficulty: 'Zor',
      description: 'Düğümlerin kırmızı veya siyah olarak işaretlendiği, dengeli ikili arama ağacı.',
    }
  ]
};

// Derin Öğrenme alt kategorileri ve algoritmaları
export const deepLearningSubCategories: SubCategoryMap = {
  'Sinir Ağları': [
    {
      id: '1',
      title: 'MLP',
      complexity: 'Değişken',
      difficulty: 'Orta',
      description: 'Çok Katmanlı Algılayıcı, temel ileri beslemeli sinir ağı mimarisi.',
    },
    {
      id: '2',
      title: 'Backpropagation',
      complexity: 'O(n²)',
      difficulty: 'Orta',
      description: 'Sinir ağlarında hata geri yayılım algoritması.',
    }
  ],
  'CNN': [
    {
      id: '1',
      title: 'Evrişimli Sinir Ağları',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Görüntü işleme için özelleştirilmiş, evrişim katmanları içeren sinir ağları.',
    }
  ],
  'RNN': [
    {
      id: '1',
      title: 'LSTM',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Uzun-Kısa Vadeli Bellek, uzun vadeli bağımlılıkları öğrenebilen tekrarlayan sinir ağı türü.',
    },
    {
      id: '2',
      title: 'GRU',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Kapılı Tekrarlayan Birim, LSTM\'in daha basit alternatifi.',
    }
  ]
};

// Makine Öğrenmesi alt kategorileri ve algoritmaları
export const machineLearningSubCategories: SubCategoryMap = {
  'Denetimli Öğrenme': [
    {
      id: '1',
      title: 'Lineer Regresyon',
      complexity: 'O(n²)',
      difficulty: 'Kolay',
      description: 'Bağımlı değişkenle bağımsız değişkenler arasında doğrusal ilişki kuran yöntem.',
    },
    {
      id: '2',
      title: 'Lojistik Regresyon',
      complexity: 'O(n²)',
      difficulty: 'Kolay',
      description: 'İkili sınıflandırma problemleri için kullanılan regresyon yöntemi.',
    },
    {
      id: '3',
      title: 'Karar Ağaçları',
      complexity: 'O(n log n)',
      difficulty: 'Orta',
      description: 'Veri özelliklerine göre karar kuralları oluşturan model.',
    }
  ],
  'Denetimsiz Öğrenme': [
    {
      id: '1',
      title: 'K-Means',
      complexity: 'O(k*n*t)',
      difficulty: 'Orta',
      description: 'Verileri K adet kümeye ayıran kümeleme algoritması.',
    },
    {
      id: '2',
      title: 'PCA',
      complexity: 'O(n³)',
      difficulty: 'Orta',
      description: 'Temel Bileşen Analizi, boyut indirgeme tekniği.',
    }
  ]
};

// Tüm kategorileri ve alt kategorileri birleştiren nesne
export const allCategories: CategoryMap = {
  '1': dataStructuresSubCategories,
  '2': deepLearningSubCategories,
  '3': machineLearningSubCategories,
  // Diğer kategoriler eklenebilir
};

const difficultyColors: {[key: string]: string} = {
  'Kolay': '#27ae60',
  'Orta': '#f39c12',
  'Zor': '#e74c3c',
};

const AlgorithmListScreen = ({ route, navigation }: any) => {
  const { category, initialSubCategory } = route.params;
  const subCategories = allCategories[category.id] || {};
  const subCategoryNames = Object.keys(subCategories);
  
  const [selectedSubCategory, setSelectedSubCategory] = useState(
    initialSubCategory && subCategoryNames.includes(initialSubCategory) 
      ? initialSubCategory 
      : (subCategoryNames[0] || '')
  );
  const algorithms = subCategories[selectedSubCategory] || [];
  
  const renderAlgorithmItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.algorithmItem}
      onPress={() => navigation.navigate('AlgorithmDetail', { algorithm: item })}
    >
      <View style={styles.algorithmHeader}>
        <Text style={styles.algorithmTitle}>{item.title}</Text>
        <View style={[
          styles.difficultyBadge, 
          { backgroundColor: difficultyColors[item.difficulty] }
        ]}>
          <Text style={styles.difficultyText}>{item.difficulty}</Text>
        </View>
      </View>
      <Text style={styles.algorithmDescription}>{item.description}</Text>
      <View style={styles.algorithmFooter}>
        <Text style={styles.complexityLabel}>Karmaşıklık:</Text>
        <Text style={styles.complexityValue}>{item.complexity}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.title}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Alt Kategori Seçici */}
      <View style={styles.subCategoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subCategoryScrollContent}
        >
          {subCategoryNames.map((subCat) => (
            <TouchableOpacity
              key={subCat}
              style={[
                styles.subCategoryTab,
                selectedSubCategory === subCat && styles.selectedSubCategoryTab
              ]}
              onPress={() => setSelectedSubCategory(subCat)}
            >
              <Text style={[
                styles.subCategoryText,
                selectedSubCategory === subCat && styles.selectedSubCategoryText
              ]}>
                {subCat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Algoritma Listesi */}
      <FlatList
        data={algorithms}
        renderItem={renderAlgorithmItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FF8C00',
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
  subCategoryContainer: {
    backgroundColor: 'white',
    paddingTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  subCategoryScrollContent: {
    paddingHorizontal: 10,
  },
  subCategoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  selectedSubCategoryTab: {
    backgroundColor: '#FFD700',
  },
  subCategoryText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedSubCategoryText: {
    color: '#333',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  algorithmItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  algorithmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  algorithmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  algorithmDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  algorithmFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  complexityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  complexityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
});

export default AlgorithmListScreen; 