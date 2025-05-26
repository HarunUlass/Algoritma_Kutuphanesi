import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  GestureResponderEvent,
  NativeSyntheticEvent,
  NativeTouchEvent,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { AlgorithmInfoCard } from './VisualizationHelpers';

// SVM için veri tipleri
interface DataPoint {
  id: number;
  x: number;
  y: number;
  label: 1 | -1; // Binary classification
  color: string;
  isSupport?: boolean;
}

interface SVMModel {
  weights: { w1: number; w2: number; b: number };
  supportVectors: DataPoint[];
  margin: number;
  accuracy: number;
}

interface SVMVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// SVM Visualization Component
const SVMVisualization: React.FC<SVMVisualizationProps> = ({ 
  title, 
  animationSpeed = 1000 
}) => {
  
  // SVM parametreleri
  const [kernel, setKernel] = useState<string>('linear'); // linear, polynomial, rbf, sigmoid
  const [C, setC] = useState<number>(1.0); // Regularization parameter
  const [gamma, setGamma] = useState<number>(0.1); // RBF kernel parameter
  const [degree, setDegree] = useState<number>(3); // Polynomial degree
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [currentClass, setCurrentClass] = useState<1 | -1>(1);
  
  // Canvas reference and dimensions
  const canvasRef = useRef<View>(null);
  const CANVAS_WIDTH = 350;
  const CANVAS_HEIGHT = 250;
  const CANVAS_PADDING = 50;
  
  // Dataset
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    // Class +1 (Mavi)
    { id: 1, x: 150, y: 100, label: 1, color: '#3498db', isSupport: false },
    { id: 2, x: 180, y: 120, label: 1, color: '#3498db', isSupport: false },
    { id: 3, x: 200, y: 90, label: 1, color: '#3498db', isSupport: false },
    { id: 4, x: 170, y: 80, label: 1, color: '#3498db', isSupport: false },
    { id: 5, x: 190, y: 110, label: 1, color: '#3498db', isSupport: false },
    
    // Class -1 (Kırmızı)
    { id: 6, x: 100, y: 180, label: -1, color: '#e74c3c', isSupport: false },
    { id: 7, x: 80, y: 200, label: -1, color: '#e74c3c', isSupport: false },
    { id: 8, x: 120, y: 190, label: -1, color: '#e74c3c', isSupport: false },
    { id: 9, x: 90, y: 170, label: -1, color: '#e74c3c', isSupport: false },
    { id: 10, x: 110, y: 210, label: -1, color: '#e74c3c', isSupport: false },
  ]);
  
  const [svmModel, setSvmModel] = useState<SVMModel | null>(null);
  const [trainingSteps, setTrainingSteps] = useState<string[]>([]);
  const [explanationText, setExplanationText] = useState<string>(
    'SVM algoritması görselleştirmesi. Grafiğe dokunarak yeni veri noktaları ekleyin, sonra SVM modelini eğitin.'
  );
  
  // Ekran genişliği ölçümü
  const { width } = Dimensions.get('window');
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Canvas touch handler
  const handleCanvasPress = (event: NativeTouchEvent): void => {
    if (isTraining) return;
    
    // Get touch coordinates relative to the canvas
    const x = event.locationX;
    const y = event.locationY;
    
    // Check if within canvas bounds
    if (x >= CANVAS_PADDING && x <= CANVAS_WIDTH - CANVAS_PADDING && 
        y >= CANVAS_PADDING && y <= CANVAS_HEIGHT - CANVAS_PADDING) {
      
      const newPoint: DataPoint = {
        id: Date.now(),
        x,
        y,
        label: currentClass,
        color: currentClass === 1 ? '#3498db' : '#e74c3c',
        isSupport: false
      };
      
      setDataPoints(prev => [...prev, newPoint]);
      setExplanationText(`✨ Yeni ${currentClass === 1 ? 'pozitif' : 'negatif'} sınıf noktası eklendi: (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
  };
  
  // Render data point
  const renderDataPoint = (point: DataPoint): React.ReactElement => {
    return (
      <View 
        key={point.id}
        style={[
          styles.dataPoint,
          { 
            left: point.x - 6, 
            top: point.y - 6,
            backgroundColor: point.color,
          },
          point.isSupport && styles.supportVector
        ]}
      >
        <Text style={styles.dataPointLabel}>
          {point.label === 1 ? '+' : '-'}
        </Text>
      </View>
    );
  };
  
  // Render hyperplane for linear SVM
  const renderHyperplane = (): React.ReactElement => {
    if (!svmModel) return <></>;
    
    const { w1, w2, b } = svmModel.weights;
    
    // Calculate line endpoints that span the canvas
    const x1 = CANVAS_PADDING;
    const x2 = CANVAS_WIDTH - CANVAS_PADDING;
    
    // Solving for y in the equation w1*x + w2*y + b = 0
    const y1 = w2 !== 0 ? (-w1 * x1 - b) / w2 : 0;
    const y2 = w2 !== 0 ? (-w1 * x2 - b) / w2 : 0;
    
    // Draw decision boundary
    return (
      <View style={[
        styles.hyperplane,
        {
          left: x1,
          top: y1,
          width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
          transform: [
            { translateY: -1 }, // Adjust for line thickness
            { rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` },
            { translateX: -0.5 * Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) } // Center pivot
          ]
        }
      ]} />
    );
  };
  
  // Kernel functions
  const kernelFunction = (xi: DataPoint, xj: DataPoint): number => {
    switch (kernel) {
      case 'linear':
        return xi.x * xj.x + xi.y * xj.y;
      
      case 'polynomial':
        return Math.pow(xi.x * xj.x + xi.y * xj.y + 1, degree);
      
      case 'rbf':
        const distance = Math.pow(xi.x - xj.x, 2) + Math.pow(xi.y - xj.y, 2);
        return Math.exp(-gamma * distance);
      
      case 'sigmoid':
        return Math.tanh(gamma * (xi.x * xj.x + xi.y * xj.y) + 1);
      
      default:
        return xi.x * xj.x + xi.y * xj.y;
    }
  };
  
  // SVM Training
  const trainSVM = async (): Promise<void> => {
    setIsTraining(true);
    setTrainingSteps([]);
    setSvmModel(null);
    
    if (dataPoints.length < 4) {
      setExplanationText('❌ En az 4 veri noktası gerekiyor (her sınıftan en az 2 tane)!');
      setIsTraining(false);
      return;
    }
    
    const posPoints = dataPoints.filter(p => p.label === 1);
    const negPoints = dataPoints.filter(p => p.label === -1);
    
    if (posPoints.length < 2 || negPoints.length < 2) {
      setExplanationText('❌ Her sınıftan en az 2 veri noktası gerekiyor!');
      setIsTraining(false);
      return;
    }
    
    setExplanationText(`🧮 SVM eğitimi başlıyor: ${kernel} kernel, C=${C}`);
    await wait(speed);
    
    setTrainingSteps(prev => [...prev, 
      `Adım 1: ${kernel} kernel fonksiyonu ile ${dataPoints.length} veri noktası işleniyor`
    ]);
    await wait(speed);
    
    // Linear SVM for visualization
    if (kernel === 'linear') {
      await trainLinearSVM(posPoints, negPoints);
    } else {
      await trainNonLinearSVM();
    }
    
    setIsTraining(false);
  };
  
  // Linear SVM training simulation
  const trainLinearSVM = async (posPoints: DataPoint[], negPoints: DataPoint[]): Promise<void> => {
    setTrainingSteps(prev => [...prev, 
      `Adım 2: Linear kernel için optimal hyperplane aranıyor`
    ]);
    await wait(speed);
    
    // Find approximate optimal hyperplane (simplified)
    const posCenter = {
      x: posPoints.reduce((sum, p) => sum + p.x, 0) / posPoints.length,
      y: posPoints.reduce((sum, p) => sum + p.y, 0) / posPoints.length
    };
    
    const negCenter = {
      x: negPoints.reduce((sum, p) => sum + p.x, 0) / negPoints.length,
      y: negPoints.reduce((sum, p) => sum + p.y, 0) / negPoints.length
    };
    
    setTrainingSteps(prev => [...prev, 
      `Adım 3: Sınıf merkezleri hesaplandı - Pozitif: (${posCenter.x.toFixed(1)}, ${posCenter.y.toFixed(1)}), Negatif: (${negCenter.x.toFixed(1)}, ${negCenter.y.toFixed(1)})`
    ]);
    await wait(speed);
    
    // Hyperplane direction vector
    const direction = {
      x: posCenter.x - negCenter.x,
      y: posCenter.y - negCenter.y
    };
    
    // Normal vector (perpendicular)
    const normal = {
      x: -direction.y,
      y: direction.x
    };
    
    // Normalize
    const norm = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    const w1 = normal.x / norm;
    const w2 = normal.y / norm;
    
    // Bias (hyperplane passes through midpoint)
    const midpoint = {
      x: (posCenter.x + negCenter.x) / 2,
      y: (posCenter.y + negCenter.y) / 2
    };
    const b = -(w1 * midpoint.x + w2 * midpoint.y);
    
    setTrainingSteps(prev => [...prev, 
      `Adım 4: Hyperplane parametreleri - w1: ${w1.toFixed(3)}, w2: ${w2.toFixed(3)}, b: ${b.toFixed(3)}`
    ]);
    await wait(speed);
    
    // Find support vectors (simplified - closest points to hyperplane)
    const distances = dataPoints.map(point => ({
      point,
      distance: Math.abs(w1 * point.x + w2 * point.y + b)
    }));
    
    distances.sort((a, b) => a.distance - b.distance);
    const supportVectors = distances.slice(0, Math.min(3, dataPoints.length)).map(d => {
      const point = { ...d.point, isSupport: true };
      return point;
    });
    
    setTrainingSteps(prev => [...prev, 
      `Adım 5: ${supportVectors.length} support vector belirlendi`
    ]);
    await wait(speed);
    
    // Update data points to mark support vectors
    setDataPoints(prev => prev.map(p => ({
      ...p,
      isSupport: supportVectors.some(sv => sv.id === p.id)
    })));
    
    // Calculate margin
    const margin = supportVectors.length > 0 ? distances[0].distance * 2 : 0;
    
    // Calculate accuracy
    const predictions = dataPoints.map(point => {
      const prediction = w1 * point.x + w2 * point.y + b;
      return prediction > 0 ? 1 : -1;
    });
    
    const correct = predictions.filter((pred, i) => pred === dataPoints[i].label).length;
    const accuracy = (correct / dataPoints.length) * 100;
    
    setTrainingSteps(prev => [...prev, 
      `Sonuç: Margin = ${margin.toFixed(2)}, Accuracy = ${accuracy.toFixed(1)}%`
    ]);
    
    const model: SVMModel = {
      weights: { w1, w2, b },
      supportVectors,
      margin,
      accuracy
    };
    
    setSvmModel(model);
    
    setExplanationText(
      `🎉 Linear SVM eğitimi tamamlandı! Accuracy: ${accuracy.toFixed(1)}%, Margin: ${margin.toFixed(2)}`
    );
  };
  
  // Non-linear SVM simulation
  const trainNonLinearSVM = async (): Promise<void> => {
    setTrainingSteps(prev => [...prev, 
      `Adım 2: ${kernel} kernel ile feature space'e mapping yapılıyor`
    ]);
    await wait(speed);
    
    setTrainingSteps(prev => [...prev, 
      `Adım 3: Kernel trick kullanılarak yüksek boyutlu space'te optimal hyperplane aranıyor`
    ]);
    await wait(speed);
    
    // Simplified non-linear classification
    const supportVectors = dataPoints.slice(0, Math.min(4, dataPoints.length)).map(p => ({
      ...p,
      isSupport: true
    }));
    
    setDataPoints(prev => prev.map(p => ({
      ...p,
      isSupport: supportVectors.some(sv => sv.id === p.id)
    })));
    
    setTrainingSteps(prev => [...prev, 
      `Adım 4: ${supportVectors.length} support vector belirlendi`
    ]);
    await wait(speed);
    
    // Simulate accuracy for non-linear kernels
    const accuracy = 85 + Math.random() * 10; // 85-95% range
    
    setTrainingSteps(prev => [...prev, 
      `Sonuç: Non-linear ${kernel} kernel ile Accuracy = ${accuracy.toFixed(1)}%`
    ]);
    
    const model: SVMModel = {
      weights: { w1: 0, w2: 0, b: 0 }, // Not applicable for non-linear
      supportVectors,
      margin: 0, // Complex for non-linear
      accuracy
    };
    
    setSvmModel(model);
    
    setExplanationText(
      `🎉 ${kernel} SVM eğitimi tamamlandı! Accuracy: ${accuracy.toFixed(1)}%`
    );
  };
  
  // Reset function
  const resetSVM = (): void => {
    setDataPoints([
      // Default dataset
      { id: 1, x: 150, y: 100, label: 1, color: '#3498db', isSupport: false },
      { id: 2, x: 180, y: 120, label: 1, color: '#3498db', isSupport: false },
      { id: 3, x: 200, y: 90, label: 1, color: '#3498db', isSupport: false },
      { id: 4, x: 170, y: 80, label: 1, color: '#3498db', isSupport: false },
      { id: 5, x: 190, y: 110, label: 1, color: '#3498db', isSupport: false },
      { id: 6, x: 100, y: 180, label: -1, color: '#e74c3c', isSupport: false },
      { id: 7, x: 80, y: 200, label: -1, color: '#e74c3c', isSupport: false },
      { id: 8, x: 120, y: 190, label: -1, color: '#e74c3c', isSupport: false },
      { id: 9, x: 90, y: 170, label: -1, color: '#e74c3c', isSupport: false },
      { id: 10, x: 110, y: 210, label: -1, color: '#e74c3c', isSupport: false },
    ]);
    setSvmModel(null);
    setTrainingSteps([]);
    setExplanationText('🔄 SVM sıfırlandı. Yeni veri noktaları ekleyebilir veya mevcut verilerle eğitim başlatabilirsiniz.');
  };
  
  // Clear all points
  const clearPoints = (): void => {
    setDataPoints([]);
    setSvmModel(null);
    setTrainingSteps([]);
    setExplanationText('🧹 Tüm veri noktaları temizlendi. Grafiğe dokunarak yeni noktalar ekleyin.');
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Kontroller */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={resetSVM}
          disabled={isTraining}
        >
          <Text style={styles.buttonText}>🔄 Sıfırla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={clearPoints}
          disabled={isTraining}
        >
          <Text style={styles.buttonText}>🧹 Temizle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={trainSVM}
          disabled={isTraining}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isTraining ? '🧮 Eğitiliyor...' : '🚀 SVM Eğit'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.speedContainer}>
        <Text style={styles.sliderLabel}>Hız: {speed}ms</Text>
        <Slider
          style={styles.slider}
          minimumValue={400}
          maximumValue={1500}
          step={100}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isTraining}
        />
      </View>
      
      {/* Class Selection */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>Veri Noktası Ekleme</Text>
        <View style={styles.classButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.classButton, 
              currentClass === 1 && styles.positiveClassButton
            ]}
            onPress={() => setCurrentClass(1)}
            disabled={isTraining}
          >
            <Text style={[
              styles.classButtonText,
              currentClass === 1 && styles.activeClassButtonText
            ]}>
              + Pozitif Sınıf
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.classButton, 
              currentClass === -1 && styles.negativeClassButton
            ]}
            onPress={() => setCurrentClass(-1)}
            disabled={isTraining}
          >
            <Text style={[
              styles.classButtonText,
              currentClass === -1 && styles.activeClassButtonText
            ]}>
              - Negatif Sınıf
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* SVM Parametreleri */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>SVM Parametreleri</Text>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Kernel Fonksiyonu:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={kernel}
              style={styles.picker}
              onValueChange={(itemValue: string) => setKernel(itemValue)}
              enabled={!isTraining}
            >
              <Picker.Item label="Linear" value="linear" />
              <Picker.Item label="Polynomial" value="polynomial" />
              <Picker.Item label="RBF (Gaussian)" value="rbf" />
              <Picker.Item label="Sigmoid" value="sigmoid" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>C (Regularization): {C.toFixed(1)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={10.0}
            step={0.1}
            value={C}
            onValueChange={(value) => setC(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
        </View>
        
        {(kernel === 'rbf' || kernel === 'sigmoid') && (
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Gamma: {gamma.toFixed(2)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.01}
              maximumValue={1.0}
              step={0.01}
              value={gamma}
              onValueChange={(value) => setGamma(value)}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#000000"
              disabled={isTraining}
            />
          </View>
        )}
        
        {kernel === 'polynomial' && (
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Degree: {degree}</Text>
            <Slider
              style={styles.slider}
              minimumValue={2}
              maximumValue={5}
              step={1}
              value={degree}
              onValueChange={(value) => setDegree(value)}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#000000"
              disabled={isTraining}
            />
          </View>
        )}
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{fontWeight: 'bold'}}>🎯 SVM:</Text> Maximum margin ile optimal hyperplane bulur. 
            Kernel trick ile non-linear separable data'yı classify eder.
          </Text>
        </View>
      </View>
      
      {/* Açıklama */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Interactive SVM Visualization */}
      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>🎯 Interaktif SVM Sınıflandırma</Text>
        
        <TouchableOpacity 
          activeOpacity={isTraining ? 1 : 0.7}
          disabled={isTraining}
          onPress={(event) => handleCanvasPress(event.nativeEvent)}
          style={styles.canvas}
        >
          {/* Background */}
          <View style={styles.canvasBackground} />
          
          {/* Grid lines (horizontal) */}
          {[50, 100, 150, 200].map(y => (
            <View 
              key={`h-${y}`} 
              style={[styles.gridLine, { top: y, width: '100%', height: 1 }]} 
            />
          ))}
          
          {/* Grid lines (vertical) */}
          {[50, 100, 150, 200, 250, 300].map(x => (
            <View 
              key={`v-${x}`} 
              style={[styles.gridLine, { left: x, width: 1, height: 200 }]} 
            />
          ))}
          
          {/* Decision boundary (hyperplane) - for linear kernel only */}
          {svmModel && kernel === 'linear' && renderHyperplane()}
          
          {/* Data points */}
          {dataPoints.map(point => renderDataPoint(point))}
          
          {/* Axes labels */}
          <Text style={[styles.axisLabel, { bottom: 5, alignSelf: 'center' }]}>
            Feature 1
          </Text>
          <Text style={[styles.axisLabel, { 
            left: 5, 
            alignSelf: 'center', 
            transform: [{ rotate: '-90deg' }],
            position: 'absolute',
            top: 100,
          }]}>
            Feature 2
          </Text>
        </TouchableOpacity>
        
        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
              <Text style={styles.legendText}>Pozitif Sınıf (+1)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
              <Text style={styles.legendText}>Negatif Sınıf (-1)</Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { 
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: '#f39c12'
              }]} />
              <Text style={styles.legendText}>Support Vector</Text>
            </View>
            {kernel === 'linear' && (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { 
                  width: 20, 
                  height: 2, 
                  borderRadius: 0,
                  backgroundColor: '#2c3e50' 
                }]} />
                <Text style={styles.legendText}>Hyperplane</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* Training Steps */}
      {trainingSteps.length > 0 && (
        <View style={styles.trainingStepsContainer}>
          <Text style={styles.sectionTitle}>🧮 SVM Eğitim Adımları</Text>
          <View style={styles.stepsListContainer}>
            {trainingSteps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* SVM Model Results */}
      {svmModel && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>📊 SVM Model Sonuçları</Text>
          <View style={styles.resultsGrid}>
            <View style={styles.resultsCard}>
              <Text style={styles.resultCardTitle}>Model Parametreleri</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Kernel:</Text>
                <Text style={styles.resultValue}>{kernel}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>C Parameter:</Text>
                <Text style={styles.resultValue}>{C.toFixed(1)}</Text>
              </View>
              {kernel === 'linear' && (
                <>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>w1:</Text>
                    <Text style={styles.resultValue}>{svmModel.weights.w1.toFixed(3)}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>w2:</Text>
                    <Text style={styles.resultValue}>{svmModel.weights.w2.toFixed(3)}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>bias (b):</Text>
                    <Text style={styles.resultValue}>{svmModel.weights.b.toFixed(3)}</Text>
                  </View>
                </>
              )}
            </View>
            
            <View style={styles.resultsCard}>
              <Text style={styles.resultCardTitle}>Model Performance</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Accuracy:</Text>
                <Text style={styles.resultValue}>{svmModel.accuracy.toFixed(1)}%</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Support Vectors:</Text>
                <Text style={styles.resultValue}>{svmModel.supportVectors.length}</Text>
              </View>
              {kernel === 'linear' && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Margin:</Text>
                  <Text style={styles.resultValue}>{svmModel.margin.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Points:</Text>
                <Text style={styles.resultValue}>{dataPoints.length}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Final Result */}
      {svmModel && (
        <View style={styles.finalResultContainer}>
          <Text style={styles.finalResultTitle}>🏆 SVM Sınıflandırma Sonucu</Text>
          <Text style={styles.finalResultValue}>
            Accuracy: {svmModel.accuracy.toFixed(1)}%
          </Text>
          <Text style={styles.finalResultDetail}>
            Kernel: {kernel}, Support Vectors: {svmModel.supportVectors.length}
          </Text>
          <Text style={styles.finalResultDetail}>
            C = {C}, {kernel === 'rbf' || kernel === 'sigmoid' ? `Gamma = ${gamma}` : ''} 
            {kernel === 'polynomial' ? `Degree = ${degree}` : ''}
          </Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="svm" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    maxWidth: '30%',
  },
  primaryButton: {
    backgroundColor: '#6c5ce7',
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButtonText: {
    color: 'white',
  },
  speedContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  paramsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  classButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  classButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  positiveClassButton: {
    backgroundColor: '#3498db',
  },
  negativeClassButton: {
    backgroundColor: '#e74c3c',
  },
  classButtonText: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  activeClassButtonText: {
    color: 'white',
  },
  paramRow: {
    marginBottom: 12,
  },
  paramLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  infoBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    padding: 10,
    marginTop: 15,
  },
  infoBoxText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  explanationBox: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  explanationText: {
    fontSize: 14,
    color: '#333',
  },
  environmentContainer: {
    marginBottom: 16,
    position: 'relative',
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  canvas: {
    position: 'relative',
    width: '100%',
    height: 250,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  canvasBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#eee',
  },
  axisLabel: {
    fontSize: 12,
    color: '#2c3e50',
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dataPointLabel: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  supportVector: {
    borderColor: '#f39c12',
    borderWidth: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  hyperplane: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#2c3e50',
    zIndex: 5,
  },
  legendContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
  },
  trainingStepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  stepsListContainer: {
    marginTop: 8,
  },
  stepItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepText: {
    fontSize: 14,
    color: '#333',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultsCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
  },
  resultValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  finalResultContainer: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  finalResultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  finalResultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  finalResultDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  infoContainer: {
    marginBottom: 24,
  },
});

export default SVMVisualization; 