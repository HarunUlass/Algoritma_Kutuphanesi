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

// Algorithm Visualizations
import AlgorithmVisualization from '../components/AlgorithmVisualization';
import GraphVisualization from '../components/GraphVisualization';
import KNNVisualization from '../components/KNNVisualization';
import RedBlackTreeVisualization from '../components/RedBlackTreeVisualization';
import AVLTreeVisualization from '../components/AVLTreeVisualization';
import ActorCriticVisualization from '../components/ActorCriticVisualization';
import DecisionTreeVisualization from '../components/DecisionTreeVisualization';
import DQNVisualization from '../components/DQNVisualization';
import LinearRegressionVisualization from '../components/LinearRegressionVisualization';
import NaiveBayesVisualization from '../components/NaiveBayesVisualization';
import PPOVisualization from '../components/PPOVisualization';
import QLearningVisualization from '../components/QLearningVisualization';
import ReinforceVisualization from '../components/ReinforceVisualization';
import RandomForestVisualization from '../components/RandomForestVisualization';
import SACVisualization from '../components/SACVisualization';
import SarsaVisualization from '../components/SarsaVisualization';
import SVMVisualization from '../components/SVMVisualization';
import KMeansVisualization from '../components/KMeansVisualization';
import PCAVisualization from '../components/PCAVisualization';
import HierarchicalClusteringVisualization from '../components/HierarchicalClusteringVisualization';
import AssociationRuleLearningVisualization from '../components/AssociationRuleLearningVisualization';
import AutoencoderVisualization from '../components/AutoencoderVisualization';
import { CircularLinkedListVisualization, SinglyLinkedListVisualization, DoublyLinkedListVisualization } from '../components/index';
import { AlgorithmInfoCard } from '../components/VisualizationHelpers';

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

// Example implementation of Decision Tree in JavaScript
const decisionTreeCode = `// Simplified Decision Tree Implementation
class DecisionTree {
  constructor(maxDepth = 3, minSamples = 2) {
    this.maxDepth = maxDepth;
    this.minSamples = minSamples;
    this.root = null;
  }
  
  // Calculate Gini impurity
  calculateGiniImpurity(labels) {
    const counts = {};
    labels.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
    
    const total = labels.length;
    let impurity = 1;
    
    for (const label in counts) {
      const probability = counts[label] / total;
      impurity -= probability * probability;
    }
    
    return impurity;
  }
  
  // Find best split
  findBestSplit(data, features, labels) {
    let bestGain = 0;
    let bestFeature = null;
    let bestThreshold = null;
    
    const currentImpurity = this.calculateGiniImpurity(labels);
    
    for (const feature of features) {
      // Get unique values for this feature
      const values = [...new Set(data.map(d => d[feature]))].sort();
      
      // Try different thresholds
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        
        // Split data
        const leftIndices = [];
        const rightIndices = [];
        
        data.forEach((d, index) => {
          if (d[feature] <= threshold) {
            leftIndices.push(index);
          } else {
            rightIndices.push(index);
          }
        });
        
        // Skip if split is too small
        if (leftIndices.length < this.minSamples || rightIndices.length < this.minSamples) {
          continue;
        }
        
        // Calculate information gain
        const leftLabels = leftIndices.map(i => labels[i]);
        const rightLabels = rightIndices.map(i => labels[i]);
        
        const leftImpurity = this.calculateGiniImpurity(leftLabels);
        const rightImpurity = this.calculateGiniImpurity(rightLabels);
        
        const leftWeight = leftLabels.length / labels.length;
        const rightWeight = rightLabels.length / labels.length;
        
        const gain = currentImpurity - (leftWeight * leftImpurity + rightWeight * rightImpurity);
        
        // Update best split if needed
        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }
    
    return { feature: bestFeature, threshold: bestThreshold, gain: bestGain };
  }
  
  // Build tree recursively
  buildTree(data, features, labels, depth = 0) {
    // Check if we should stop
    if (depth >= this.maxDepth || 
        data.length < this.minSamples * 2 || 
        new Set(labels).size === 1) {
      
      // Create leaf node
      const counts = {};
      labels.forEach(label => {
        counts[label] = (counts[label] || 0) + 1;
      });
      
      let maxCount = 0;
      let prediction = null;
      
      for (const label in counts) {
        if (counts[label] > maxCount) {
          maxCount = counts[label];
          prediction = label;
        }
      }
      
      return { type: 'leaf', prediction };
    }
    
    // Find best split
    const { feature, threshold, gain } = this.findBestSplit(data, features, labels);
    
    // If no good split found, create leaf
    if (!feature || gain === 0) {
      const majorityLabel = [...labels].sort((a, b) => 
        labels.filter(l => l === b).length - labels.filter(l => l === a).length
      )[0];
      
      return { type: 'leaf', prediction: majorityLabel };
    }
    
    // Split data
    const leftData = [];
    const leftLabels = [];
    const rightData = [];
    const rightLabels = [];
    
    data.forEach((d, i) => {
      if (d[feature] <= threshold) {
        leftData.push(d);
        leftLabels.push(labels[i]);
      } else {
        rightData.push(d);
        rightLabels.push(labels[i]);
      }
    });
    
    // Build subtrees
    const leftBranch = this.buildTree(leftData, features, leftLabels, depth + 1);
    const rightBranch = this.buildTree(rightData, features, rightLabels, depth + 1);
    
    return {
      type: 'node',
      feature,
      threshold,
      left: leftBranch,
      right: rightBranch
    };
  }
  
  // Train the decision tree
  fit(data, labels) {
    const features = Object.keys(data[0]);
    this.root = this.buildTree(data, features, labels);
    return this;
  }
  
  // Make prediction for a single sample
  predict(sample) {
    let node = this.root;
    
    while (node.type !== 'leaf') {
      if (sample[node.feature] <= node.threshold) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    
    return node.prediction;
  }
}

// Example usage
const data = [
  { feature1: 5.1, feature2: 3.5 },
  { feature1: 4.9, feature2: 3.0 },
  { feature1: 7.0, feature2: 3.2 },
  { feature1: 6.4, feature2: 3.2 },
  { feature1: 6.3, feature2: 3.3 },
  { feature1: 4.6, feature2: 3.1 }
];

const labels = ['A', 'A', 'B', 'B', 'B', 'A'];

const dt = new DecisionTree(maxDepth=2, minSamples=1);
dt.fit(data, labels);

console.log(dt.predict({ feature1: 5.0, feature2: 3.3 })); // Predicts 'A'
console.log(dt.predict({ feature1: 6.5, feature2: 3.0 })); // Predicts 'B'`;

const codeExamples: { [key: string]: { javascript: string } } = {
  'Bubble Sort': {
    javascript: bubbleSortCode,
    // We could add other languages like Python, Java, etc.
  },
  'Binary Search': {
    javascript: binarySearchCode,
  },
  'Karar Ağaçları': {
    javascript: decisionTreeCode,
  },
  'Karar Ağacı': {
    javascript: decisionTreeCode,
  },
  'Decision Tree': {
    javascript: decisionTreeCode,
  },
  'CART': {
    javascript: decisionTreeCode,
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
  'Karar Ağaçları': {
    title: 'Karar Ağaçları',
    complexity: {
      time: {
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n²)',
      },
      space: 'O(n)',
    },
    prerequisites: 'Etiketli veri gerektirir (denetimli öğrenme).',
    description: 'Karar ağaçları, veriyi özyinelemeli olarak bölümlere ayırarak sınıflandırma veya regresyon yapmak için kullanılan bir denetimli öğrenme algoritmasıdır. Kök düğümden başlayarak, her bir düğümde veri, belirlenen bir özelliğe göre dallanır ve yaprak düğümlerde sınıf etiketleri veya tahmin değerleri bulunur.',
    steps: [
      'Veri kümesi için en iyi ayrım sağlayan özelliği ve eşik değerini bul (Gini indeksi veya Entropy kullanarak)',
      'Veriyi bu özellik ve eşik değerine göre ikiye ayır (sol alt ağaç ve sağ alt ağaç)',
      'Her alt küme için özyinelemeli olarak aynı işlemi tekrarla',
      'Durma koşullarına ulaşıldığında (maksimum derinlik, minimum örnek sayısı veya homojen sınıf dağılımı) yaprak düğümler oluştur',
      'Yaprak düğümlerde çoğunluk sınıfını (sınıflandırma) veya ortalama değeri (regresyon) tahmin olarak kullan',
    ],
    pros: [
      'Yorumlanabilirliği yüksek, insanlar için anlaşılması kolay ve sonuçlar açıklanabilir',
      'Veri ön işleme gerektirmez (normalleştirme/standartlaştırma gerekli değildir)',
      'Hem kategorik hem de sayısal verileri işleyebilir',
      'Özellik önemini belirleyebilir ve ilgisiz özellikleri otomatik olarak filtreler',
      'Doğrusal olmayan ilişkileri yakalayabilir',
      'Eksik değerlerle başa çıkabilir',
    ],
    cons: [
      'Aşırı öğrenmeye (overfitting) yatkındır, özellikle derinlik sınırlaması yoksa',
      'Kararsızdır - veri kümesindeki küçük değişiklikler ağaç yapısını tamamen değiştirebilir',
      'Optimum ağacı bulmak NP-complete problem olduğundan greedy yaklaşım kullanılır',
      'Karmaşık karar sınırlarını modellemekte zorluk yaşar',
      'Dengesiz veri setlerinde doğruluk sorunları olabilir',
      'Genellikle ensemble yöntemlerle birlikte kullanılması gerekir (Random Forest, Gradient Boosting gibi)',
    ],
  },
  'Decision Tree': {
    title: 'Decision Tree',
    complexity: {
      time: {
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n²)',
      },
      space: 'O(n)',
    },
    prerequisites: 'Labeled data required (supervised learning).',
    description: 'Decision trees are a supervised learning algorithm used for classification and regression by recursively partitioning the data. Starting from the root node, the data branches at each node based on a determined feature, with class labels or prediction values found in the leaf nodes.',
    steps: [
      'Find the best feature and threshold for splitting the dataset (using Gini index or Entropy)',
      'Split the data into two subsets based on this feature and threshold (left subtree and right subtree)',
      'Recursively repeat the same process for each subset',
      'Create leaf nodes when stopping conditions are met (maximum depth, minimum sample size, or homogeneous class distribution)',
      'Use majority class (classification) or average value (regression) as prediction in leaf nodes',
    ],
    pros: [
      'Highly interpretable, easy for humans to understand, and results can be explained',
      'No data preprocessing required (normalization/standardization not necessary)',
      'Can handle both categorical and numerical data',
      'Can determine feature importance and automatically filter irrelevant features',
      'Can capture non-linear relationships',
      'Can handle missing values',
    ],
    cons: [
      'Prone to overfitting, especially with no depth limitation',
      'Unstable - small changes in the dataset can completely change the tree structure',
      'Finding the optimal tree is an NP-complete problem, so a greedy approach is used',
      'Struggles with modeling complex decision boundaries',
      'May have accuracy issues with imbalanced datasets',
      'Often needs to be used with ensemble methods (Random Forest, Gradient Boosting, etc.)',
    ],
  },
  'Karar Ağacı': {
    title: 'Karar Ağacı',
    complexity: {
      time: {
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n²)',
      },
      space: 'O(n)',
    },
    prerequisites: 'Etiketli veri gerektirir (denetimli öğrenme).',
    description: 'Karar ağaçları, veriyi özyinelemeli olarak bölümlere ayırarak sınıflandırma veya regresyon yapmak için kullanılan bir denetimli öğrenme algoritmasıdır. Kök düğümden başlayarak, her bir düğümde veri, belirlenen bir özelliğe göre dallanır ve yaprak düğümlerde sınıf etiketleri veya tahmin değerleri bulunur.',
    steps: [
      'Veri kümesi için en iyi ayrım sağlayan özelliği ve eşik değerini bul (Gini indeksi veya Entropy kullanarak)',
      'Veriyi bu özellik ve eşik değerine göre ikiye ayır (sol alt ağaç ve sağ alt ağaç)',
      'Her alt küme için özyinelemeli olarak aynı işlemi tekrarla',
      'Durma koşullarına ulaşıldığında (maksimum derinlik, minimum örnek sayısı veya homojen sınıf dağılımı) yaprak düğümler oluştur',
      'Yaprak düğümlerde çoğunluk sınıfını (sınıflandırma) veya ortalama değeri (regresyon) tahmin olarak kullan',
    ],
    pros: [
      'Yorumlanabilirliği yüksek, insanlar için anlaşılması kolay ve sonuçlar açıklanabilir',
      'Veri ön işleme gerektirmez (normalleştirme/standartlaştırma gerekli değildir)',
      'Hem kategorik hem de sayısal verileri işleyebilir',
      'Özellik önemini belirleyebilir ve ilgisiz özellikleri otomatik olarak filtreler',
      'Doğrusal olmayan ilişkileri yakalayabilir',
      'Eksik değerlerle başa çıkabilir',
    ],
    cons: [
      'Aşırı öğrenmeye (overfitting) yatkındır, özellikle derinlik sınırlaması yoksa',
      'Kararsızdır - veri kümesindeki küçük değişiklikler ağaç yapısını tamamen değiştirebilir',
      'Optimum ağacı bulmak NP-complete problem olduğundan greedy yaklaşım kullanılır',
      'Karmaşık karar sınırlarını modellemekte zorluk yaşar',
      'Dengesiz veri setlerinde doğruluk sorunları olabilir',
      'Genellikle ensemble yöntemlerle birlikte kullanılması gerekir (Random Forest, Gradient Boosting gibi)',
    ],
  },
  'CART': {
    title: 'CART (Classification and Regression Trees)',
    complexity: {
      time: {
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n²)',
      },
      space: 'O(n)',
    },
    prerequisites: 'Etiketli veri gerektirir (denetimli öğrenme).',
    description: 'CART (Sınıflandırma ve Regresyon Ağaçları), karar ağaçlarının popüler bir uygulamasıdır. Gini indeksini kullanarak ikili bölünmeler yapan ve hem sınıflandırma hem de regresyon problemleri için kullanılabilen bir algoritmadır.',
    steps: [
      'Veri kümesi için en iyi ayrım sağlayan özelliği ve eşik değerini bul (genellikle Gini indeksi kullanarak)',
      'Veriyi bu özellik ve eşik değerine göre ikiye ayır (sol alt ağaç ve sağ alt ağaç)',
      'Her alt küme için özyinelemeli olarak aynı işlemi tekrarla',
      'Durma koşullarına ulaşıldığında yaprak düğümler oluştur',
      'Yaprak düğümlerde çoğunluk sınıfını (sınıflandırma) veya ortalama değeri (regresyon) tahmin olarak kullan',
    ],
    pros: [
      'Yorumlanabilirliği yüksek, insanlar için anlaşılması kolay',
      'Hem sınıflandırma hem de regresyon problemleri için kullanılabilir',
      'Hem kategorik hem de sayısal verileri işleyebilir',
      'Özellik önemini belirleyebilir',
      'Doğrusal olmayan ilişkileri yakalayabilir',
    ],
    cons: [
      'Aşırı öğrenmeye (overfitting) yatkındır',
      'Kararsızdır - veri kümesindeki küçük değişiklikler ağaç yapısını değiştirebilir',
      'Kategorik değişkenlerde önyargı olabilir',
      'Karmaşık karar sınırlarını modellemekte zorluk yaşar',
      'Dengesiz veri setlerinde sorunlar yaşayabilir',
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
        
        // Karar Ağaçları için özel kontrol
        const lowerTitle = algorithm.title.trim().toLowerCase();
        if (lowerTitle === 'karar ağaçları' || 
            lowerTitle === 'karar ağacı' || 
            lowerTitle === 'decision tree' || 
            lowerTitle === 'cart' || 
            lowerTitle.includes('karar') && lowerTitle.includes('ağa')) {
          
          console.log('Karar ağacı algoritması için statik veriler kullanılıyor:', algorithm.title);
          
          // Doğru statik veriyi bul
          let matchKey = '';
          if (lowerTitle === 'karar ağaçları') matchKey = 'Karar Ağaçları';
          else if (lowerTitle === 'karar ağacı') matchKey = 'Karar Ağacı';
          else if (lowerTitle === 'decision tree') matchKey = 'Decision Tree';
          else if (lowerTitle === 'cart') matchKey = 'CART';
          else matchKey = 'Karar Ağaçları';
          
          // Yüklemeyi tamamla
          setLoading(false);
          return;
        }
        
        // Diğer algoritmalar için normal akış
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

  // Check if algorithm is in an excluded category
  const isVisualizationExcluded = () => {
    const excludedCategories = ['derin öğrenme', 'doğal dil işleme', 'makine görünümü', 'deep learning', 'natural language processing', 'computer vision', 'nlp', 'cv', 'dl'];
    const isExcluded = excludedCategories.some(category => 
      algorithm?.category?.toLowerCase().includes(category) || 
      algorithm?.title?.toLowerCase().includes(category)
    );
    
    // Debug log ekleniyor
    console.log('Algoritma:', algorithm?.title);
    console.log('Kategori:', algorithm?.category);
    console.log('Görselleştirme hariç tutuldu mu:', isExcluded);
    
    return isExcluded;
  };

  // Algoritma tipine göre görselleştirme bileşenini render et
  const renderVisualization = () => {
    if (!algorithm) {
      console.log('Algoritma verisi yok, görselleştirme yapılamıyor.');
      return (
        <View style={styles.visualPlaceholder}>
          <Text style={styles.visualPlaceholderText}>Algoritma verisi bulunamadı</Text>
        </View>
      );
    }
    
    const algorithmName = algorithm?.title?.toLowerCase() || '';
    
    // Debug için algoritma adını ve kontrolleri yazdır
    console.log('Algoritma adı (lowercase):', algorithmName);
    console.log('Karar ağacı kontrolü:', 
      algorithmName.includes('decision tree'), 
      algorithmName.includes('karar ağac'), 
      algorithmName.includes('cart')
    );
    
    // Karar ağacı görselleştirmesi (öncelikli kontrol)
    if (algorithmName.includes('decision tree') || 
        algorithmName.includes('karar ağac') || 
        algorithmName.includes('cart') ||
        (algorithmName.includes('karar') && (algorithmName.includes('ağac') || algorithmName.includes('tree')))) {
      console.log('Karar ağacı görselleştirmesi gösteriliyor');
      return <DecisionTreeVisualization title={algorithm?.title || 'Karar Ağacı Algoritması'} />;
    }

    // Skip visualization for specific categories
    const excludedCategories = ['derin öğrenme', 'doğal dil işleme', 'makine görünümü', 'deep learning', 'natural language processing', 'computer vision', 'nlp', 'cv', 'dl'];
    
    // Check if algorithm belongs to excluded categories
    const isExcludedCategory = excludedCategories.some(category => 
      algorithm?.category?.toLowerCase().includes(category) || 
      algorithm?.title?.toLowerCase().includes(category)
    );
    
    if (isExcludedCategory) {
      return (
        <View style={styles.visualPlaceholder}>
          <Text style={styles.visualPlaceholderText}>Bu algoritmanın görselleştirmesi bulunmamaktadır</Text>
          <Text style={styles.visualDescription}>
            Bu kategorideki algoritmalar için görselleştirme desteği henüz sağlanmamaktadır.
          </Text>
        </View>
      );
    }
    
    if (algorithmName.includes('graph')) {
      return <GraphVisualization title={algorithm?.title || 'Graph Algorithm'} algorithmType={algorithmName} />;
    } else if (algorithmName.includes('knn') || algorithmName.includes('k-nn') || algorithmName.includes('k nearest')) {
      return <KNNVisualization title={algorithm?.title || 'KNN Algorithm'} />;
    } else if (algorithmName.includes('red-black') || algorithmName.includes('red black') || algorithmName.includes('kırmızı-siyah') || algorithmName.includes('kırmızı siyah')) {
      return <RedBlackTreeVisualization title={algorithm?.title || 'Red-Black Tree Algorithm'} />;
    } else if (algorithmName.includes('avl')) {
      return <AVLTreeVisualization title={algorithm?.title || 'AVL Tree Algorithm'} />;
    } else if (algorithmName.includes('actor-critic') || algorithmName.includes('actor critic')) {
      return <ActorCriticVisualization title={algorithm?.title || 'Actor-Critic Algorithm'} />;
    } else if (algorithmName.includes('naive bayes') || algorithmName.includes('naivebayes') || algorithmName.includes('naive-bayes') || algorithmName.includes('naïve bayes')) {
      return <NaiveBayesVisualization title={algorithm?.title || 'Naive Bayes Algorithm'} />;
    } else if (algorithmName.includes('dqn') || algorithmName.includes('deep q')) {
      return <DQNVisualization title={algorithm?.title || 'DQN Algorithm'} />;
    } else if (algorithmName.includes('linear regression') || algorithmName.includes('doğrusal regresyon') || algorithmName.includes('lineer regresyon')) {
      return <LinearRegressionVisualization title={algorithm?.title || 'Linear Regression Algorithm'} />;
    } else if (algorithmName.includes('ppo') || algorithmName.includes('proximal policy')) {
      return <PPOVisualization title={algorithm?.title || 'PPO Algorithm'} />;
    } else if (algorithmName.includes('q-learning') || algorithmName.includes('q learning') || algorithmName.includes('qlearning')) {
      return <QLearningVisualization title={algorithm?.title || 'Q-Learning Algorithm'} />;
    } else if (algorithmName.includes('reinforce') || algorithmName.includes('policy gradient')) {
      return <ReinforceVisualization title={algorithm?.title || 'REINFORCE Algorithm'} />;
    } else if (algorithmName.includes('sac') || algorithmName.includes('soft actor-critic') || algorithmName.includes('soft actor critic')) {
      return <SACVisualization title={algorithm?.title || 'SAC Algorithm'} />;
    } else if (algorithmName.includes('sarsa')) {
      return <SarsaVisualization title={algorithm?.title || 'SARSA Algorithm'} />;
    } else if (algorithmName.includes('svm') || algorithmName.includes('support vector') || algorithmName.includes('destek vektör')) {
      return <SVMVisualization title={algorithm?.title || 'SVM Algorithm'} />;
    } else if (algorithmName.includes('random forest') || algorithmName.includes('random tree') || algorithmName.includes('orman')) {
      return <RandomForestVisualization title={algorithm?.title || 'Random Forest Algorithm'} />;
    } else if (algorithmName.includes('k-means') || algorithmName.includes('k means') || algorithmName.includes('kümeleme')) {
      return <KMeansVisualization title={algorithm?.title || 'K-Means Clustering Algorithm'} />;
    } else if (algorithmName.includes('hierarchical') || 
               algorithmName.includes('hierarchical clustering') || 
               algorithmName.includes('hiyerarşik kümeleme') ||
               algorithmName.includes('agglomerative') ||
               algorithmName.includes('dendrogram')) {
      console.log('Hiyerarşik Kümeleme görselleştirmesi gösteriliyor'); // Debug için
      return <HierarchicalClusteringVisualization title={algorithm?.title || 'Hierarchical Clustering'} />;
    } else if (algorithmName.includes('pca') || 
               algorithmName.includes('principal component') || 
               algorithmName.includes('temel bileşen') ||
               algorithmName.includes('ana bileşen') ||
               algorithmName.includes('principal') ||
               algorithmName.includes('component analysis')) {
      console.log('PCA görselleştirmesi gösteriliyor'); // Debug için PCA görselleştirmesini konsola yazdır
      return <PCAVisualization title={algorithm?.title || 'Principal Component Analysis'} />;
    } else if (algorithmName.includes('association rule') || 
               algorithmName.includes('birliktelik kural') || 
               algorithmName.includes('apriori') ||
               algorithmName.includes('fp-growth') ||
               algorithmName.includes('eclat') ||
               algorithmName.includes('market basket')) {
      console.log('Birliktelik Kuralları görselleştirmesi gösteriliyor'); // Debug için
      return <AssociationRuleLearningVisualization title={algorithm?.title || 'Association Rule Learning'} />;
    } else if (algorithmName.includes('autoencoder') || 
               algorithmName.includes('otokodlayıcı') || 
               algorithmName.includes('auto encoder') ||
               algorithmName.includes('oto kodlayıcı') ||
               algorithmName.includes('encoder-decoder') ||
               algorithmName.includes('vae') ||
               algorithmName.includes('variational autoencoder')) {
      console.log('Otokodlayıcı görselleştirmesi gösteriliyor'); // Debug için
      return <AutoencoderVisualization title={algorithm?.title || 'Autoencoder'} />;
    } 
    // Sorting algorithms (diziler kategorisi)
    else if (algorithmName.includes('bubble sort') || algorithmName.includes('kabarcık sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Bubble Sort'} algorithmType="bubble sort" />;
    } else if (algorithmName.includes('insertion sort') || algorithmName.includes('ekleme sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Insertion Sort'} algorithmType="insertion sort" />;
    } else if (algorithmName.includes('selection sort') || algorithmName.includes('seçme sıralama') || algorithmName.includes('seçim sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Selection Sort'} algorithmType="selection sort" />;
    } else if (algorithmName.includes('quick sort') || algorithmName.includes('hızlı sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Quick Sort'} algorithmType="quick sort" />;
    } else if (algorithmName.includes('merge sort') || algorithmName.includes('birleştirme sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Merge Sort'} algorithmType="merge sort" />;
    } else if (algorithmName.includes('heap sort') || algorithmName.includes('yığın sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Heap Sort'} algorithmType="heap sort" />;
    } else if (algorithmName.includes('counting sort') || algorithmName.includes('sayarak sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Counting Sort'} algorithmType="counting sort" />;
    } else if (algorithmName.includes('radix sort') || algorithmName.includes('taban sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Radix Sort'} algorithmType="radix sort" />;
    } else if (algorithmName.includes('shell sort') || algorithmName.includes('kabuk sıralama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Shell Sort'} algorithmType="shell sort" />;
    }
    // Binary and Linear Search
    else if (algorithmName.includes('binary search') || algorithmName.includes('ikili arama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Binary Search'} algorithmType="binary search" />;
    }     else if (algorithmName.includes('linear search') || algorithmName.includes('doğrusal arama')) {
      return <AlgorithmVisualization title={algorithm?.title || 'Linear Search'} algorithmType="linear search" />;
    }
    // Linked List Algorithms
    else if (algorithmName.includes('circular linked list') || 
             algorithmName.includes('dairesel bağlı liste') || 
             algorithmName.includes('döngüsel bağlı liste')) {
      console.log('Dairesel Bağlı Liste görselleştirmesi gösteriliyor');
      return <CircularLinkedListVisualization title={algorithm?.title || 'Circular Linked List'} />;
    }
    else if (algorithmName.includes('singly linked list') || 
             algorithmName.includes('tekli bağlı liste') ||
             (algorithmName.includes('linked list') && !algorithmName.includes('circular') && !algorithmName.includes('doubly'))) {
      console.log('Tek Yönlü Bağlı Liste görselleştirmesi gösteriliyor');
      return <SinglyLinkedListVisualization title={algorithm?.title || 'Tek Yönlü Bağlı Liste'} />;
    }
    else if (algorithmName.includes('doubly linked list') || 
             algorithmName.includes('çift yönlü bağlı liste') ||
             algorithmName.includes('çiftli bağlı liste') ||
             algorithmName.includes('iki yönlü bağlı liste')) {
      console.log('Çift Yönlü Bağlı Liste görselleştirmesi gösteriliyor');
      return <DoublyLinkedListVisualization title={algorithm?.title || 'Çift Yönlü Bağlı Liste'} />;
    }
    // Default case
    else {
      // Check if this is a non-visual algorithm type
      const hasVisualization = /sort|search|tree|list|graph|knn|naiv|linear|decision|regres|random|kmeans|pca|hierarchical|association|auto|learn|critic|dqn|ppo|reinforce|sac|sarsa|svm/.test(algorithmName);
      
      if (hasVisualization) {
        return <AlgorithmVisualization title={algorithm?.title || 'Algorithm'} algorithmType={algorithm?.title?.toLowerCase() || 'default'} />;
      } else {
        return (
          <View style={styles.visualPlaceholder}>
            <Text style={styles.visualPlaceholderText}>Bu algoritmanın görselleştirmesi bulunmamaktadır</Text>
            <Text style={styles.visualDescription}>
              Bu algoritma için görselleştirme desteği henüz sağlanmamaktadır.
            </Text>
          </View>
        );
      }
    }
  };

  // Görselleştirme sekmesi için debug hook'u
  useEffect(() => {
    if (activeTab === 'visual' && algorithm?.title) {
      const algorithmName = algorithm.title.toLowerCase();
      console.log('Görselleştirme sekmesi aktif. Algoritma adı:', algorithm.title);
      console.log('Karar ağacı kontrolü:', 
        algorithmName.includes('decision tree'), 
        algorithmName.includes('karar ağac'), 
        algorithmName.includes('cart'),
        algorithmName.includes('karar'),
        algorithmName.includes('tree')
      );
    }
  }, [activeTab, algorithm]);

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
            {/* Karar Ağacı algoritmaları için doğrudan details objesini kullan */}
            {(algorithm.title.toLowerCase().includes('karar') || 
              algorithm.title.toLowerCase().includes('decision') || 
              algorithm.title.toLowerCase().includes('cart')) ? (
              <>
                {/* Algoritma özeti bölümü */}
                <View style={styles.summarySection}>
                  {(details as AlgorithmDetail).prerequisites && (
                    <View style={styles.stabilityContainer}>
                      <Text style={styles.stabilityLabel}>Ön Gereksinimler: </Text>
                      <Text style={styles.stabilityValue}>{(details as AlgorithmDetail).prerequisites}</Text>
                    </View>
                  )}
                  <Text style={[styles.descriptionText, { color: '#2c3e50' }]}>{details.description}</Text>
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
                {details.steps && details.steps.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Adımlar</Text>
                    <View style={styles.stepsContainer}>
                      {details.steps.map((step: string, index: number) => (
                        <View key={index} style={styles.stepItem}>
                          <View style={styles.stepNumberContainer}>
                            <Text style={styles.stepNumber}>{index + 1}</Text>
                          </View>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
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
              </>
            ) : (
              /* Diğer algoritma türleri için mevcut davranışı sürdür */
              <>
            {/* Ağaç algoritmaları için özel görselleştirme bilgileri */}
            {(algorithm.title.toLowerCase().includes('tree') || 
              algorithm.title.toLowerCase().includes('ağaç') || 
              algorithm.title.toLowerCase().includes('avl') || 
              algorithm.title.toLowerCase().includes('red-black') || 
                  algorithm.title.toLowerCase().includes('kırmızı-siyah')) ? (
              <AlgorithmInfoCard algorithmType={algorithm.title} />
                ) : (
                  /* Standart algoritma açıklamaları */
              <>
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
                  </>
                )}
              </>
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
                <Text style={styles.codeText}>
                  {/* Karar ağacı algoritması için doğru kod gösterimi */}
                  {algorithm.title.toLowerCase().includes('karar') || 
                   algorithm.title.toLowerCase().includes('decision') || 
                   algorithm.title.toLowerCase().includes('cart') 
                    ? codeExamples['Karar Ağaçları']?.javascript || 'Bu algoritma için kod örneği bulunmamaktadır.'
                    : codeExample}
                </Text>
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
            <View style={styles.visualCard}>
              {/* Check if algorithm is in an excluded category */}
              {isVisualizationExcluded() ? (
                <View style={styles.visualPlaceholder}>
                  <Text style={styles.visualPlaceholderText}>Bu algoritmanın görselleştirmesi bulunmamaktadır</Text>
                  <Text style={styles.visualDescription}>
                    Bu kategorideki algoritmalar için görselleştirme desteği henüz sağlanmamaktadır.
                  </Text>
                </View>
              ) : algorithm?.title?.toLowerCase().includes('karar') || algorithm?.title?.toLowerCase().includes('decision tree') ? (
                // Karar ağacı algoritması için doğrudan görselleştirme göster
                <DecisionTreeVisualization title={algorithm?.title || 'Karar Ağacı Algoritması'} />
              ) : algorithm?.title?.toLowerCase().includes('pca') || 
                 algorithm?.title?.toLowerCase().includes('principal component') ||
                 algorithm?.title?.toLowerCase().includes('temel bileşen') ? (
                <PCAVisualization title={algorithm?.title || 'Principal Component Analysis'} />
              ) : (
                /* Diğer algoritmalar için normal görselleştirme */
                renderVisualization()
              )}
            </View>
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
    minHeight: 400,
    width: '100%',
    paddingBottom: 20,
  },
  visualCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
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