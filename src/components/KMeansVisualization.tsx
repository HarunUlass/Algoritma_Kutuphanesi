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
import { AlgorithmInfoCard } from './VisualizationHelpers';

// Canvas boyutları - Ekrana daha iyi sığması için küçültüldü
const CANVAS_WIDTH = Dimensions.get('window').width - 80;
const CANVAS_HEIGHT = 250;

// K-Means için veri tipleri
interface DataPoint {
  id: number;
  x: number;
  y: number;
  cluster: number;
  distanceToCentroid?: number;
}

interface Centroid {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface KMeansVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// K-Means renkleri
const CLUSTER_COLORS = [
  '#3498db', // mavi
  '#e74c3c', // kırmızı
  '#2ecc71', // yeşil
  '#f39c12', // turuncu
  '#9b59b6', // mor
  '#1abc9c', // turkuaz
  '#34495e', // lacivert
  '#e67e22', // turuncu-kahve
];

const KMeansVisualization: React.FC<KMeansVisualizationProps> = ({
  title,
  animationSpeed = 1200
}) => {
  // K-Means parametreleri
  const [k, setK] = useState<number>(3);
  const [maxIterations, setMaxIterations] = useState<number>(10);
  const [datasetSize, setDatasetSize] = useState<number>(30);
  const [convergenceThreshold, setConvergenceThreshold] = useState<number>(0.1);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIteration, setCurrentIteration] = useState<number>(0);
  
  // K-Means veri ve sonuçları
  const [dataset, setDataset] = useState<DataPoint[]>([]);
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  const [previousCentroids, setPreviousCentroids] = useState<Centroid[]>([]);
  const [stepDescription, setStepDescription] = useState<string>(
    'K-Means kümeleme algoritması görselleştirmesi. Algoritma adımlarını görmek için "Algoritmayı Çalıştır" butonuna basın.'
  );
  const [hasConverged, setHasConverged] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Canvas boyutları
  const canvasWidth = CANVAS_WIDTH;
  const canvasHeight = CANVAS_HEIGHT;
  
  // Veri oluşturma
  const generateData = () => {
    // Yeni rastgele veri noktaları oluştur
    const newDataset: DataPoint[] = [];
    
    // Birkaç cluster etrafında veri noktaları oluştur
    const clusterCenters = [
      { x: canvasWidth * 0.2, y: canvasHeight * 0.2 },
      { x: canvasWidth * 0.8, y: canvasHeight * 0.2 },
      { x: canvasWidth * 0.5, y: canvasHeight * 0.8 },
    ];
    
    for (let i = 0; i < datasetSize; i++) {
      const clusterIndex = i % clusterCenters.length;
      const center = clusterCenters[clusterIndex];
      
      // Cluster merkezinin etrafında rastgele nokta oluştur
      const x = Math.max(10, Math.min(canvasWidth - 10, center.x + (Math.random() - 0.5) * canvasWidth * 0.4));
      const y = Math.max(10, Math.min(canvasHeight - 10, center.y + (Math.random() - 0.5) * canvasHeight * 0.4));
      
      newDataset.push({
        id: i,
        x,
        y,
        cluster: -1, // Henüz atanmamış
      });
    }
    
    // Eski verileri temizlemeden doğrudan yeni verileri set et
    setDataset(newDataset);
    setCentroids([]);
    setPreviousCentroids([]);
    setCurrentIteration(0);
    setHasConverged(false);
    setLogs([]);
    setStepDescription('Yeni veri kümesi oluşturuldu. "Algoritmayı Çalıştır" butonu ile kümeleme başlatın.');
  };
  
  // İlk yükleme
  useEffect(() => {
    // İlk kez çalıştığında veya veri olmadığında veri oluştur
    if (dataset.length === 0) {
      generateData();
    } else if (dataset.length !== datasetSize) {
      // Sadece veri boyutu değiştiğinde yeni veri oluştur
      generateData();
    }
  }, [datasetSize]);
  
  // Veri noktaları ve merkezlerin görüntülemesini korumak için ek bir useEffect
  useEffect(() => {
    // Dataset veya centroids değiştiğinde algoritma açıklamasını güncelle
    if (centroids.length > 0) {
      if (currentIteration === 0) {
        setStepDescription(`Adım 1: ${k} adet merkez noktası (centroid) seçildi. Bu noktalar veri kümesinden rastgele seçilen noktalardan oluşur.`);
      }
    } else if (dataset.length > 0) {
      setStepDescription('K-Means kümeleme algoritması görselleştirmesi. Algoritma adımlarını görmek için "Algoritmayı Çalıştır" butonuna basın.');
    }
  }, [dataset, centroids, k, currentIteration]);
  
  // Algoritma adımları
  const runKMeansAlgorithm = async () => {
    if (isRunning) return;
    
    try {
      // Eğer veri noktaları yoksa, yeni veri oluştur
      if (dataset.length === 0) {
        generateData();
        // Verilerin render olması için kısa bir bekleme
        await wait(1000);
      }
      
      setIsRunning(true);
      setHasConverged(false);
      setCurrentIteration(0);
      setLogs([]);
      
      // 1. Centroid'leri başlat
      initializeCentroids();
      console.log("Centroidler başlatıldı:", centroids.length);
      
      // Ekranın güncellenmesi için bekle
      await wait(2000);
      
      // 2. Ana döngü - Basit adım adım yaklaşım
      let iteration = 1;
      let converged = false;
      
      while (iteration <= maxIterations && !converged) {
        console.log(`İterasyon ${iteration} başlıyor`);
        // İterasyon sayısını güncelle
        setCurrentIteration(iteration);
        
        // Adım 1: Noktaları kümelere ata
        console.log("Noktalar kümelere atanıyor...");
        // Her nokta için en yakın centroid'i bul
        const newDataset = [...dataset].map(point => {
          let minDistance = Infinity;
          let closestCluster = -1;
          
          centroids.forEach(centroid => {
            const distance = Math.sqrt(
              Math.pow(point.x - centroid.x, 2) + 
              Math.pow(point.y - centroid.y, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestCluster = centroid.id;
            }
          });
          
          return {
            ...point,
            cluster: closestCluster,
            distanceToCentroid: minDistance
          };
        });
        
        // Dataset'i güncelle
        setDataset(newDataset);
        
        setLogs(prevLogs => [
          ...prevLogs,
          `Adım 2 (İterasyon ${iteration}): Veri noktaları en yakın merkez noktalarına atandı.`
        ]);
        
        setStepDescription(`Adım 2 (İterasyon ${iteration}): Her veri noktası, kendisine en yakın merkez noktasına atandı.`);
        
        // Ekranın güncellenmesi için bekle
        await wait(2000);
        console.log("Noktalar kümelere atandı, dataset güncellendi");
        
        // Adım 2: Centroid'leri güncelle
        console.log("Centroidler güncelleniyor...");
        // Önceki centroid'leri kaydet
        setPreviousCentroids([...centroids]);
        
        const newCentroids = centroids.map(centroid => {
          // Bu centroid'e ait tüm noktaları bul
          const clusterPoints = newDataset.filter(p => p.cluster === centroid.id);
          
          if (clusterPoints.length === 0) {
            return centroid;
          }
          
          // Yeni centroid pozisyonu, tüm küme noktalarının ortalaması
          const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0);
          const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0);
          
          return {
            ...centroid,
            x: sumX / clusterPoints.length,
            y: sumY / clusterPoints.length
          };
        });
        
        // Centroidleri güncelle
        setCentroids(newCentroids);
        
        setLogs(prevLogs => [
          ...prevLogs,
          `Adım 3 (İterasyon ${iteration}): Merkez noktaları, kümedeki noktaların ortalamasına göre güncellendi.`
        ]);
        
        setStepDescription(`Adım 3 (İterasyon ${iteration}): Her merkez noktası (centroid), kümesindeki tüm noktaların ortalama konumuna taşındı.`);
        
        // Ekranın güncellenmesi için bekle
        await wait(2000);
        console.log("Centroidler güncellendi");
        
        // Adım 3: Yakınsama kontrolü
        console.log("Yakınsama kontrolü yapılıyor...");
        if (previousCentroids.length > 0) {
          let totalMovement = 0;
          
          for (let i = 0; i < newCentroids.length; i++) {
            const movement = Math.sqrt(
              Math.pow(newCentroids[i].x - previousCentroids[i].x, 2) + 
              Math.pow(newCentroids[i].y - previousCentroids[i].y, 2)
            );
            totalMovement += movement;
          }
          
          const avgMovement = totalMovement / newCentroids.length;
          converged = avgMovement < convergenceThreshold;
          
          if (converged) {
            setHasConverged(true);
            
            setLogs(prevLogs => [
              ...prevLogs,
              `Algoritma yakınsadı! Merkez noktaları yeterince sabit hale geldi (Ortalama hareket: ${avgMovement.toFixed(4)}).`
            ]);
            
            setStepDescription(`✅ Algoritma yakınsadı! Merkez noktaları yeterince sabit hale geldi (Ortalama hareket: ${avgMovement.toFixed(4)}). Bu, algoritmanın optimum kümeleri bulduğunu gösterir.`);
            
            console.log("Algoritma yakınsadı, döngüden çıkılıyor");
          }
        }
        
        // Bir sonraki iterasyona geç
        iteration++;
        
        // İterasyonlar arası kısa bekleme
        await wait(1000);
        console.log(`İterasyon ${iteration-1} tamamlandı`);
      }
      
      // Algoritma tamamlandı - Sonuçları göster
      if (!converged) {
        setLogs(prevLogs => [
          ...prevLogs,
          `Maksimum iterasyon sayısına (${maxIterations}) ulaşıldı. Algoritma durdu.`
        ]);
        
        setStepDescription(`⚠️ Maksimum iterasyon sayısına (${maxIterations}) ulaşıldı. Algoritma durdu, ancak tam olarak yakınsamadı. Daha fazla iterasyon gerekebilir.`);
      } else {
        setStepDescription(`✅ Algoritma yakınsadı! Kümeler başarıyla oluşturuldu. Sonuçları inceleyebilirsiniz.`);
      }
      
      // Son sonuçları hesapla
      const clusterSizes = centroids.map(centroid => {
        return dataset.filter(p => p.cluster === centroid.id).length;
      });
      
      const totalWithinClusterDistance = centroids.reduce((total, centroid, index) => {
        const clusterPoints = dataset.filter(p => p.cluster === centroid.id);
        const clusterTotalDistance = clusterPoints.reduce((sum, p) => {
          return sum + (p.distanceToCentroid || 0);
        }, 0);
        return total + clusterTotalDistance;
      }, 0);
      
      setLogs(prevLogs => [
        ...prevLogs,
        `Sonuç İstatistikleri:`,
        `- Küme boyutları: ${clusterSizes.map((size, i) => `Küme ${i+1}: ${size}`).join(', ')}`,
        `- Toplam küme içi mesafe: ${totalWithinClusterDistance.toFixed(2)}`
      ]);
      
      console.log("Algoritma tamamlandı, sonuçlar hesaplandı");
      
      // Sonuçları çok uzun süre göster (kullanıcı istediğinde Sıfırla butonu ile kaldırabilir)
      // 5 dakika boyunca sonuçları göster
      await wait(300000);
      
    } catch (error) {
      console.error("K-Means algoritması çalışırken hata:", error);
      setStepDescription(`❌ Algoritma çalışırken bir hata oluştu. Lütfen tekrar deneyin.`);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Algoritma yardımcı fonksiyonlar - Centroid başlatma
  const initializeCentroids = () => {
    const newCentroids: Centroid[] = [];
    
    // K adet rastgele centroid seç
    const shuffled = [...dataset].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < k; i++) {
      if (shuffled[i]) {
        newCentroids.push({
          id: i,
          x: shuffled[i].x,
          y: shuffled[i].y,
          color: CLUSTER_COLORS[i % CLUSTER_COLORS.length]
        });
      }
    }
    
    setCentroids(newCentroids);
    setPreviousCentroids([]);
    
    setLogs(prevLogs => [
      ...prevLogs,
      `Adım 1: ${k} adet rastgele merkez noktası (centroid) seçildi.`
    ]);
    
    setStepDescription(`Adım 1: ${k} adet rastgele merkez noktası (centroid) seçildi. Bu noktalar veri kümesinden rastgele seçilen noktalardan oluşur.`);
  };
  
  // Bekleme fonksiyonu
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Reset
  const resetVisualization = () => {
    // Eğer algoritma çalışıyorsa hiçbir şey yapma
    if (isRunning) return;
    
    setIsRunning(false);
    setCurrentIteration(0);
    setHasConverged(false);
    setLogs([]);
    setCentroids([]);
    setPreviousCentroids([]);
    
    // Veri noktalarını silmeden sadece küme bilgilerini resetle
    if (dataset.length > 0) {
      setDataset(dataset.map(point => ({
        ...point,
        cluster: -1,
        distanceToCentroid: undefined
      })));
    } else {
      // Eğer veri yoksa yeni veri oluştur
      generateData();
    }
    
    setStepDescription('K-Means kümeleme algoritması görselleştirmesi. Algoritma adımlarını görmek için "Algoritmayı Çalıştır" butonuna basın.');
  };
  
  // K-Means algoritması adımlarını açıklayan detaylı görselleştirme bileşeni
  const DetailedStepVisualizer = () => {
    let visualContent;
    
    if (currentIteration === 0 && centroids.length === 0) {
      // Başlangıç durumu
      visualContent = (
        <View style={styles.detailStepContainer}>
          <Text style={styles.detailTitle}>K-Means Algoritmasına Genel Bakış</Text>
          <View style={styles.algorithmStepsList}>
            <View style={styles.algorithmStepItem}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Başlangıç Merkez Noktaları</Text>
                <Text style={styles.stepDescription}>K adet rastgele merkez noktası (centroid) seçilir.</Text>
              </View>
            </View>
            
            <View style={styles.algorithmStepItem}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Noktaları Kümelere Atama</Text>
                <Text style={styles.stepDescription}>Her veri noktası en yakın merkez noktasına atanır (Öklid mesafesi kullanılır).</Text>
              </View>
            </View>
            
            <View style={styles.algorithmStepItem}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Merkez Noktalarını Güncelleme</Text>
                <Text style={styles.stepDescription}>Her kümenin merkezi, kümedeki tüm noktaların ortalama konumuna göre yeniden hesaplanır.</Text>
              </View>
            </View>
            
            <View style={styles.algorithmStepItem}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Yakınsama Kontrolü</Text>
                <Text style={styles.stepDescription}>Merkez noktaları artık çok fazla hareket etmiyorsa veya maksimum iterasyon sayısına ulaşıldıysa algoritma durur.</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.formulaContainer}>
            <Text style={styles.formulaTitle}>Öklid Mesafe Formülü:</Text>
            <View style={styles.formulaBox}>
              <Text style={styles.formula}>distance(p, c) = √((px - cx)² + (py - cy)²)</Text>
            </View>
            <Text style={styles.formulaDescription}>Her nokta (p) ve merkez (c) arasındaki mesafe bu formül ile hesaplanır.</Text>
          </View>
        </View>
      );
    } else if (centroids.length > 0 && currentIteration === 0) {
      // Centroid'ler başlatıldı ama henüz atama yapılmadı
      visualContent = (
        <View style={styles.detailStepContainer}>
          <Text style={styles.detailTitle}>Adım 1: Başlangıç Merkez Noktaları</Text>
          <View style={styles.detailContent}>
            <View style={styles.miniCanvas}>
              {dataset.slice(0, 10).map((point, index) => (
                <View 
                  key={`mini-point-${index}`}
                  style={[
                    styles.miniDataPoint,
                    { left: point.x / 3, top: point.y / 3 }
                  ]}
                />
              ))}
              
              {centroids.map((centroid, index) => (
                <View 
                  key={`mini-centroid-${index}`}
                  style={[
                    styles.miniCentroid,
                    { 
                      left: centroid.x / 3, 
                      top: centroid.y / 3,
                      borderColor: centroid.color 
                    }
                  ]}
                />
              ))}
            </View>
            
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailDescription}>
                <Text style={{fontWeight: 'bold'}}>Rastgele Seçim:</Text> {k} adet merkez noktası veri kümesinden rastgele seçildi.
              </Text>
              <Text style={styles.detailDescription}>
                <Text style={{fontWeight: 'bold'}}>Not:</Text> Başlangıç merkez noktaları algoritmanın performansını önemli ölçüde etkileyebilir.
              </Text>
              <Text style={styles.detailDescription}>
                <Text style={{fontWeight: 'bold'}}>Alternatif Yöntemler:</Text> K-Means++ gibi daha gelişmiş başlatma algoritmaları daha iyi başlangıç noktaları seçebilir.
              </Text>
            </View>
          </View>
        </View>
      );
    } else if (currentIteration > 0) {
      // İterasyon devam ediyor - Sadece temel istatistikleri göster
      visualContent = (
        <View style={styles.detailStepContainer}>
          <Text style={styles.detailTitle}>İterasyon {currentIteration}: Temel İstatistikler</Text>
          
          <View style={styles.detailContent}>
            <View style={styles.statsContainer}>
              {centroids.map((centroid, index) => {
                const clusterPoints = dataset.filter(p => p.cluster === centroid.id);
                const avgDistance = clusterPoints.length > 0 
                  ? clusterPoints.reduce((sum, p) => sum + (p.distanceToCentroid || 0), 0) / clusterPoints.length 
                  : 0;
                
                return (
                  <View key={`cluster-stats-${index}`} style={styles.clusterStatItem}>
                    <View style={[styles.clusterColorBox, {backgroundColor: centroid.color}]} />
                    <Text style={styles.clusterStatTitle}>Küme {centroid.id + 1}</Text>
                    <Text style={styles.clusterStatText}>Nokta sayısı: {clusterPoints.length}</Text>
                    <Text style={styles.clusterStatText}>Ort. mesafe: {avgDistance.toFixed(2)}</Text>
                    <Text style={styles.clusterStatText}>Konum: ({centroid.x.toFixed(1)}, {centroid.y.toFixed(1)})</Text>
                    {previousCentroids.length > 0 && (
                      <Text style={styles.clusterStatText}>
                        Hareket: {Math.sqrt(
                          Math.pow(centroid.x - previousCentroids[index].x, 2) + 
                          Math.pow(centroid.y - previousCentroids[index].y, 2)
                        ).toFixed(2)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      );
    }
    
    return visualContent;
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* K-Means Açıklaması */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{stepDescription}</Text>
      </View>
      
      {/* Kontroller */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={resetVisualization}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🔄 Sıfırla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={generateData}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            🔀 Yeni Veri
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={runKMeansAlgorithm}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {isRunning ? '⏳ Çalışıyor...' : '▶️ Algoritmayı Çalıştır'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.speedContainer}>
        <Text style={styles.sliderLabel}>Hız: {speed}ms</Text>
        <Slider
          style={styles.slider}
          minimumValue={400}
          maximumValue={2000}
          step={200}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isRunning}
        />
      </View>
      
      {/* K-Means Parametreleri */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>K-Means Parametreleri</Text>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Küme Sayısı (k): {k}</Text>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={6}
            step={1}
            value={k}
            onValueChange={(value) => setK(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Veri Noktası Sayısı: {datasetSize}</Text>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={100}
            step={5}
            value={datasetSize}
            onValueChange={(value) => setDatasetSize(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Maksimum İterasyon: {maxIterations}</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={20}
            step={1}
            value={maxIterations}
            onValueChange={(value) => setMaxIterations(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Yakınsama Eşiği: {convergenceThreshold.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.01}
            maximumValue={1}
            step={0.01}
            value={convergenceThreshold}
            onValueChange={(value) => setConvergenceThreshold(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{fontWeight: 'bold'}}>🔍 K-Means:</Text> Veri noktalarını k kümeye ayıran bir kümeleme algoritmasıdır. Her küme bir merkez noktası (centroid) ile temsil edilir ve her veri noktası en yakın merkeze atanır.
          </Text>
        </View>
      </View>
      
      {/* Görselleştirme Canvas */}
      <View style={styles.canvasContainer}>
        <View style={styles.canvas}>
          {/* Veri noktaları ve kümeler arası bağlantılar */}
          {dataset && dataset.length > 0 && dataset.map((point, index) => (
            <React.Fragment key={`point-connection-${index}`}>
              {point.cluster >= 0 && centroids && centroids.length > 0 && (
                <View 
                  style={[
                    styles.connectionLine,
                    {
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(point.x - (centroids.find(c => c.id === point.cluster)?.x || 0), 2) +
                        Math.pow(point.y - (centroids.find(c => c.id === point.cluster)?.y || 0), 2)
                      ),
                      transform: [
                        { translateX: 0 },
                        { translateY: 0 },
                        { 
                          rotate: `${Math.atan2(
                            (centroids.find(c => c.id === point.cluster)?.y || 0) - point.y,
                            (centroids.find(c => c.id === point.cluster)?.x || 0) - point.x
                          )}rad` 
                        }
                      ],
                      backgroundColor: centroids.find(c => c.id === point.cluster)?.color || '#ccc',
                      opacity: 0.2
                    }
                  ]}
                />
              )}
            </React.Fragment>
          ))}
          
          {/* Veri noktaları */}
          {dataset && dataset.length > 0 && dataset.map((point, index) => (
            <View 
              key={`point-${index}`}
              style={[
                styles.dataPoint,
                {
                  left: point.x,
                  top: point.y,
                  backgroundColor: point.cluster >= 0 && centroids && centroids.length > 0 ? 
                    centroids.find(c => c.id === point.cluster)?.color || '#ccc' : 
                    '#ccc'
                }
              ]}
            />
          ))}
          
          {/* Centroid'ler */}
          {centroids && centroids.length > 0 && centroids.map((centroid, index) => (
            <View 
              key={`centroid-${index}`}
              style={[
                styles.centroid,
                {
                  left: centroid.x,
                  top: centroid.y,
                  borderColor: centroid.color
                }
              ]}
            />
          ))}
          
          {/* Önceki centroid'lerin pozisyonları (eğer hareket varsa) */}
          {previousCentroids && previousCentroids.length > 0 && previousCentroids.map((centroid, index) => (
            <View 
              key={`prev-centroid-${index}`}
              style={[
                styles.previousCentroid,
                {
                  left: centroid.x,
                  top: centroid.y,
                  borderColor: centroid.color
                }
              ]}
            />
          ))}
        </View>
        
        <View style={styles.canvasLabels}>
          <View style={styles.labelRow}>
            <View style={[styles.labelDot, {backgroundColor: '#ccc'}]} />
            <Text style={styles.labelText}>Atanmamış Nokta</Text>
          </View>
          
          {centroids.map((centroid, index) => (
            <View key={`label-${index}`} style={styles.labelRow}>
              <View style={[styles.labelDot, {backgroundColor: centroid.color}]} />
              <Text style={styles.labelText}>Küme {centroid.id + 1}</Text>
            </View>
          ))}
          
          <View style={styles.labelRow}>
            <View style={[styles.labelSquare, {borderColor: '#000'}]} />
            <Text style={styles.labelText}>Küme Merkezi</Text>
          </View>
          
          <View style={styles.labelRow}>
            <View style={styles.labelLine} />
            <Text style={styles.labelText}>Merkez-Nokta Bağlantısı</Text>
          </View>
        </View>
      </View>
      
      {/* İlerleme Durumu */}
      {(currentIteration > 0 || isRunning) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>İterasyon: {currentIteration}/{maxIterations}</Text>
            {hasConverged && (
              <View style={styles.convergedBadge}>
                <Text style={styles.convergedText}>Yakınsadı!</Text>
              </View>
            )}
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(currentIteration / maxIterations) * 100}%`,
                  backgroundColor: hasConverged ? '#27ae60' : '#3498db'
                }
              ]} 
            />
          </View>
        </View>
      )}
      
      {/* Algoritmik Adımlar Logu */}
      {logs.length > 0 && (
        <View style={styles.logsContainer}>
          <Text style={styles.sectionTitle}>Algoritma Adımları</Text>
          <ScrollView style={styles.logsScrollView}>
            {logs.map((log, index) => (
              <Text 
                key={index} 
                style={[
                  styles.logEntry,
                  log.includes('yakınsadı') ? styles.successLog : 
                  log.includes('Maksimum iterasyon') ? styles.warningLog :
                  log.includes('Sonuç İstatistikleri') ? styles.infoLog : {}
                ]}
              >
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="k-means" />
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#2ecc71',
  },
  secondaryButton: {
    backgroundColor: '#3498db',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
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
  paramRow: {
    marginBottom: 12,
  },
  paramLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoBox: {
    backgroundColor: '#f0fff4',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  infoBoxText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  canvasContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    transform: [{ translateX: -5 }, { translateY: -5 }],
  },
  centroid: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: 'white',
    borderWidth: 3,
    transform: [{ translateX: -8 }, { translateY: -8 }],
    zIndex: 2,
  },
  previousCentroid: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    transform: [{ translateX: -5 }, { translateY: -5 }],
    opacity: 0.5,
  },
  canvasLabels: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  labelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  labelSquare: {
    width: 10,
    height: 10,
    borderWidth: 2,
    marginRight: 6,
    backgroundColor: 'white',
  },
  labelText: {
    fontSize: 12,
    color: '#555',
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
  convergedBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  convergedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  logsScrollView: {
    maxHeight: 200,
  },
  logEntry: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  successLog: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  warningLog: {
    color: '#e67e22',
    fontWeight: 'bold',
  },
  infoLog: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 24,
  },
  // Nokta ve merkez arası bağlantı çizgisi
  connectionLine: {
    position: 'absolute',
    height: 1,
    zIndex: 1,
    transformOrigin: 'left',
  },
  
  // Detaylı Adım Görselleştirme Stilleri
  detailedVisualizationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  detailStepContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailContent: {
    flexDirection: 'column',
  },
  algorithmStepsList: {
    marginTop: 8,
  },
  algorithmStepItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  stepDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  formulaContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
  },
  formulaTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  formulaBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
  },
  formula: {
    fontFamily: 'monospace',
    fontSize: 14,
    textAlign: 'center',
  },
  formulaDescription: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
  miniCanvas: {
    width: CANVAS_WIDTH / 3,
    height: CANVAS_HEIGHT / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    marginBottom: 12,
    alignSelf: 'center',
  },
  miniDataPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  miniCentroid: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'white',
    borderWidth: 2,
    transform: [{ translateX: -4 }, { translateY: -4 }],
    zIndex: 2,
  },
  detailTextContainer: {
    padding: 8,
  },
  detailDescription: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  clusterStatItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clusterColorBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginBottom: 6,
  },
  clusterStatTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
    color: '#333',
  },
  clusterStatText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  labelLine: {
    width: 10,
    height: 2,
    backgroundColor: '#555',
    marginRight: 6,
    opacity: 0.5,
  },
});

export default KMeansVisualization; 