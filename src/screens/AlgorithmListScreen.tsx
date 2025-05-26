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
      title: 'Selection Sort',
      complexity: 'O(n²)',
      difficulty: 'Kolay',
      description: 'Her adımda dizideki en küçük elemanı bulup doğru konuma yerleştiren bir sıralama algoritmasıdır.',
    },
    {
      id: '5',
      title: 'Insertion Sort',
      complexity: 'O(n²)',
      difficulty: 'Kolay',
      description: 'Diziyi tek tek eleman ekleyerek sıralayan, küçük veri setleri için etkili bir sıralama algoritmasıdır.',
    },
    {
      id: '6',
      title: 'Quick Sort',
      complexity: 'O(n log n)',
      difficulty: 'Orta',
      description: 'Böl ve fethet stratejisini kullanarak hızlı sıralama yapar.',
    },
    {
      id: '7',
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
    },
    {
      id: '3',
      title: 'Geri Yayılım Algoritması',
      complexity: 'O(n²)',
      difficulty: 'Zor',
      description: 'Yapay sinir ağlarının eğitiminde kullanılan gradyan tabanlı bir optimizasyon algoritmasıdır.',
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
    },
    {
      id: '4',
      title: 'Destek Vektör Makineleri',
      complexity: 'O(n²)',
      difficulty: 'Zor',
      description: 'Veri noktalarını ayıran optimum hiper düzlemi bulmaya çalışan bir sınıflandırma algoritmasıdır.',
    },
    {
      id: '5',
      title: 'KNN (K-Nearest Neighbors)',
      complexity: 'O(n)',
      difficulty: 'Kolay',
      description: 'K-En Yakın Komşu algoritması. Yeni bir veri noktasını en yakın k komşusunun sınıfına göre sınıflandırır.',
    },
    {
      id: '6',
      title: 'Naive Bayes',
      complexity: 'O(n)',
      difficulty: 'Kolay',
      description: 'Bayes teoremini kullanan olasılıksal sınıflandırma algoritması. Özellikler arasında bağımsızlık varsayımı yapar.',
    },
    {
      id: '7',
      title: 'Random Forest',
      complexity: 'O(n log n)',
      difficulty: 'Orta',
      description: 'Rastgele Orman algoritması. Çoklu karar ağaçlarının oylaması ile sınıflandırma yapan topluluk öğrenme yöntemidir.',
    }
  ],
  'Denetimsiz Öğrenme': [
    {
      id: '1',
      title: 'K-Means Kümeleme',
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
    },
    {
      id: '3',
      title: 'Hierarchical Clustering',
      complexity: 'O(n³)',
      difficulty: 'Orta',
      description: 'Hiyerarşik kümeleme algoritması. Verileri ağaç yapısında (dendrogram) kümelere ayırır.',
    },
    {
      id: '4',
      title: 'Association Rule Learning',
      complexity: 'O(n²)',
      difficulty: 'Orta',
      description: 'Birliktelik kuralları öğrenme. Veri setindeki öğeler arasındaki ilişkileri keşfeder (Market sepeti analizi gibi).',
    },
    {
      id: '5',
      title: 'Autoencoders',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Otokodlayıcılar. Girdi verilerini sıkıştırıp yeniden oluşturan sinir ağı mimarisi. Boyut indirgeme ve özellik öğrenmede kullanılır.',
    }
  ],
  'Pekiştirmeli Öğrenme': [
    {
      id: '1',
      title: 'Q-Öğrenme (Q-Learning)',
      complexity: 'O(|S|×|A|)',
      difficulty: 'Orta',
      description: 'Model-free pekiştirmeli öğrenme algoritması. Ajanın optimal eylem-değer fonksiyonunu öğrenmesini sağlar.',
    },
    {
      id: '2',
      title: 'SARSA (State-Action-Reward-State-Action)',
      complexity: 'O(|S|×|A|)',
      difficulty: 'Orta',
      description: 'On-policy temporal difference öğrenme algoritması. Mevcut politikayı takip ederek Q-değerlerini günceller.',
    },
    {
      id: '3',
      title: 'REINFORCE',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Policy gradient yöntemlerinin temel algoritması. Politika parametrelerini doğrudan optimize eder.',
    },
    {
      id: '4',
      title: 'Aktör-Kritik (Actor-Critic)',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Value-based ve policy-based yöntemleri birleştiren hibrit algoritma. Aktör politikayı, kritik değer fonksiyonunu öğrenir.',
    },
    {
      id: '5',
      title: 'Proximal Policy Optimization (PPO)',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Policy gradient algoritmalarının gelişmiş versiyonu. Güvenli ve kararlı politika güncellemeleri sağlar.',
    },
    {
      id: '6',
      title: 'Deep Q-Network (DQN)',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Q-Learning algoritmasının derin sinir ağları ile birleştirilmiş hali. Karmaşık durum uzayları için uygun.',
    },
    {
      id: '7',
      title: 'Soft Actor-Critic (SAC)',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Maximum entropy framework kullanan off-policy aktör-kritik algoritması. Sürekli eylem uzayları için optimize edilmiştir.',
    }
  ]
};

// Doğal Dil İşleme alt kategorileri ve algoritmaları
export const nlpSubCategories: SubCategoryMap = {
  'Tokenizasyon': [
    {
      id: '1',
      title: 'Word Tokenization',
      complexity: 'O(n)',
      difficulty: 'Kolay',
      description: 'Metni kelime birimlerine ayırma işlemi.',
    },
    {
      id: '2',
      title: 'Sentence Tokenization',
      complexity: 'O(n)',
      difficulty: 'Kolay',
      description: 'Metni cümle birimlerine ayırma işlemi.',
    }
  ],
  'Vektör Modeller': [
    {
      id: '1',
      title: 'Word2Vec',
      complexity: 'O(n)',
      difficulty: 'Orta',
      description: 'Kelimeleri vektör uzayında temsil eden model.',
    },
    {
      id: '2',
      title: 'GloVe',
      complexity: 'O(n²)',
      difficulty: 'Orta',
      description: 'Global Vectors for Word Representation, kelime vektörlerini oluşturan model.',
    },
    {
      id: '3',
      title: 'FastText',
      complexity: 'O(n)',
      difficulty: 'Orta',
      description: 'Karakter n-gramlarını kullanan kelime vektörü modeli.',
    }
  ],
  'Duygu Analizi': [
    {
      id: '1',
      title: 'Naive Bayes',
      complexity: 'O(n)',
      difficulty: 'Kolay',
      description: 'Metinlerin duygusal tonunu belirlemek için kullanılan olasılıksal sınıflandırıcı.',
    },
    {
      id: '2',
      title: 'LSTM Duygu Analizi',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Uzun-Kısa Vadeli Bellek ağları kullanarak duygu analizi yapma.',
    }
  ],
  'Makine Çevirisi': [
    {
      id: '1',
      title: 'Seq2Seq',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Diziden diziye çeviri yapan sinir ağı mimarisi.',
    },
    {
      id: '2',
      title: 'Transformer',
      complexity: 'O(n²)',
      difficulty: 'Zor',
      description: 'Dikkat mekanizması kullanan modern makine çevirisi mimarisi.',
    }
  ]
};

// Makine Görünümü alt kategorileri ve algoritmaları
export const computerVisionSubCategories: SubCategoryMap = {
  'Görüntü İşleme': [
    {
      id: '1',
      title: 'Kenar Algılama',
      complexity: 'O(n²)',
      difficulty: 'Orta',
      description: 'Görüntülerdeki kenarları tespit eden algoritmalar (Sobel, Canny vb.).',
    },
    {
      id: '2',
      title: 'Filtreleme',
      complexity: 'O(n²)',
      difficulty: 'Kolay',
      description: 'Görüntülere çeşitli filtreler uygulama teknikleri.',
    }
  ],
  'Nesne Tespiti': [
    {
      id: '1',
      title: 'YOLO',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'You Only Look Once, gerçek zamanlı nesne tespiti algoritması.',
    },
    {
      id: '2',
      title: 'R-CNN',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Region-based Convolutional Neural Networks, bölge tabanlı nesne tespiti.',
    },
    {
      id: '3',
      title: 'SSD',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Single Shot Detector, tek geçişli nesne tespiti algoritması.',
    }
  ],
  'Segmentasyon': [
    {
      id: '1',
      title: 'U-Net',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Biyomedikal görüntü segmentasyonu için geliştirilen CNN mimarisi.',
    },
    {
      id: '2',
      title: 'Mask R-CNN',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: 'Nesne tespiti ve instance segmentasyonu birleştiren model.',
    }
  ],
  '3D Görüntüleme': [
    {
      id: '1',
      title: 'PointNet',
      complexity: 'Değişken',
      difficulty: 'Zor',
      description: '3D nokta bulutları üzerinde çalışan derin öğrenme mimarisi.',
    },
    {
      id: '2',
      title: 'SLAM',
      complexity: 'O(n²)',
      difficulty: 'Zor',
      description: 'Eşzamanlı Lokalizasyon ve Haritalama, robotik ve AR uygulamalarında kullanılır.',
    }
  ]
};

// Tüm kategorileri ve alt kategorileri birleştiren nesne
export const allCategories: CategoryMap = {
  '1': dataStructuresSubCategories,
  '2': deepLearningSubCategories,
  '3': machineLearningSubCategories,
  '4': nlpSubCategories,
  '5': computerVisionSubCategories
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