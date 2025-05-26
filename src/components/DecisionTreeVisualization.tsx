import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Animated,
  Platform,
  FlatList,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { 
  Circle, 
  Line, 
  Rect, 
  G, 
  Text as SvgText 
} from 'react-native-svg';
import { AlgorithmInfoCard } from './VisualizationHelpers';

// Karar Ağacı için veri tipleri
interface DataPoint {
  id: number;
  feature1: number; // Örn: Yaş
  feature2: number; // Örn: Gelir
  label: string;    // Sınıf etiketi
  color: string;
}

interface TreeNode {
  id: number;
  isLeaf: boolean;
  feature?: string;
  threshold?: number;
  prediction?: string;
  samples: DataPoint[];
  left?: TreeNode;
  right?: TreeNode;
  depth: number;
  gini?: number;
  entropy?: number;
  x?: number; // Görsel pozisyon
  y?: number;
}

interface DecisionTreeVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Karar Ağacı Görselleştirme Bileşeni
const DecisionTreeVisualization: React.FC<DecisionTreeVisualizationProps> = ({ 
  title, 
  animationSpeed = 1000 
}) => {
  const { width } = Dimensions.get('window');
  
  // Karar Ağacı parametreleri
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [minSamples, setMinSamples] = useState<number>(2);
  const [criterion, setCriterion] = useState<string>('gini'); // gini veya entropy
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Örnek veri seti - Yaş ve Gelir ile Kredi Onay Tahmini
  const [dataset] = useState<DataPoint[]>([
    { id: 1, feature1: 25, feature2: 30000, label: 'Reddedildi', color: '#e74c3c' },
    { id: 2, feature1: 35, feature2: 50000, label: 'Onaylandı', color: '#2ecc71' },
    { id: 3, feature1: 45, feature2: 70000, label: 'Onaylandı', color: '#2ecc71' },
    { id: 4, feature1: 22, feature2: 25000, label: 'Reddedildi', color: '#e74c3c' },
    { id: 5, feature1: 50, feature2: 80000, label: 'Onaylandı', color: '#2ecc71' },
    { id: 6, feature1: 28, feature2: 35000, label: 'Reddedildi', color: '#e74c3c' },
    { id: 7, feature1: 38, feature2: 60000, label: 'Onaylandı', color: '#2ecc71' },
    { id: 8, feature1: 19, feature2: 20000, label: 'Reddedildi', color: '#e74c3c' },
    { id: 9, feature1: 42, feature2: 65000, label: 'Onaylandı', color: '#2ecc71' },
    { id: 10, feature1: 30, feature2: 40000, label: 'Onaylandı', color: '#2ecc71' },
    { id: 11, feature1: 26, feature2: 32000, label: 'Reddedildi', color: '#e74c3c' },
    { id: 12, feature1: 48, feature2: 75000, label: 'Onaylandı', color: '#2ecc71' }
  ]);
  
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [explanationText, setExplanationText] = useState<string>(
    'Karar Ağacı algoritması görselleştirmesi. Yaş ve Gelir özellikleri kullanılarak kredi onay tahmini yapılır.'
  );
  const [buildingSteps, setBuildingSteps] = useState<string[]>([]);
  
  // Gini impurity hesaplama
  const calculateGini = (samples: DataPoint[]): number => {
    if (samples.length === 0) return 0;
    
    const labelCounts: { [label: string]: number } = {};
    samples.forEach(sample => {
      labelCounts[sample.label] = (labelCounts[sample.label] || 0) + 1;
    });
    
    let gini = 1;
    Object.values(labelCounts).forEach(count => {
      const probability = count / samples.length;
      gini -= probability * probability;
    });
    
    return gini;
  };
  
  // Entropy hesaplama
  const calculateEntropy = (samples: DataPoint[]): number => {
    if (samples.length === 0) return 0;
    
    const labelCounts: { [label: string]: number } = {};
    samples.forEach(sample => {
      labelCounts[sample.label] = (labelCounts[sample.label] || 0) + 1;
    });
    
    let entropy = 0;
    Object.values(labelCounts).forEach(count => {
      const probability = count / samples.length;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });
    
    return entropy;
  };
  
  // Bilgi kazancı hesaplama
  const calculateInformationGain = (
    samples: DataPoint[], 
    feature: string, 
    threshold: number
  ): number => {
    const leftSamples = samples.filter(s => 
      feature === 'feature1' ? s.feature1 <= threshold : s.feature2 <= threshold
    );
    const rightSamples = samples.filter(s => 
      feature === 'feature1' ? s.feature1 > threshold : s.feature2 > threshold
    );
    
    const totalSamples = samples.length;
    const leftWeight = leftSamples.length / totalSamples;
    const rightWeight = rightSamples.length / totalSamples;
    
    if (criterion === 'gini') {
      const parentGini = calculateGini(samples);
      const leftGini = calculateGini(leftSamples);
      const rightGini = calculateGini(rightSamples);
      
      return parentGini - (leftWeight * leftGini + rightWeight * rightGini);
    } else {
      const parentEntropy = calculateEntropy(samples);
      const leftEntropy = calculateEntropy(leftSamples);
      const rightEntropy = calculateEntropy(rightSamples);
      
      return parentEntropy - (leftWeight * leftEntropy + rightWeight * rightEntropy);
    }
  };
  
  // En iyi bölünmeyi bulma
  const findBestSplit = (samples: DataPoint[]): { feature: string; threshold: number; gain: number } => {
    let bestGain = -1;
    let bestFeature = '';
    let bestThreshold = 0;
    
    const features = ['feature1', 'feature2'];
    
    features.forEach(feature => {
      const values = samples.map(s => feature === 'feature1' ? s.feature1 : s.feature2);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
      
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const gain = calculateInformationGain(samples, feature, threshold);
        
        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    });
    
    return { feature: bestFeature, threshold: bestThreshold, gain: bestGain };
  };
  
  // Çoğunluk sınıfını bulma
  const getMajorityClass = (samples: DataPoint[]): string => {
    const labelCounts: { [label: string]: number } = {};
    samples.forEach(sample => {
      labelCounts[sample.label] = (labelCounts[sample.label] || 0) + 1;
    });
    
    return Object.entries(labelCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  };
  
  // Animasyon yardımcısı
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Karar Ağacı oluşturma (özyinelemeli)
  const buildDecisionTree = async (
    samples: DataPoint[], 
    depth: number, 
    nodeId: number
  ): Promise<TreeNode> => {
    
    setBuildingSteps(prev => [...prev, 
      `Düğüm ${nodeId}: ${samples.length} örnek, Derinlik: ${depth}`
    ]);
    
    setExplanationText(
      `Düğüm ${nodeId} oluşturuluyor: ${samples.length} örnek ile (Derinlik: ${depth})`
    );
    await wait(speed);
    
    // Terminal koşulları kontrolü
    const uniqueLabels = [...new Set(samples.map(s => s.label))];
    
    if (uniqueLabels.length === 1 || depth >= maxDepth || samples.length < minSamples) {
      const prediction = getMajorityClass(samples);
      const gini = calculateGini(samples);
      const entropy = calculateEntropy(samples);
      
      setBuildingSteps(prev => [...prev, 
        `Yaprak düğüm: ${prediction} (${samples.length} örnek)`
      ]);
      
      setExplanationText(
        `Yaprak düğüm oluşturuldu: Tahmin = ${prediction}, Gini = ${gini.toFixed(3)}`
      );
      await wait(speed);
      
      return {
        id: nodeId,
        isLeaf: true,
        prediction,
        samples,
        depth,
        gini,
        entropy
      };
    }
    
    // En iyi bölünmeyi bul
    const bestSplit = findBestSplit(samples);
    
    setBuildingSteps(prev => [...prev, 
      `En iyi bölünme: ${bestSplit.feature === 'feature1' ? 'Yaş' : 'Gelir'} <= ${bestSplit.threshold.toFixed(1)} (Kazanç: ${bestSplit.gain.toFixed(3)})`
    ]);
    
    setExplanationText(
      `En iyi bölünme bulundu: ${bestSplit.feature === 'feature1' ? 'Yaş' : 'Gelir'} <= ${bestSplit.threshold.toFixed(1)}, Bilgi Kazancı: ${bestSplit.gain.toFixed(3)}`
    );
    await wait(speed);
    
    // Veriyi böl
    const leftSamples = samples.filter(s => 
      bestSplit.feature === 'feature1' ? s.feature1 <= bestSplit.threshold : s.feature2 <= bestSplit.threshold
    );
    const rightSamples = samples.filter(s => 
      bestSplit.feature === 'feature1' ? s.feature1 > bestSplit.threshold : s.feature2 > bestSplit.threshold
    );
    
    // Özyinelemeli olarak alt ağaçları oluştur
    const leftChild = await buildDecisionTree(leftSamples, depth + 1, nodeId * 2);
    const rightChild = await buildDecisionTree(rightSamples, depth + 1, nodeId * 2 + 1);
    
    const gini = calculateGini(samples);
    const entropy = calculateEntropy(samples);
    
    return {
      id: nodeId,
      isLeaf: false,
      feature: bestSplit.feature,
      threshold: bestSplit.threshold,
      samples,
      left: leftChild,
      right: rightChild,
      depth,
      gini,
      entropy
    };
  };
  
  // Ağaç eğitimini başlatma
  const startTraining = async (): Promise<void> => {
    setIsTraining(true);
    setCurrentStep(0);
    setBuildingSteps([]);
    setTree(null);
    
    setExplanationText('🌳 Karar ağacı eğitimi başlıyor...');
    await wait(speed);
    
    try {
      const newTree = await buildDecisionTree(dataset, 0, 1);
      setTree(newTree);
      
      setExplanationText(
        `🎉 Karar ağacı başarıyla oluşturuldu! Maksimum derinlik: ${maxDepth}, Kriter: ${criterion}`
      );
    } catch (error) {
      setExplanationText('❌ Ağaç oluşturulurken hata oluştu.');
    }
    
    setIsTraining(false);
  };
  
  // Sıfırlama fonksiyonu
  const resetTree = (): void => {
    setTree(null);
    setBuildingSteps([]);
    setCurrentStep(0);
    setExplanationText('🔄 Karar ağacı sıfırlandı. Yeni ağaç oluşturmak için eğitimi başlatın.');
  };
  
  // Ağaç düğümünü görselleştirme - React Native SVG için uyarlandı
  const renderTreeNode = (node: TreeNode, x: number, y: number, level: number): React.ReactElement => {
    const nodeWidth = 120;
    const nodeHeight = 60;
    
    if (level > 1) return <G />; // Mobil ekranda sadece ilk 2 seviyeyi göster
    
    return (
      <G key={node.id.toString()}>
        {/* Düğüm kutusu */}
        <Rect
          x={x - nodeWidth/2}
          y={y - nodeHeight/2}
          width={nodeWidth}
          height={nodeHeight}
          fill={node.isLeaf ? '#e8f8ff' : '#fff5f5'}
          stroke={node.isLeaf ? '#3498db' : '#e74c3c'}
          strokeWidth="2"
          rx={8}
        />
        
        {/* Düğüm metni */}
        <SvgText x={x} y={y - 15} textAnchor="middle" fontSize="10" fontWeight="bold">
          {node.isLeaf ? `Tahmin: ${node.prediction}` : 
           `${node.feature === 'feature1' ? 'Yaş' : 'Gelir'} <= ${node.threshold?.toFixed(1)}`}
        </SvgText>
        <SvgText x={x} y={y} textAnchor="middle" fontSize="8">
          Örnekler: {node.samples.length}
        </SvgText>
        <SvgText x={x} y={y + 15} textAnchor="middle" fontSize="8">
          {criterion === 'gini' ? `Gini: ${node.gini?.toFixed(3)}` : `Entropi: ${node.entropy?.toFixed(3)}`}
        </SvgText>
        
        {/* Alt bağlantılar */}
        {!node.isLeaf && node.left && node.right && level < 1 && (
          <>
            {/* Sol bağlantı */}
            <Line
              x1={x - 20}
              y1={y + nodeHeight/2}
              x2={x - 100}
              y2={y + 80}
              stroke="#666"
              strokeWidth="2"
            />
            <SvgText x={x - 65} y={y + 55} textAnchor="middle" fontSize="9" fill="#2ecc71">
              Evet
            </SvgText>
            
            {/* Sağ bağlantı */}
            <Line
              x1={x + 20}
              y1={y + nodeHeight/2}
              x2={x + 100}
              y2={y + 80}
              stroke="#666"
              strokeWidth="2"
            />
            <SvgText x={x + 65} y={y + 55} textAnchor="middle" fontSize="9" fill="#e74c3c">
              Hayır
            </SvgText>
            
            {/* Alt düğümleri özyinelemeli olarak göster */}
            {renderTreeNode(node.left, x - 100, y + 90, level + 1)}
            {renderTreeNode(node.right, x + 100, y + 90, level + 1)}
          </>
        )}
      </G>
    );
  };

  // Karar kriteri değiştirme
  const toggleCriterion = () => {
    setCriterion(criterion === 'gini' ? 'entropy' : 'gini');
  };
  
  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{title}</Text>
        
        {/* Kontroller */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={resetTree}
            disabled={isTraining}
          >
            <Text style={styles.buttonText}>🔄 Sıfırla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={startTraining}
            disabled={isTraining}
          >
            <Text style={styles.buttonText}>
              {isTraining ? '🌳 Ağaç Oluşturuluyor...' : '🚀 Ağaç Eğitimi'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Hız kontrolü */}
        <View style={styles.speedControl}>
          <Text>Hız: {speed}ms</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={300}
            maximumValue={1500}
            step={100}
            value={speed}
            onValueChange={(value) => setSpeed(value)}
            disabled={isTraining}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#bdc3c7"
          />
        </View>
        
        {/* Karar Ağacı Parametreleri */}
        <View style={styles.paramsContainer}>
          <Text style={styles.sectionTitle}>Karar Ağacı Parametreleri</Text>
          
          <View style={styles.paramControl}>
            <Text>Maksimum Derinlik: {maxDepth}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={maxDepth}
              onValueChange={(value) => setMaxDepth(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Minimum Örnek Sayısı: {minSamples}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={minSamples}
              onValueChange={(value) => setMinSamples(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.criterionButton} 
            onPress={toggleCriterion}
            disabled={isTraining}
          >
            <Text style={styles.criterionButtonText}>
              Bölme Kriteri: {criterion === 'gini' ? 'Gini Saflığı' : 'Entropi'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>🌳 Karar Ağacı:</Text> Her düğümde en iyi özellik ve eşik değeri seçilerek 
              veri özyinelemeli olarak bölünür. {criterion === 'gini' ? 'Gini saflığı' : 'Entropi'} kriteri kullanılıyor.
            </Text>
          </View>
        </View>
        
        {/* Açıklama */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{explanationText}</Text>
        </View>
        
        {/* Veri Seti Görselleştirme */}
        <View style={styles.environmentContainer}>
          <Text style={styles.sectionTitle}>📊 Veri Seti (Yaş vs Gelir)</Text>
          <View style={styles.svgContainer}>
            <Svg width={width - 40} height={250} style={styles.svgBorder}>
              {/* Eksenler */}
              <Line x1="40" y1="200" x2={width - 80} y2="200" stroke="#333" strokeWidth="2"/>
              <Line x1="40" y1="50" x2="40" y2="200" stroke="#333" strokeWidth="2"/>
              
              {/* Eksen etiketleri */}
              <SvgText x={width/2 - 20} y="220" textAnchor="middle" fontSize="12">Yaş</SvgText>
              <SvgText x="20" y="125" textAnchor="middle" fontSize="12" rotation="-90">Gelir (K₺)</SvgText>
              
              {/* Veri noktaları */}
              {dataset.map(point => (
                <Circle
                  key={point.id.toString()}
                  cx={40 + (point.feature1 - 15) * 4.5} // Yaş ölçeklendirme
                  cy={200 - (point.feature2 - 15000) * 0.0025} // Gelir ölçeklendirme
                  r="5"
                  fill={point.color}
                  stroke="#333"
                  strokeWidth="1"
                />
              ))}
              
              {/* Açıklama */}
              <Circle cx={width - 90} cy="30" r="5" fill="#2ecc71" />
              <SvgText x={width - 75} y="35" fontSize="10">Onaylandı</SvgText>
              <Circle cx={width - 90} cy="50" r="5" fill="#e74c3c" />
              <SvgText x={width - 75} y="55" fontSize="10">Reddedildi</SvgText>
            </Svg>
          </View>
        </View>
        
        {/* Ağaç Görselleştirme */}
        {tree && (
          <View style={styles.environmentContainer}>
            <Text style={styles.sectionTitle}>🌳 Karar Ağacı Yapısı</Text>
            <ScrollView horizontal style={styles.treeScrollContainer}>
              <Svg width={width * 1.5} height={300} style={styles.svgBorder}>
                {renderTreeNode(tree, width * 0.75, 50, 0)}
              </Svg>
            </ScrollView>
          </View>
        )}
        
        {/* Oluşturma Adımları - FlatList yerine normal View içinde render edeceğiz */}
        {buildingSteps.length > 0 && (
          <View style={styles.stepsContainer}>
            <Text style={styles.sectionTitle}>🔨 Ağaç Oluşturma Adımları</Text>
            <View style={styles.stepsList}>
              {buildingSteps.map((step, index) => (
                <View 
                  key={index}
                  style={[
                    styles.stepItem,
                    index === buildingSteps.length - 1 ? styles.lastStepItem : null
                  ]}
                >
                  <Text style={styles.stepText}>
                    <Text style={styles.stepNumber}>Adım {index + 1}:</Text> {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Özellik Önemi */}
        {tree && (
          <View style={styles.featureImportanceContainer}>
            <Text style={styles.sectionTitle}>📈 Özellik Önemleri</Text>
            <View style={styles.featureItem}>
              <Text>Yaş:</Text>
              <View style={styles.featureBar}>
                <View style={[styles.featureBarFill, { width: '60%', backgroundColor: '#3498db' }]} />
              </View>
              <Text style={styles.featurePercentage}>60%</Text>
            </View>
            <View style={styles.featureItem}>
              <Text>Gelir:</Text>
              <View style={styles.featureBar}>
                <View style={[styles.featureBarFill, { width: '40%', backgroundColor: '#e74c3c' }]} />
              </View>
              <Text style={styles.featurePercentage}>40%</Text>
            </View>
          </View>
        )}
        
        <View style={styles.infoSection}>
          <AlgorithmInfoCard algorithmType="decision tree" />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#2c3e50',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  speedControl: {
    marginVertical: 12,
    alignItems: 'center',
  },
  paramsContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  paramControl: {
    marginVertical: 8,
  },
  criterionButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  criterionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f8ff',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  infoTextBold: {
    fontWeight: 'bold',
  },
  explanationBox: {
    padding: 12,
    backgroundColor: '#fff9e8',
    borderRadius: 8,
    marginVertical: 12,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  environmentContainer: {
    marginVertical: 12,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgBorder: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  treeScrollContainer: {
    marginVertical: 10,
  },
  stepsContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
  },
  stepsList: {
    maxHeight: 200,
  },
  stepItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastStepItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepText: {
    color: 'white',
    fontSize: 12,
    lineHeight: 18,
  },
  stepNumber: {
    fontWeight: 'bold',
  },
  featureImportanceContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  featureBar: {
    width: '60%',
    height: 15,
    backgroundColor: '#ecf0f1',
    borderRadius: 10,
    overflow: 'hidden',
  },
  featureBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  featurePercentage: {
    fontWeight: 'bold',
    width: '10%',
    textAlign: 'right',
  },
  infoSection: {
    marginVertical: 12,
  },
});

export default DecisionTreeVisualization; 