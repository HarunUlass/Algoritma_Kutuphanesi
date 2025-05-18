import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Algoritma açıklamaları - kullanıcı için bilgi ve yardım
export const algorithmDescriptions = {
  'bubble sort': {
    name: 'Kabarcık Sıralama (Bubble Sort)',
    description: 'Kabarcık sıralama, her adımda yanyana duran elemanları karşılaştırıp, sıralamaya aykırı olanları yer değiştiren basit bir sıralama algoritmasıdır.',
    complexity: {
      time: 'O(n²)', 
      space: 'O(1)'
    },
    steps: [
      'Dizinin başından başlayarak her bir elemanı bir sonraki eleman ile karşılaştır',
      'Eğer eleman sıralamaya aykırı ise yer değiştir',
      'Dizinin sonuna geldiğinde, başa dön ve aynı süreci tekrarla',
      'Her bir geçişte en büyük eleman dizinin sonuna yerleşir',
      'Hiçbir değişiklik yapılmayan bir geçiş gerçekleşene kadar devam et'
    ]
  },
  'merge sort': {
    name: 'Birleştirme Sıralaması (Merge Sort)',
    description: 'Birleştirme sıralaması, bölüm-birleştir (divide and conquer) yaklaşımını kullanır. Diziyi tekrar tekrar iki parçaya böler, parçaları sıralar ve sonra birleştirir.',
    complexity: {
      time: 'O(n log n)', 
      space: 'O(n)'
    },
    steps: [
      'Diziyi ikiye böl',
      'Her iki yarıyı recursif olarak sırala',
      'İki sıralı yarıyı birleştir'
    ]
  },
  'quick sort': {
    name: 'Hızlı Sıralama (Quick Sort)',
    description: 'Hızlı sıralama, bir pivot eleman seçerek diziyi ikiye böler. Pivottan küçük elemanlar pivotun soluna, büyük elemanlar ise sağına yerleştirilir.',
    complexity: {
      time: 'Ortalama: O(n log n), En kötü: O(n²)', 
      space: 'O(log n)'
    },
    steps: [
      'Diziden bir pivot eleman seç',
      'Diziyi pivottan küçük ve büyük elemanlar olarak ikiye ayır',
      'Recursif olarak her iki parçayı aynı yöntemle sırala'
    ]
  },
  'binary search': {
    name: 'İkili Arama (Binary Search)',
    description: 'İkili arama, sıralı bir dizide hedef değeri bulmak için dizinin ortasından başlayarak arama aralığını her adımda yarıya indiren hızlı bir arama algoritmasıdır.',
    complexity: {
      time: 'O(log n)',
      space: 'O(1)'
    },
    steps: [
      'Dizinin ortasındaki elemana bak',
      'Eğer hedef değer ortadaki elemana eşitse, arama tamamlandı',
      'Eğer hedef değer ortadaki elemandan küçükse, sol yarıda aramaya devam et',
      'Eğer hedef değer ortadaki elemandan büyükse, sağ yarıda aramaya devam et',
      'Arama aralığı boş olana kadar yukarıdaki adımları tekrarla'
    ]
  },
  'dijkstra': {
    name: 'Dijkstra Algoritması',
    description: 'Dijkstra algoritması, bir grafta başlangıç düğümünden diğer tüm düğümlere olan en kısa yolları bulan bir algoritma olarak ağırlıklı graflar için kullanılır.',
    complexity: {
      time: 'O((V + E) log V) - Öncelik kuyruğu ile',
      space: 'O(V)'
    },
    steps: [
      'Başlangıç düğümüne 0, diğer tüm düğümlere sonsuz mesafe değeri ata',
      'Ziyaret edilmemiş düğümler kümesini oluştur',
      'Mesafesi en küçük olan ziyaret edilmemiş düğümü seç',
      'Bu düğümün tüm komşularını kontrol et',
      'Eğer mevcut mesafe, bu düğüm üzerinden geçerek hesaplanan mesafeden büyükse, mesafeyi güncelle',
      'Düğümü ziyaret edildi olarak işaretle',
      'Tüm düğümler ziyaret edilene kadar devam et'
    ]
  }
};

// Algoritma kompleksitesini görselleştiren bileşen
export const ComplexityVisualizer: React.FC<{
  timeComplexity: string;
  spaceComplexity: string;
}> = ({ timeComplexity, spaceComplexity }) => {
  // Kompleksite kategorileri ve renkleri
  const getComplexityColor = (complexity: string) => {
    if (complexity.includes('O(1)') || complexity.includes('O(log n)')) {
      return '#27ae60'; // Yeşil - çok iyi
    } else if (complexity.includes('O(n)') || complexity.includes('O(n log n)')) {
      return '#f39c12'; // Turuncu - orta
    } else if (complexity.includes('O(n²)')) {
      return '#e67e22'; // Turuncu kırmızı - kötü
    } else {
      return '#e74c3c'; // Kırmızı - çok kötü
    }
  };

  return (
    <View style={styles.complexityContainer}>
      <View style={styles.complexityItem}>
        <Text style={styles.complexityLabel}>Zaman Karmaşıklığı:</Text>
        <Text style={[styles.complexityValue, { color: getComplexityColor(timeComplexity) }]}>
          {timeComplexity}
        </Text>
      </View>
      <View style={styles.complexityItem}>
        <Text style={styles.complexityLabel}>Alan Karmaşıklığı:</Text>
        <Text style={[styles.complexityValue, { color: getComplexityColor(spaceComplexity) }]}>
          {spaceComplexity}
        </Text>
      </View>
    </View>
  );
};

// Algoritma adımlarını gösteren bileşen
export const StepVisualizer: React.FC<{
  steps: string[];
}> = ({ steps }) => {
  return (
    <View style={styles.stepsContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
};

// Algoritma açıklamasını gösteren bileşen
export const AlgorithmInfoCard: React.FC<{
  algorithmType: string;
}> = ({ algorithmType }) => {
  // Algoritma tipini küçük harfe çevir ve bilgileri al
  const type = algorithmType.toLowerCase();
  const info = algorithmDescriptions[type as keyof typeof algorithmDescriptions];
  
  if (!info) {
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{algorithmType}</Text>
        <Text style={styles.infoText}>Bu algoritma için detaylı bilgi bulunmamaktadır.</Text>
      </View>
    );
  }

  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{info.name}</Text>
      <Text style={styles.infoText}>{info.description}</Text>
      
      <ComplexityVisualizer 
        timeComplexity={info.complexity.time} 
        spaceComplexity={info.complexity.space} 
      />
      
      <Text style={styles.stepsTitle}>Algoritma Adımları:</Text>
      <StepVisualizer steps={info.steps} />
    </View>
  );
};

const styles = StyleSheet.create({
  complexityContainer: {
    marginVertical: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  complexityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  complexityLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  complexityValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepsContainer: {
    marginTop: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 10,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
    marginBottom: 10,
  },
});

export default {
  algorithmDescriptions,
  ComplexityVisualizer,
  StepVisualizer,
  AlgorithmInfoCard
}; 