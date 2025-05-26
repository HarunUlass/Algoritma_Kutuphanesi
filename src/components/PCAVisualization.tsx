import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { 
  Circle, 
  Line, 
  G, 
  Path,
  Text as SvgText,
  Rect
} from 'react-native-svg';
import { AlgorithmInfoCard } from './VisualizationHelpers';
import * as math from 'mathjs'; // MathJS kütüphanesini kullanacağız (projede yüklenmesi gerekebilir)

// PCA için veri tipleri
interface DataPoint {
  id: number;
  x: number;
  y: number;
  z?: number; // 3D veri için (opsiyonel)
  projectedX?: number; // PCA sonrası x koordinatı
  projectedY?: number; // PCA sonrası y koordinatı
  original?: [number, number]; // Orijinal koordinatlar
  color: string;
}

interface EigenVector {
  eigenvalue: number;
  vector: number[];
  color: string;
}

interface PCAVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// SVG boyutları
const { width } = Dimensions.get('window');
const SVG_WIDTH = width - 80;
const SVG_HEIGHT = 300;
const PADDING = 40;

const PCAVisualization: React.FC<PCAVisualizationProps> = ({
  title,
  animationSpeed = 1000
}) => {
  // PCA parametreleri
  const [numComponents, setNumComponents] = useState<number>(2);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [explanationText, setExplanationText] = useState<string>(
    'PCA (Temel Bileşen Analizi) görselleştirmesi. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.'
  );
  const [logs, setLogs] = useState<string[]>([]);
  
  // Veri ve PCA sonuçları
  const [dataset, setDataset] = useState<DataPoint[]>([]);
  const [standardizedData, setStandardizedData] = useState<DataPoint[]>([]);
  const [covarianceMatrix, setCovarianceMatrix] = useState<number[][]>([]);
  const [eigenVectors, setEigenVectors] = useState<EigenVector[]>([]);
  const [projectedData, setProjectedData] = useState<DataPoint[]>([]);
  const [variance, setVariance] = useState<number[]>([]);
  const [varExplained, setVarExplained] = useState<number[]>([]);
  
  // Ölçeklendirme fonksiyonları (veri noktalarını SVG koordinatlarına dönüştürür)
  const scaleX = (x: number) => PADDING + (x - -5) * (SVG_WIDTH - 2 * PADDING) / 10;
  const scaleY = (y: number) => SVG_HEIGHT - PADDING - (y - -5) * (SVG_HEIGHT - 2 * PADDING) / 10;
  
  // Örnek veri oluştur
  useEffect(() => {
    generateData();
  }, []);
  
  // Veri oluşturma
  const generateData = () => {
    // İki küme veri oluştur
    const data: DataPoint[] = [];
    
    // Birinci küme (mavi) - birinci bileşen boyunca daha yüksek varyans
    for (let i = 0; i < 15; i++) {
      const x = 2 + Math.random() * 4 - 1; // 1-5 arası
      const y = 2 + Math.random() * 2 - 1; // 1-3 arası
      data.push({
        id: i,
        x,
        y,
        original: [x, y],
        color: '#3498db', // mavi
      });
    }
    
    // İkinci küme (kırmızı) - birinci bileşen boyunca daha yüksek varyans, farklı bölgede
    for (let i = 15; i < 30; i++) {
      const x = -2 + Math.random() * 4 - 1; // -3-1 arası
      const y = -2 + Math.random() * 2 - 1; // -3--1 arası
      data.push({
        id: i,
        x,
        y,
        original: [x, y],
        color: '#e74c3c', // kırmızı
      });
    }
    
    setDataset(data);
    setStandardizedData([]);
    setCovarianceMatrix([]);
    setEigenVectors([]);
    setProjectedData([]);
    setVariance([]);
    setVarExplained([]);
    setCurrentStep(0);
    setLogs([]);
    
    setExplanationText('PCA (Temel Bileşen Analizi) görselleştirmesi. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.');
  };
  
  // PCA algoritması
  const runPCA = async () => {
    if (isRunning) return;
    
    try {
      setIsRunning(true);
      setCurrentStep(0);
      setLogs([]);
      
      // Adım 1: Veri standardizasyonu
      setCurrentStep(1);
      setExplanationText('Adım 1: Veri Standardizasyonu - Her özelliğin ortalaması 0, varyansı 1 olacak şekilde veriler dönüştürülüyor.');
      setLogs(prev => [...prev, 'Adım 1: Veri standardizasyonu yapılıyor...']);
      
      const standardized = standardizeData(dataset);
      setStandardizedData(standardized);
      await wait(speed);
      
      // Adım 2: Kovaryans matrisini hesapla
      setCurrentStep(2);
      setExplanationText('Adım 2: Kovaryans Matrisi Hesaplanıyor - Özellikler arasındaki ilişkiyi gösteren kovaryans matrisi oluşturuluyor.');
      setLogs(prev => [...prev, 'Adım 2: Kovaryans matrisi hesaplanıyor...']);
      
      const covMatrix = calculateCovarianceMatrix(standardized);
      setCovarianceMatrix(covMatrix);
      await wait(speed);
      
      // Adım 3: Özdeğer ve özvektörleri hesapla
      setCurrentStep(3);
      setExplanationText('Adım 3: Özdeğer ve Özvektörler Hesaplanıyor - Kovaryans matrisinin özdeğer ve özvektörleri, verinin temel bileşenlerini gösterir.');
      setLogs(prev => [...prev, 'Adım 3: Özdeğer ve özvektörler hesaplanıyor...']);
      
      const { eigenValues, eigenVecs } = calculateEigenvaluesAndEigenvectors(covMatrix);
      
      // Özdeğerleri büyükten küçüğe sırala ve özvektörleri de aynı şekilde yeniden düzenle
      const eigenPairs = eigenValues.map((value, index) => ({
        eigenvalue: value,
        vector: eigenVecs[index],
        color: index === 0 ? '#27ae60' : '#8e44ad' // ilk bileşen yeşil, ikinci mor
      }));
      
      eigenPairs.sort((a, b) => b.eigenvalue - a.eigenvalue);
      setEigenVectors(eigenPairs);
      
      // Varyans açıklama oranını hesapla
      const totalVariance = eigenPairs.reduce((sum, pair) => sum + pair.eigenvalue, 0);
      const explainedVariance = eigenPairs.map(pair => pair.eigenvalue / totalVariance);
      
      setVariance(eigenPairs.map(pair => pair.eigenvalue));
      setVarExplained(explainedVariance);
      
      setLogs(prev => [
        ...prev, 
        `Özdeğerler: ${eigenPairs.map(p => p.eigenvalue.toFixed(3)).join(', ')}`,
        `Varyans açıklama oranları: ${explainedVariance.map(v => (v * 100).toFixed(1) + '%').join(', ')}`
      ]);
      
      await wait(speed);
      
      // Adım 4: Verileri yeni boyutlara izdüşür
      setCurrentStep(4);
      setExplanationText(`Adım 4: Boyut İndirgeme - Veriler seçilen ${numComponents} temel bileşen üzerine izdüşürülüyor.`);
      setLogs(prev => [...prev, `Adım 4: Veriler ${numComponents} temel bileşen üzerine izdüşürülüyor...`]);
      
      // Seçilen bileşen sayısına göre özvektör matrisini oluştur
      const componentMatrix = eigenPairs.slice(0, numComponents).map(pair => pair.vector);
      
      // Verileri dönüştür
      const transformed = projectData(standardized, componentMatrix);
      setProjectedData(transformed);
      
      await wait(speed);
      
      // Algoritma tamamlandı
      setCurrentStep(5);
      setExplanationText(`PCA tamamlandı! ${numComponents} temel bileşen, toplam varyansın ${(explainedVariance.slice(0, numComponents).reduce((a, b) => a + b, 0) * 100).toFixed(1)}% 'sini açıklıyor.`);
      setLogs(prev => [...prev, 'PCA algoritması başarıyla tamamlandı!']);
      
    } catch (error) {
      console.error('PCA çalıştırılırken hata oluştu:', error);
      setExplanationText('Algoritma çalıştırılırken bir hata oluştu.');
      setLogs(prev => [...prev, 'HATA: Algoritma çalıştırılırken bir sorun oluştu.']);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Veri standardizasyonu
  const standardizeData = (data: DataPoint[]): DataPoint[] => {
    // Her özellik için ortalama ve standart sapma hesapla
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    
    const meanX = sumX / data.length;
    const meanY = sumY / data.length;
    
    const varX = data.reduce((sum, point) => sum + Math.pow(point.x - meanX, 2), 0) / data.length;
    const varY = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0) / data.length;
    
    const stdX = Math.sqrt(varX);
    const stdY = Math.sqrt(varY);
    
    // Standardize verileri (z-score) hesapla
    return data.map(point => ({
      ...point,
      x: (point.x - meanX) / stdX,
      y: (point.y - meanY) / stdY,
      original: [point.original?.[0] || point.x, point.original?.[1] || point.y],
    }));
  };
  
  // Kovaryans matrisi hesaplama
  const calculateCovarianceMatrix = (data: DataPoint[]): number[][] => {
    const n = data.length;
    let covXX = 0, covXY = 0, covYY = 0;
    
    for (let i = 0; i < n; i++) {
      covXX += data[i].x * data[i].x;
      covXY += data[i].x * data[i].y;
      covYY += data[i].y * data[i].y;
    }
    
    covXX /= n - 1;
    covXY /= n - 1;
    covYY /= n - 1;
    
    return [
      [covXX, covXY],
      [covXY, covYY]
    ];
  };
  
  // Özdeğer ve özvektör hesaplama
  const calculateEigenvaluesAndEigenvectors = (covMatrix: number[][]): { eigenValues: number[], eigenVecs: number[][] } => {
    try {
      // MathJS kütüphanesini kullanarak özdeğer ve özvektör hesaplama
      const matrixA = math.matrix(covMatrix);
      
      // Doğrudan eigs fonksiyonunu kullanmak yerine 
      // covMatrix için özdeğer ve özvektörleri manuel olarak hesaplayalım
      // 2x2 matris için kolayca hesaplanabilir
      
      // trace ve determinantı hesapla
      const a = covMatrix[0][0];
      const b = covMatrix[0][1];
      const c = covMatrix[1][0];
      const d = covMatrix[1][1];
      
      const trace = a + d;
      const det = a * d - b * c;
      
      // Karakteristik denklemin çözümü: λ^2 - trace*λ + det = 0
      const sqrtTerm = Math.sqrt(trace * trace - 4 * det);
      const lambda1 = (trace + sqrtTerm) / 2;
      const lambda2 = (trace - sqrtTerm) / 2;
      
      // Özdeğerler
      const eigenValues = [lambda1, lambda2];
      
      // Özvektörler
      const eigenVecs: number[][] = [];
      
      // İlk özdeğer için özvektör
      if (b !== 0) {
        const v1 = [b, lambda1 - a];
        const norm1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        eigenVecs.push([v1[0] / norm1, v1[1] / norm1]);
      } else if (c !== 0) {
        const v1 = [lambda1 - d, c];
        const norm1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        eigenVecs.push([v1[0] / norm1, v1[1] / norm1]);
      } else {
        // Diyagonal matris
        eigenVecs.push(a >= d ? [1, 0] : [0, 1]);
      }
      
      // İkinci özdeğer için özvektör
      if (b !== 0) {
        const v2 = [b, lambda2 - a];
        const norm2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
        eigenVecs.push([v2[0] / norm2, v2[1] / norm2]);
      } else if (c !== 0) {
        const v2 = [lambda2 - d, c];
        const norm2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
        eigenVecs.push([v2[0] / norm2, v2[1] / norm2]);
      } else {
        // Diyagonal matris
        eigenVecs.push(a < d ? [1, 0] : [0, 1]);
      }
      
      return { eigenValues, eigenVecs };
    } catch (error) {
      console.error('Özdeğer hesaplaması hatası:', error);
      
      // Hata durumunda dummy değerler döndür
      return { 
        eigenValues: [1, 0.5], 
        eigenVecs: [[1, 0], [0, 1]] 
      };
    }
  };
  
  // Verileri yeni boyutlara izdüşürme
  const projectData = (data: DataPoint[], components: number[][]): DataPoint[] => {
    return data.map(point => {
      const originalPoint = [point.x, point.y];
      
      // Noktayı bileşenlere izdüşür
      const projections = components.map(component => {
        return originalPoint[0] * component[0] + originalPoint[1] * component[1];
      });
      
      return {
        ...point,
        projectedX: projections[0],
        projectedY: numComponents > 1 ? projections[1] : 0,
      };
    });
  };
  
  // Bekleme fonksiyonu
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Özvektör oklarını çizme
  const renderEigenVectors = () => {
    if (eigenVectors.length === 0 || currentStep < 3) return null;
    
    return eigenVectors.map((eigen, index) => {
      if (index >= numComponents) return null;
      
      const [v1, v2] = eigen.vector;
      // Özvektörü ölçeklendir
      const scaleFactor = 3 * Math.sqrt(eigen.eigenvalue); // Özdeğerin karekökü ile ölçeklendir
      
      const x1 = scaleX(0);
      const y1 = scaleY(0);
      const x2 = scaleX(v1 * scaleFactor);
      const y2 = scaleY(v2 * scaleFactor);
      
      return (
        <G key={`eigen-${index}`}>
          <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={eigen.color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Ok ucu */}
          <Circle
            cx={x2}
            cy={y2}
            r="5"
            fill={eigen.color}
          />
          <SvgText
            x={x2 + 10}
            y={y2 + 5}
            fill={eigen.color}
            fontSize="12"
            fontWeight="bold"
          >
            PC{index + 1} ({(varExplained[index] * 100).toFixed(1)}%)
          </SvgText>
        </G>
      );
    });
  };
  
  // Veri noktalarını render et
  const renderDataPoints = () => {
    let pointsToRender: DataPoint[] = [];
    
    if (currentStep >= 4) {
      pointsToRender = projectedData;
    } else if (currentStep >= 1) {
      pointsToRender = standardizedData;
    } else {
      pointsToRender = dataset;
    }
    
    return pointsToRender.map(point => (
      <Circle
        key={`point-${point.id}`}
        cx={currentStep >= 4 ? scaleX(point.projectedX || 0) : scaleX(point.x)}
        cy={currentStep >= 4 ? scaleY(point.projectedY || 0) : scaleY(point.y)}
        r="5"
        fill={point.color}
        opacity="0.7"
        stroke="#333"
        strokeWidth="1"
      />
    ));
  };
  
  // Eksen çizgilerini render et
  const renderAxes = () => {
    return (
      <G>
        {/* X ekseni */}
        <Line
          x1={PADDING}
          y1={SVG_HEIGHT - PADDING}
          x2={SVG_WIDTH - PADDING}
          y2={SVG_HEIGHT - PADDING}
          stroke="#333"
          strokeWidth="1"
        />
        {/* Y ekseni */}
        <Line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={SVG_HEIGHT - PADDING}
          stroke="#333"
          strokeWidth="1"
        />
        {/* X ekseni etiketi */}
        <SvgText
          x={SVG_WIDTH / 2}
          y={SVG_HEIGHT - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
        >
          {currentStep >= 4 ? 'PC1' : 'X'}
        </SvgText>
        {/* Y ekseni etiketi */}
        <SvgText
          x={15}
          y={SVG_HEIGHT / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          rotation="-90"
          originX={15}
          originY={SVG_HEIGHT / 2}
        >
          {currentStep >= 4 ? 'PC2' : 'Y'}
        </SvgText>
        {/* Izgara çizgileri */}
        {[-4, -2, 0, 2, 4].map(value => (
          <G key={`grid-${value}`}>
            <Line
              x1={scaleX(value)}
              y1={PADDING}
              x2={scaleX(value)}
              y2={SVG_HEIGHT - PADDING}
              stroke="#ddd"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <Line
              x1={PADDING}
              y1={scaleY(value)}
              x2={SVG_WIDTH - PADDING}
              y2={scaleY(value)}
              stroke="#ddd"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <SvgText
              x={scaleX(value)}
              y={SVG_HEIGHT - PADDING + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {value}
            </SvgText>
            <SvgText
              x={PADDING - 10}
              y={scaleY(value) + 5}
              textAnchor="end"
              fontSize="10"
              fill="#666"
            >
              {value}
            </SvgText>
          </G>
        ))}
        {/* Orjin */}
        <Circle
          cx={scaleX(0)}
          cy={scaleY(0)}
          r="3"
          fill="#333"
        />
      </G>
    );
  };
  
  // Varyans açıklama grafiği
  const renderVarianceExplained = () => {
    if (varExplained.length === 0 || currentStep < 3) return null;
    
    const barWidth = 40;
    const barHeight = 150;
    const spacing = 20;
    
    return (
      <View style={styles.varianceContainer}>
        <Text style={styles.varianceTitle}>Açıklanan Varyans</Text>
        <Svg width={barWidth * 2 + spacing} height={barHeight + 50}>
          {varExplained.map((value, index) => {
            const height = value * barHeight;
            const x = index * (barWidth + spacing);
            const y = barHeight - height;
            
            return (
              <G key={`var-${index}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  fill={eigenVectors[index]?.color || '#333'}
                  opacity="0.7"
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={barHeight + 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#333"
                >
                  PC{index + 1}
                </SvgText>
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#333"
                  fontWeight="bold"
                >
                  {(value * 100).toFixed(1)}%
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };
  
  // Kovaryans matrisini render et
  const renderCovarianceMatrix = () => {
    if (covarianceMatrix.length === 0 || currentStep < 2) return null;
    
    return (
      <View style={styles.covarianceContainer}>
        <Text style={styles.covarianceTitle}>Kovaryans Matrisi</Text>
        <View style={styles.matrixWrapper}>
          <View style={styles.matrixRow}>
            <View style={styles.matrixCell}>
              <Text style={styles.matrixValue}>{covarianceMatrix[0][0].toFixed(2)}</Text>
            </View>
            <View style={styles.matrixCell}>
              <Text style={styles.matrixValue}>{covarianceMatrix[0][1].toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.matrixRow}>
            <View style={styles.matrixCell}>
              <Text style={styles.matrixValue}>{covarianceMatrix[1][0].toFixed(2)}</Text>
            </View>
            <View style={styles.matrixCell}>
              <Text style={styles.matrixValue}>{covarianceMatrix[1][1].toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Algoritma açıklaması */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Kontroller */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={generateData}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔄 Yeni Veri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={runPCA}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isRunning ? '⏳ Çalışıyor...' : '▶️ Algoritmayı Çalıştır'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.paramRow}>
        <Text style={styles.paramLabel}>Hız: {speed}ms</Text>
        <Slider
          style={styles.slider}
          minimumValue={500}
          maximumValue={3000}
          step={100}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isRunning}
        />
      </View>
      
      <View style={styles.paramRow}>
        <Text style={styles.paramLabel}>Bileşen Sayısı: {numComponents}</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={2}
          step={1}
          value={numComponents}
          onValueChange={(value) => setNumComponents(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isRunning}
        />
      </View>
      
      {/* Ana görselleştirme */}
      <View style={styles.visualizationContainer}>
        <Text style={styles.visualizationTitle}>
          {currentStep === 0 ? 'Orijinal Veri' : 
          currentStep === 1 ? 'Standardize Edilmiş Veri' :
          currentStep === 2 ? 'Kovaryans Matrisi' : 
          currentStep === 3 ? 'Özvektörler ve Özdeğerler' :
          currentStep === 4 ? 'İzdüşürülmüş Veri' : 'PCA Sonucu'}
        </Text>
        
        <View style={styles.canvasContainer}>
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
            {renderAxes()}
            {renderDataPoints()}
            {renderEigenVectors()}
          </Svg>
        </View>
        
        <View style={styles.resultsContainer}>
          {renderCovarianceMatrix()}
          {renderVarianceExplained()}
        </View>
      </View>
      
      {/* İlerleme Durumu */}
      {currentStep > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>İlerleme: {currentStep}/5</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentStep / 5) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}
      
      {/* Algoritma Adımları */}
      {logs.length > 0 && (
        <View style={styles.logsContainer}>
          <Text style={styles.sectionTitle}>Algoritma Adımları</Text>
          <ScrollView style={styles.logsScrollView}>
            {logs.map((log, index) => (
              <Text 
                key={index} 
                style={styles.logEntry}
              >
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Algoritma Bilgileri */}
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          <Text style={{fontWeight: 'bold'}}>PCA (Temel Bileşen Analizi):</Text> PCA, çok boyutlu verilerdeki varyansı maksimize eden yeni bir koordinat sistemi bulmayı amaçlar. Bu yeni boyutlar (temel bileşenler), orijinal veri boyutlarının doğrusal kombinasyonlarıdır.
        </Text>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>PCA Algoritması Nasıl Çalışır?</Text>
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>Veriyi standardize et (her özelliğin ortalaması 0, varyansı 1 olacak şekilde)</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>Kovaryans matrisini hesapla</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>Kovaryans matrisinin özdeğer ve özvektörlerini hesapla</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>4.</Text>
            <Text style={styles.stepText}>Özvektörleri özdeğerlerine göre sırala (büyükten küçüğe)</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>5.</Text>
            <Text style={styles.stepText}>En büyük k özdeğere karşılık gelen özvektörleri seç</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>6.</Text>
            <Text style={styles.stepText}>Bu özvektörlerden bir projeksiyon matrisi oluştur</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>7.</Text>
            <Text style={styles.stepText}>Orijinal veriyi bu matris ile çarparak boyut indirgeme işlemini gerçekleştir</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="pca" />
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
    lineHeight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  primaryButtonText: {
    color: 'white',
  },
  paramRow: {
    marginBottom: 12,
  },
  paramLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  visualizationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    elevation: 2,
  },
  visualizationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  covarianceContainer: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f1f8e9',
    marginBottom: 16,
    alignItems: 'center',
  },
  covarianceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  matrixWrapper: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 4,
    overflow: 'hidden',
  },
  matrixRow: {
    flexDirection: 'row',
  },
  matrixCell: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  matrixValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  varianceContainer: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
  },
  varianceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logsScrollView: {
    maxHeight: 150,
  },
  logEntry: {
    fontSize: 13,
    color: '#333',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#e1f5fe',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepsList: {
    marginTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 8,
    width: 16,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default PCAVisualization; 