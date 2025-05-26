import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';

// KNN için veri tipleri
interface DataPoint {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
}

interface TestPoint {
  x: number;
  y: number;
  predictedLabel?: string;
  neighbors?: DataPoint[];
  distances?: { point: DataPoint; distance: number }[];
}

interface KNNVisualizationProps {
  title: string;
  animationSpeed?: number;
}

const { width } = Dimensions.get('window');
const SVG_WIDTH = width - 40;
const SVG_HEIGHT = 300;
const MARGIN = 50;

const KNNVisualization: React.FC<KNNVisualizationProps> = ({
  title,
  animationSpeed = 800
}) => {
  // KNN parametreleri
  const [k, setK] = useState<number>(3);
  const [distanceMetric, setDistanceMetric] = useState<string>('euclidean');
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [testPoint, setTestPoint] = useState<TestPoint | null>(null);
  const [classificationSteps, setClassificationSteps] = useState<string[]>([]);
  const [explanationText, setExplanationText] = useState<string>(
    'KNN algoritması görselleştirmesi. Grafiğe dokunarak yeni bir test noktası ekleyin.'
  );

  // Örnek veri seti - Çiçek sınıflandırma
  const [dataset] = useState<DataPoint[]>([
    // Iris Setosa (Mavi)
    { id: 1, x: 120, y: 80, label: 'Setosa', color: '#3498db' },
    { id: 2, x: 110, y: 90, label: 'Setosa', color: '#3498db' },
    { id: 3, x: 130, y: 75, label: 'Setosa', color: '#3498db' },
    // Iris Versicolor (Yeşil)
    { id: 7, x: 200, y: 150, label: 'Versicolor', color: '#2ecc71' },
    { id: 8, x: 210, y: 140, label: 'Versicolor', color: '#2ecc71' },
    { id: 9, x: 190, y: 160, label: 'Versicolor', color: '#2ecc71' },
    // Iris Virginica (Kırmızı)
    { id: 13, x: 300, y: 220, label: 'Virginica', color: '#e74c3c' },
    { id: 14, x: 310, y: 210, label: 'Virginica', color: '#e74c3c' },
    { id: 15, x: 290, y: 230, label: 'Virginica', color: '#e74c3c' },
  ]);

  // Mesafe hesaplama fonksiyonları
  const calculateEuclideanDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const calculateManhattanDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
  };

  const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return distanceMetric === 'euclidean'
      ? calculateEuclideanDistance(p1, p2)
      : calculateManhattanDistance(p1, p2);
  };

  // KNN Sınıflandırma
  const classifyPoint = async (point: TestPoint): Promise<void> => {
    setIsClassifying(true);
    setClassificationSteps([]);
    setExplanationText('Sınıflandırma başlıyor...');

    try {
      // 1. Tüm noktalarla mesafe hesapla
      const distances = dataset.map(dataPoint => ({
        point: dataPoint,
        distance: calculateDistance(point, dataPoint)
      }));

      // 2. Mesafeleri sırala
      distances.sort((a, b) => a.distance - b.distance);

      // 3. K en yakın komşuyu seç
      const kNearestNeighbors = distances.slice(0, k);

      // 4. Majority voting
      const labelCounts: { [label: string]: number } = {};
      kNearestNeighbors.forEach(neighbor => {
        labelCounts[neighbor.point.label] = (labelCounts[neighbor.point.label] || 0) + 1;
      });

      // 5. Sonucu belirle
      const predictedLabel = Object.entries(labelCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      const confidence = (labelCounts[predictedLabel] / k * 100).toFixed(1);

      // Adımları kaydet
      const steps = [
        `1. Test noktası (${point.x.toFixed(0)}, ${point.y.toFixed(0)}) koordinatlarına yerleştirildi.`,
        `2. En yakın ${k} komşu bulundu:`,
        ...kNearestNeighbors.map((n, i) => 
          `   ${i + 1}. ${n.point.label} (mesafe: ${n.distance.toFixed(1)})`
        ),
        `3. Çoğunluk oylaması sonucu:`,
        ...Object.entries(labelCounts).map(([label, count]) => 
          `   ${label}: ${count} oy (${(count/k*100).toFixed(1)}%)`
        ),
        `4. Tahmin edilen sınıf: ${predictedLabel} (${confidence}% güven)`
      ];
      
      setClassificationSteps(steps);

      // Test noktasını güncelle
      setTestPoint({
        ...point,
        predictedLabel,
        neighbors: kNearestNeighbors.map(n => n.point),
        distances: kNearestNeighbors
      });

      setExplanationText(
        `🎉 Sınıflandırma tamamlandı! Tahmin: ${predictedLabel} (${confidence}% güven)`
      );
    } catch (error) {
      console.error('Sınıflandırma hatası:', error);
      setExplanationText('❌ Sınıflandırma sırasında bir hata oluştu.');
      setClassificationSteps(['Sınıflandırma sırasında bir hata oluştu.']);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {/* Kontroller */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setTestPoint(null);
            setClassificationSteps([]);
            setExplanationText('🔄 KNN sınıflandırması sıfırlandı. Yeni bir nokta eklemek için grafiğe dokunun.');
          }}
          disabled={isClassifying}
        >
          <Text style={styles.buttonText}>🔄 Sıfırla</Text>
        </TouchableOpacity>

        <View style={styles.parameterContainer}>
          <Text style={styles.parameterLabel}>K değeri: {k}</Text>
          <View style={styles.kValueContainer}>
            <TouchableOpacity
              style={styles.kButton}
              onPress={() => k > 1 && setK(k - 1)}
              disabled={isClassifying || k <= 1}
            >
              <Text style={styles.kButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.kValue}>{k}</Text>
            <TouchableOpacity
              style={styles.kButton}
              onPress={() => k < 10 && setK(k + 1)}
              disabled={isClassifying || k >= 10}
            >
              <Text style={styles.kButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Görselleştirme */}
      <View style={styles.visualizationContainer}>
        <TouchableOpacity
          style={styles.canvas}
          onPress={(event) => {
            if (isClassifying) return;

            const { locationX, locationY } = event.nativeEvent;
            
            // Sınırlar içinde olup olmadığını kontrol et
            if (locationX >= 0 && locationX <= SVG_WIDTH && 
                locationY >= 0 && locationY <= SVG_HEIGHT) {
              const newTestPoint: TestPoint = { x: locationX, y: locationY };
              setTestPoint(newTestPoint);
              classifyPoint(newTestPoint);
            }
          }}
        >
          {/* Veri noktaları */}
          {dataset.map(point => (
            <View
              key={point.id}
              style={[
                styles.dataPoint,
                {
                  backgroundColor: point.color,
                  left: point.x - 5,
                  top: point.y - 5,
                  width: testPoint?.neighbors?.some(n => n.id === point.id) ? 16 : 10,
                  height: testPoint?.neighbors?.some(n => n.id === point.id) ? 16 : 10,
                  borderWidth: testPoint?.neighbors?.some(n => n.id === point.id) ? 2 : 1,
                },
              ]}
            />
          ))}

          {/* Test noktası */}
          {testPoint && (
            <View
              style={[
                styles.testPoint,
                {
                  left: testPoint.x - 8,
                  top: testPoint.y - 8,
                  backgroundColor: testPoint.predictedLabel
                    ? dataset.find(d => d.label === testPoint.predictedLabel)?.color || '#95a5a6'
                    : '#95a5a6',
                },
              ]}
            >
              {testPoint.predictedLabel && (
                <Text style={styles.testPointLabel}>
                  {testPoint.predictedLabel}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Açıklama */}
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>

      {/* Sınıflandırma adımları */}
      {classificationSteps.length > 0 && (
        <View style={styles.stepsContainer}>
          {classificationSteps.map((step, index) => (
            <Text key={index} style={styles.stepText}>{step}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  parameterContainer: {
    flex: 1,
    marginLeft: 20,
  },
  parameterLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  kValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kButton: {
    width: 30,
    height: 30,
    backgroundColor: '#3498db',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  kButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  kValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  visualizationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  canvas: {
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderColor: '#333',
  },
  testPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2c3e50',
  },
  testPointLabel: {
    position: 'absolute',
    top: -20,
    width: 80,
    textAlign: 'center',
    left: -32,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  explanationContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 10,
  },
  explanationText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  stepsContainer: {
    backgroundColor: '#8e44ad',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  stepText: {
    color: '#fff',
    marginVertical: 5,
    fontSize: 14,
  },
});

export default KNNVisualization; 