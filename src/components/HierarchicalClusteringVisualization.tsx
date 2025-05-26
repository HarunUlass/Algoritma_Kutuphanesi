import React, { useState, useEffect } from 'react';
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

// Hierarchical Clustering için veri tipleri
interface DataPoint {
  id: number;
  x: number;
  y: number;
  original?: [number, number];
  color: string;
  cluster: number; // Hangi kümeye ait olduğunu gösteren ID
}

interface Cluster {
  id: number;
  points: DataPoint[];
  center: { x: number, y: number };
  color: string;
}

interface HierarchicalClusteringVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// SVG boyutları
const { width } = Dimensions.get('window');
const SVG_WIDTH = width - 80;
const SVG_HEIGHT = 300;
const PADDING = 40;

const COLORS = [
  '#3498db', // mavi
  '#e74c3c', // kırmızı
  '#2ecc71', // yeşil
  '#f39c12', // turuncu
  '#9b59b6', // mor
  '#1abc9c', // turkuaz
  '#d35400', // koyu turuncu
  '#34495e', // lacivert
];

const HierarchicalClusteringVisualization: React.FC<HierarchicalClusteringVisualizationProps> = ({
  title,
  animationSpeed = 1000
}) => {
  // Hierarchical Clustering parametreleri
  const [numClusters, setNumClusters] = useState<number>(3);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [explanationText, setExplanationText] = useState<string>(
    'Hiyerarşik Kümeleme görselleştirmesi. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.'
  );
  const [logs, setLogs] = useState<string[]>([]);
  
  // Veri ve Kümeleme sonuçları
  const [dataset, setDataset] = useState<DataPoint[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [mergeHistory, setMergeHistory] = useState<{step: number, merged: [number, number], newCluster: number}[]>([]);
  const [dendrogram, setDendrogram] = useState<{x1: number, y1: number, x2: number, y2: number, height: number}[]>([]);
  
  // Ölçeklendirme fonksiyonları (veri noktalarını SVG koordinatlarına dönüştürür)
  const scaleX = (x: number) => PADDING + (x - -5) * (SVG_WIDTH - 2 * PADDING) / 10;
  const scaleY = (y: number) => SVG_HEIGHT - PADDING - (y - -5) * (SVG_HEIGHT - 2 * PADDING) / 10;
  
  // Örnek veri oluştur
  useEffect(() => {
    generateData();
  }, []);
  
  // Veri oluşturma
  const generateData = () => {
    // Farklı kümelerden veri noktaları oluştur
    const data: DataPoint[] = [];
    
    // Birinci küme (mavi)
    for (let i = 0; i < 10; i++) {
      const x = 2 + Math.random() * 2 - 1; // 1-3 arası
      const y = 2 + Math.random() * 2 - 1; // 1-3 arası
      data.push({
        id: i,
        x,
        y,
        original: [x, y],
        color: '#3498db', // mavi
        cluster: i, // başlangıçta her nokta kendi kümesi
      });
    }
    
    // İkinci küme (kırmızı)
    for (let i = 10; i < 20; i++) {
      const x = -2 + Math.random() * 2 - 1; // -3--1 arası
      const y = -2 + Math.random() * 2 - 1; // -3--1 arası
      data.push({
        id: i,
        x,
        y,
        original: [x, y],
        color: '#e74c3c', // kırmızı
        cluster: i, // başlangıçta her nokta kendi kümesi
      });
    }
    
    // Üçüncü küme (yeşil)
    for (let i = 20; i < 30; i++) {
      const x = -2 + Math.random() * 2 - 1; // -3--1 arası
      const y = 2 + Math.random() * 2 - 1; // 1-3 arası
      data.push({
        id: i,
        x,
        y,
        original: [x, y],
        color: '#2ecc71', // yeşil
        cluster: i, // başlangıçta her nokta kendi kümesi
      });
    }
    
    setDataset(data);
    
    // Başlangıçta her nokta kendi kümesidir
    const initialClusters = data.map((point, index) => ({
      id: point.id,
      points: [point],
      center: { x: point.x, y: point.y },
      color: point.color
    }));
    
    setClusters(initialClusters);
    setMergeHistory([]);
    setDendrogram([]);
    setCurrentStep(0);
    setLogs([]);
    
    setExplanationText('Hiyerarşik Kümeleme görselleştirmesi. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.');
  };
  
  // İki nokta arasındaki Öklid mesafesini hesapla
  const calculateDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };
  
  // İki küme arasındaki mesafeyi hesapla (ortalama bağlantı yöntemi)
  const calculateClusterDistance = (cluster1: Cluster, cluster2: Cluster): number => {
    let totalDistance = 0;
    let count = 0;
    
    // Her iki kümedeki tüm nokta çiftleri arasındaki mesafelerin ortalaması
    cluster1.points.forEach(p1 => {
      cluster2.points.forEach(p2 => {
        totalDistance += calculateDistance(p1, p2);
        count++;
      });
    });
    
    return totalDistance / count;
  };
  
  // Küme merkezini hesapla
  const calculateClusterCenter = (points: DataPoint[]): { x: number, y: number } => {
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  };
  
  // Hiyerarşik kümeleme algoritması
  const runHierarchicalClustering = async () => {
    if (isRunning) return;
    
    try {
      setIsRunning(true);
      setCurrentStep(0);
      setLogs([]);
      setMergeHistory([]);
      setDendrogram([]);
      
      // Başlangıçta her nokta kendi kümesi
      let currentClusters = [...clusters];
      setLogs(prev => [...prev, 'Adım 0: Başlangıçta her nokta kendi kümesidir. Toplam küme sayısı: ' + currentClusters.length]);
      
      // İstenen küme sayısına ulaşana kadar birleştirmeye devam et
      let step = 1;
      const history: {step: number, merged: [number, number], newCluster: number}[] = [];
      const dendrogramPoints: {x1: number, y1: number, x2: number, y2: number, height: number}[] = [];
      
      while (currentClusters.length > numClusters) {
        setCurrentStep(step);
        
        // En yakın iki kümeyi bul
        let minDistance = Infinity;
        let closestPair: [number, number] = [-1, -1];
        
        for (let i = 0; i < currentClusters.length; i++) {
          for (let j = i + 1; j < currentClusters.length; j++) {
            const distance = calculateClusterDistance(currentClusters[i], currentClusters[j]);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestPair = [i, j];
            }
          }
        }
        
        if (closestPair[0] === -1) break; // Artık birleştirilecek küme kalmadı
        
        // İki kümeyi birleştir
        const [i, j] = closestPair;
        const mergedPoints = [
          ...currentClusters[i].points,
          ...currentClusters[j].points
        ];
        
        // Yeni küme ID'si ve rengi
        const newClusterId = currentClusters.length; // Yeni ID
        const newColor = COLORS[step % COLORS.length]; // Renk döngüsü
        
        // Tüm birleştirilen noktalara yeni küme ID'si ve rengi ata
        mergedPoints.forEach(point => {
          point.cluster = newClusterId;
          point.color = newColor;
        });
        
        // Yeni kümeyi oluştur
        const newCluster: Cluster = {
          id: newClusterId,
          points: mergedPoints,
          center: calculateClusterCenter(mergedPoints),
          color: newColor
        };
        
        // Birleştirme geçmişini kaydet
        history.push({
          step,
          merged: [currentClusters[i].id, currentClusters[j].id],
          newCluster: newClusterId
        });
        
        // Dendrogram görselleştirmesi için veri ekle
        const c1 = currentClusters[i].center;
        const c2 = currentClusters[j].center;
        dendrogramPoints.push({
          x1: scaleX(c1.x),
          y1: scaleY(c1.y),
          x2: scaleX(c2.x),
          y2: scaleY(c2.y),
          height: minDistance
        });
        
        // Eski kümeleri kaldır ve yeni kümeyi ekle
        currentClusters = currentClusters.filter((_, index) => index !== i && index !== j);
        currentClusters.push(newCluster);
        
        // Güncel kümeleri ayarla
        setClusters([...currentClusters]);
        
        // Güncel adım açıklaması
        const explanation = `Adım ${step}: Küme ${currentClusters[i]?.id} ve Küme ${currentClusters[j]?.id} birleştirildi. Kalan küme sayısı: ${currentClusters.length}`;
        setExplanationText(explanation);
        setLogs(prev => [...prev, explanation]);
        
        // Görselleştirme için biraz bekle
        await wait(speed);
        step++;
      }
      
      setMergeHistory(history);
      setDendrogram(dendrogramPoints);
      
      // Algoritma tamamlandı
      setCurrentStep(step);
      setExplanationText(`Hiyerarşik Kümeleme tamamlandı! Toplam ${currentClusters.length} küme oluşturuldu.`);
      setLogs(prev => [...prev, 'Hiyerarşik Kümeleme algoritması başarıyla tamamlandı!']);
      
    } catch (error) {
      console.error('Hiyerarşik Kümeleme çalıştırılırken hata oluştu:', error);
      setExplanationText('Algoritma çalıştırılırken bir hata oluştu.');
      setLogs(prev => [...prev, 'HATA: Algoritma çalıştırılırken bir sorun oluştu.']);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Bekleme fonksiyonu
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Veri noktalarını render et
  const renderDataPoints = () => {
    return dataset.map(point => (
      <Circle
        key={`point-${point.id}`}
        cx={scaleX(point.x)}
        cy={scaleY(point.y)}
        r="5"
        fill={point.color}
        opacity="0.7"
        stroke="#333"
        strokeWidth="1"
      />
    ));
  };
  
  // Küme merkezlerini ve bağlantılarını render et
  const renderClusters = () => {
    if (currentStep === 0) return null;
    
    return clusters.map(cluster => (
      <G key={`cluster-${cluster.id}-${Math.random().toString(36).substring(7)}`}>
        {/* Küme merkezi */}
        <Circle
          cx={scaleX(cluster.center.x)}
          cy={scaleY(cluster.center.y)}
          r="8"
          fill={cluster.color}
          stroke="#333"
          strokeWidth="1.5"
          opacity="0.9"
        />
        
        {/* Küme içindeki her nokta ile merkez arasında bağlantı */}
        {cluster.points.map(point => (
          <Line
            key={`connection-${cluster.id}-${point.id}-${Math.random().toString(36).substring(7)}`}
            x1={scaleX(cluster.center.x)}
            y1={scaleY(cluster.center.y)}
            x2={scaleX(point.x)}
            y2={scaleY(point.y)}
            stroke={cluster.color}
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.5"
          />
        ))}
      </G>
    ));
  };
  
  // Dendrogram görselleştirmesi
  const renderDendrogram = () => {
    if (dendrogram.length === 0 || currentStep < 2) return null;
    
    return dendrogram.map((connection, index) => (
      <G key={`dendrogram-${index}-${Math.random().toString(36).substring(7)}`}>
        <Line
          x1={connection.x1}
          y1={connection.y1}
          x2={connection.x2}
          y2={connection.y2}
          stroke="#666"
          strokeWidth="1.5"
          strokeDasharray="5,2"
        />
        <Circle
          cx={(connection.x1 + connection.x2) / 2}
          cy={(connection.y1 + connection.y2) / 2}
          r="3"
          fill="#666"
        />
        <SvgText
          x={(connection.x1 + connection.x2) / 2 + 5}
          y={(connection.y1 + connection.y2) / 2 - 5}
          fontSize="10"
          fill="#666"
        >
          {connection.height.toFixed(2)}
        </SvgText>
      </G>
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
          X
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
          Y
        </SvgText>
        {/* Izgara çizgileri */}
        {[-4, -2, 0, 2, 4].map(value => (
          <G key={`grid-${value}-${Math.random().toString(36).substring(7)}`}>
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
          onPress={runHierarchicalClustering}
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
        <Text style={styles.paramLabel}>Hedef Küme Sayısı: {numClusters}</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={numClusters}
          onValueChange={(value) => setNumClusters(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isRunning}
        />
      </View>
      
      {/* Ana görselleştirme */}
      <View style={styles.visualizationContainer}>
        <Text style={styles.visualizationTitle}>
          {currentStep === 0 ? 'Orijinal Veri' : 
           `Hiyerarşik Kümeleme - Adım ${currentStep}`}
        </Text>
        
        <View style={styles.canvasContainer}>
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
            {renderAxes()}
            {renderDendrogram()}
            {renderClusters()}
            {renderDataPoints()}
          </Svg>
        </View>
      </View>
      
      {/* İlerleme Durumu */}
      {currentStep > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>İlerleme: Adım {currentStep}</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((currentStep / (dataset.length - numClusters)) * 100, 100)}%` }
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
          <Text style={{fontWeight: 'bold'}}>Hiyerarşik Kümeleme:</Text> Benzer öğeleri hiyerarşik bir ağaç yapısında gruplandıran bir kümeleme algoritmasıdır. İki ana yaklaşım vardır: aşağıdan yukarıya (birleştirici) ve yukarıdan aşağıya (bölücü).
        </Text>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>Hiyerarşik Kümeleme Algoritması Nasıl Çalışır? (Aglomeratif)</Text>
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>Her veri noktası kendi kümesi olarak başlatılır</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>Her iterasyonda, en yakın iki küme birleştirilir</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>Kümeler arası mesafe hesaplanır (tekli bağlantı, tam bağlantı, ortalama bağlantı vb.)</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>4.</Text>
            <Text style={styles.stepText}>İstenen küme sayısına ulaşılıncaya kadar bu süreç devam eder</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>5.</Text>
            <Text style={styles.stepText}>Sonuç bir dendrogram ile gösterilebilir</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="hierarchical" />
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

export default HierarchicalClusteringVisualization; 