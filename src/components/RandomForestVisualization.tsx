import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { AlgorithmInfoCard } from './VisualizationHelpers';

// Random Forest için veri tipleri
interface DataPoint {
  id: number;
  feature1: number; // Sepal length
  feature2: number; // Sepal width
  feature3: number; // Petal length
  feature4: number; // Petal width
  label: string;
}

interface DecisionNode {
  feature: number;
  threshold: number;
  leftChild?: DecisionNode;
  rightChild?: DecisionNode;
  prediction?: string;
  isLeaf: boolean;
}

interface DecisionTree {
  id: number;
  root: DecisionNode;
  bootstrapIndices: number[];
  selectedFeatures: number[];
  oobScore: number;
}

interface TestData {
  feature1: number;
  feature2: number;
  feature3: number;
  feature4: number;
}

interface TreePrediction {
  treeId: number;
  prediction: string;
  confidence: number;
}

interface RandomForestVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Random Forest Visualization Component
const RandomForestVisualization: React.FC<RandomForestVisualizationProps> = ({ 
  title, 
  animationSpeed = 1200 
}) => {
  
  // Random Forest parametreleri
  const [nTrees, setNTrees] = useState<number>(5);
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [nFeatures, setNFeatures] = useState<number>(2); // sqrt(total_features)
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Sample dataset - Iris classification
  const [dataset] = useState<DataPoint[]>([
    // Iris Setosa
    { id: 1, feature1: 5.1, feature2: 3.5, feature3: 1.4, feature4: 0.2, label: 'Setosa' },
    { id: 2, feature1: 4.9, feature2: 3.0, feature3: 1.4, feature4: 0.2, label: 'Setosa' },
    { id: 3, feature1: 4.7, feature2: 3.2, feature3: 1.3, feature4: 0.2, label: 'Setosa' },
    { id: 4, feature1: 4.6, feature2: 3.1, feature3: 1.5, feature4: 0.2, label: 'Setosa' },
    { id: 5, feature1: 5.0, feature2: 3.6, feature3: 1.4, feature4: 0.2, label: 'Setosa' },
    { id: 6, feature1: 5.4, feature2: 3.9, feature3: 1.7, feature4: 0.4, label: 'Setosa' },
    
    // Iris Versicolor
    { id: 7, feature1: 7.0, feature2: 3.2, feature3: 4.7, feature4: 1.4, label: 'Versicolor' },
    { id: 8, feature1: 6.4, feature2: 3.2, feature3: 4.5, feature4: 1.5, label: 'Versicolor' },
    { id: 9, feature1: 6.9, feature2: 3.1, feature3: 4.9, feature4: 1.5, label: 'Versicolor' },
    { id: 10, feature1: 5.5, feature2: 2.3, feature3: 4.0, feature4: 1.3, label: 'Versicolor' },
    { id: 11, feature1: 6.5, feature2: 2.8, feature3: 4.6, feature4: 1.5, label: 'Versicolor' },
    { id: 12, feature1: 5.7, feature2: 2.8, feature3: 4.5, feature4: 1.3, label: 'Versicolor' },
    
    // Iris Virginica
    { id: 13, feature1: 6.3, feature2: 3.3, feature3: 6.0, feature4: 2.5, label: 'Virginica' },
    { id: 14, feature1: 5.8, feature2: 2.7, feature3: 5.1, feature4: 1.9, label: 'Virginica' },
    { id: 15, feature1: 7.1, feature2: 3.0, feature3: 5.9, feature4: 2.1, label: 'Virginica' },
    { id: 16, feature1: 6.3, feature2: 2.9, feature3: 5.6, feature4: 1.8, label: 'Virginica' },
    { id: 17, feature1: 6.5, feature2: 3.0, feature3: 5.8, feature4: 2.2, label: 'Virginica' },
    { id: 18, feature1: 7.6, feature2: 3.0, feature3: 6.6, feature4: 2.1, label: 'Virginica' },
  ]);
  
  const [forest, setForest] = useState<DecisionTree[]>([]);
  const [testData, setTestData] = useState<TestData>({
    feature1: 6.0,
    feature2: 3.0,
    feature3: 4.5,
    feature4: 1.5
  });
  
  const [treePredictions, setTreePredictions] = useState<TreePrediction[]>([]);
  const [finalPrediction, setFinalPrediction] = useState<string>('');
  const [trainingSteps, setTrainingSteps] = useState<string[]>([]);
  const [explanationText, setExplanationText] = useState<string>(
    'Random Forest algoritması görselleştirmesi. Önce forest\'ı eğitin, sonra test verisiyle tahmin yapın.'
  );
  
  // Feature names
  const featureNames = ['Sepal Length', 'Sepal Width', 'Petal Length', 'Petal Width'];
  
  // Bootstrap sampling
  const createBootstrapSample = (data: DataPoint[]): number[] => {
    const indices: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      indices.push(randomIndex);
    }
    return indices;
  };
  
  // Random feature selection
  const selectRandomFeatures = (totalFeatures: number, nFeatures: number): number[] => {
    const features: number[] = [];
    const available = Array.from({ length: totalFeatures }, (_, i) => i);
    
    for (let i = 0; i < nFeatures; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      features.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
    
    return features.sort();
  };
  
  // Simple decision tree creation (simplified for visualization)
  const createDecisionTree = (
    data: DataPoint[], 
    indices: number[], 
    selectedFeatures: number[], 
    depth: number = 0
  ): DecisionNode => {
    const sampledData = indices.map(i => data[i]);
    
    // Check if all samples have same label or max depth reached
    const labels = sampledData.map(d => d.label);
    const uniqueLabels = [...new Set(labels)];
    
    if (uniqueLabels.length === 1 || depth >= maxDepth) {
      // Leaf node - majority vote
      const labelCounts: { [key: string]: number } = {};
      labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
      const prediction = Object.keys(labelCounts).reduce((a, b) => 
        labelCounts[a] > labelCounts[b] ? a : b
      );
      
      return {
        feature: -1,
        threshold: 0,
        prediction,
        isLeaf: true
      };
    }
    
    // Find best split among selected features
    let bestFeature = selectedFeatures[0];
    let bestThreshold = 0;
    let bestGini = Infinity;
    
    for (const feature of selectedFeatures) {
      const values = sampledData.map(d => [d.feature1, d.feature2, d.feature3, d.feature4][feature]);
      const sortedValues = [...new Set(values)].sort((a, b) => a - b);
      
      for (let i = 0; i < sortedValues.length - 1; i++) {
        const threshold = (sortedValues[i] + sortedValues[i + 1]) / 2;
        const leftData = sampledData.filter(d => 
          [d.feature1, d.feature2, d.feature3, d.feature4][feature] <= threshold
        );
        const rightData = sampledData.filter(d => 
          [d.feature1, d.feature2, d.feature3, d.feature4][feature] > threshold
        );
        
        if (leftData.length === 0 || rightData.length === 0) continue;
        
        const leftGini = calculateGini(leftData.map(d => d.label));
        const rightGini = calculateGini(rightData.map(d => d.label));
        const weightedGini = (leftData.length * leftGini + rightData.length * rightGini) / sampledData.length;
        
        if (weightedGini < bestGini) {
          bestGini = weightedGini;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }
    
    // Split data based on best feature and threshold
    const leftIndices = indices.filter(i => 
      [data[i].feature1, data[i].feature2, data[i].feature3, data[i].feature4][bestFeature] <= bestThreshold
    );
    const rightIndices = indices.filter(i => 
      [data[i].feature1, data[i].feature2, data[i].feature3, data[i].feature4][bestFeature] > bestThreshold
    );
    
    return {
      feature: bestFeature,
      threshold: bestThreshold,
      leftChild: leftIndices.length > 0 ? createDecisionTree(data, leftIndices, selectedFeatures, depth + 1) : undefined,
      rightChild: rightIndices.length > 0 ? createDecisionTree(data, rightIndices, selectedFeatures, depth + 1) : undefined,
      isLeaf: false
    };
  };
  
  // Calculate Gini impurity
  const calculateGini = (labels: string[]): number => {
    if (labels.length === 0) return 0;
    
    const labelCounts: { [key: string]: number } = {};
    labels.forEach(label => {
      labelCounts[label] = (labelCounts[label] || 0) + 1;
    });
    
    let gini = 1;
    Object.values(labelCounts).forEach(count => {
      const prob = count / labels.length;
      gini -= prob * prob;
    });
    
    return gini;
  };
  
  // Predict with a single tree
  const predictWithTree = (tree: DecisionNode, sample: TestData): string => {
    if (tree.isLeaf) {
      return tree.prediction || 'Unknown';
    }
    
    const featureValue = [sample.feature1, sample.feature2, sample.feature3, sample.feature4][tree.feature];
    
    if (featureValue <= tree.threshold) {
      return tree.leftChild ? predictWithTree(tree.leftChild, sample) : 'Unknown';
    } else {
      return tree.rightChild ? predictWithTree(tree.rightChild, sample) : 'Unknown';
    }
  };
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Train Random Forest
  const trainForest = async (): Promise<void> => {
    setIsTraining(true);
    setTrainingSteps([]);
    setForest([]);
    
    setExplanationText(`🌲 Random Forest eğitimi başlıyor: ${nTrees} ağaç, ${maxDepth} max derinlik`);
    await wait(speed);
    
    const newForest: DecisionTree[] = [];
    
    for (let i = 0; i < nTrees; i++) {
      setTrainingSteps(prev => [...prev, 
        `Ağaç ${i + 1}/${nTrees} eğitiliyor...`
      ]);
      
      setExplanationText(`🌳 Ağaç ${i + 1} için bootstrap sampling yapılıyor`);
      await wait(speed / 2);
      
      // Bootstrap sampling
      const bootstrapIndices = createBootstrapSample(dataset);
      
      setTrainingSteps(prev => [...prev, 
        `  Bootstrap sample: ${bootstrapIndices.slice(0, 5).join(', ')}... (${dataset.length} örnekten)`
      ]);
      await wait(speed / 2);
      
      // Random feature selection
      const selectedFeatures = selectRandomFeatures(4, nFeatures);
      const featureNamesList = selectedFeatures.map(f => featureNames[f]).join(', ');
      
      setTrainingSteps(prev => [...prev, 
        `  Seçilen özellikler: ${featureNamesList}`
      ]);
      await wait(speed / 2);
      
      setExplanationText(`🔧 Ağaç ${i + 1} decision tree algoritması ile eğitiliyor`);
      
      // Create decision tree
      const root = createDecisionTree(dataset, bootstrapIndices, selectedFeatures);
      
      // Calculate OOB score (simplified)
      const oobIndices = dataset.map((_, idx) => idx).filter(idx => !bootstrapIndices.includes(idx));
      let correctOOB = 0;
      
      if (oobIndices.length > 0) {
        oobIndices.forEach(idx => {
          const sample = dataset[idx];
          const prediction = predictWithTree(root, {
            feature1: sample.feature1,
            feature2: sample.feature2,
            feature3: sample.feature3,
            feature4: sample.feature4
          });
          if (prediction === sample.label) correctOOB++;
        });
      }
      
      const oobScore = oobIndices.length > 0 ? correctOOB / oobIndices.length : 0;
      
      setTrainingSteps(prev => [...prev, 
        `  OOB Score: ${(oobScore * 100).toFixed(1)}% (${correctOOB}/${oobIndices.length})`
      ]);
      
      const tree: DecisionTree = {
        id: i + 1,
        root,
        bootstrapIndices,
        selectedFeatures,
        oobScore
      };
      
      newForest.push(tree);
      await wait(speed);
    }
    
    setForest(newForest);
    
    const avgOOB = newForest.reduce((sum, tree) => sum + tree.oobScore, 0) / newForest.length;
    setTrainingSteps(prev => [...prev, 
      `Random Forest eğitimi tamamlandı! Ortalama OOB Score: ${(avgOOB * 100).toFixed(1)}%`
    ]);
    
    setExplanationText(
      `🎉 Forest eğitimi tamamlandı! ${nTrees} ağaç başarıyla eğitildi. Şimdi tahmin yapabilirsiniz.`
    );
    
    setIsTraining(false);
  };
  
  // Predict with Random Forest
  const predictWithForest = async (): Promise<void> => {
    if (forest.length === 0) {
      setExplanationText('❌ Önce forest\'ı eğitmeniz gerekiyor!');
      return;
    }
    
    setIsPredicting(true);
    setTreePredictions([]);
    setFinalPrediction('');
    
    setExplanationText(`🎯 Test verisi forest ile sınıflandırılıyor...`);
    await wait(speed);
    
    const predictions: TreePrediction[] = [];
    
    for (let i = 0; i < forest.length; i++) {
      const tree = forest[i];
      
      setExplanationText(`🌳 Ağaç ${i + 1} ile tahmin yapılıyor`);
      
      const prediction = predictWithTree(tree.root, testData);
      const confidence = tree.oobScore;
      
      predictions.push({
        treeId: tree.id,
        prediction,
        confidence
      });
      
      setTreePredictions([...predictions]);
      await wait(speed / 2);
    }
    
    // Majority voting
    setExplanationText(`🗳️ Majority voting yapılıyor...`);
    await wait(speed);
    
    const voteCounts: { [key: string]: number } = {};
    predictions.forEach(pred => {
      voteCounts[pred.prediction] = (voteCounts[pred.prediction] || 0) + 1;
    });
    
    const finalPred = Object.keys(voteCounts).reduce((a, b) => 
      voteCounts[a] > voteCounts[b] ? a : b
    );
    
    const confidence = (voteCounts[finalPred] / predictions.length * 100).toFixed(1);
    
    setFinalPrediction(finalPred);
    
    setExplanationText(
      `🎉 Random Forest tahmini: ${finalPred} (${confidence}% oy alarak ${voteCounts[finalPred]}/${predictions.length})`
    );
    
    setIsPredicting(false);
  };
  
  // Reset function
  const resetForest = (): void => {
    setForest([]);
    setTreePredictions([]);
    setFinalPrediction('');
    setTrainingSteps([]);
    setExplanationText('🔄 Random Forest sıfırlandı. Yeni parametrelerle eğitim başlatabilirsiniz.');
  };
  
  // Input handlers
  const handleTestDataChange = (feature: keyof TestData, value: number): void => {
    setTestData(prev => ({ ...prev, [feature]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={resetForest}
          disabled={isTraining || isPredicting}
        >
          <Text style={styles.buttonText}>🔄 Sıfırla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={trainForest}
          disabled={isTraining || isPredicting}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isTraining ? '🌲 Eğitiliyor...' : '🌳 Forest Eğit'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={predictWithForest}
          disabled={isTraining || isPredicting || forest.length === 0}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {isPredicting ? '🎯 Tahmin ediliyor...' : '🔮 Tahmin Yap'}
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
          disabled={isTraining || isPredicting}
        />
      </View>
      
      {/* Random Forest Parameters */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>Random Forest Parametreleri</Text>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Ağaç Sayısı (n_estimators): {nTrees}</Text>
          <Slider
            style={styles.slider}
            minimumValue={3}
            maximumValue={10}
            step={1}
            value={nTrees}
            onValueChange={(value) => setNTrees(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining || isPredicting}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Max Derinlik (max_depth): {maxDepth}</Text>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={5}
            step={1}
            value={maxDepth}
            onValueChange={(value) => setMaxDepth(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining || isPredicting}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Feature Sayısı (max_features): {nFeatures}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={4}
            step={1}
            value={nFeatures}
            onValueChange={(value) => setNFeatures(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining || isPredicting}
          />
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{fontWeight: 'bold'}}>🌲 Random Forest:</Text> Bootstrap sampling + Feature randomness ile multiple decision trees. 
            Ensemble learning ile overfitting'i azaltır ve genelleme kabiliyetini artırır.
          </Text>
        </View>
      </View>
      
      {/* Test Data Input */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>🎯 Test Verisi (Iris Özellikleri)</Text>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Sepal Length: {testData.feature1.toFixed(1)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={4.0}
            maximumValue={8.0}
            step={0.1}
            value={testData.feature1}
            onValueChange={(value) => handleTestDataChange('feature1', value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining || isPredicting}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Sepal Width: {testData.feature2.toFixed(1)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={2.0}
            maximumValue={4.5}
            step={0.1}
            value={testData.feature2}
            onValueChange={(value) => handleTestDataChange('feature2', value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining || isPredicting}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Petal Length: {testData.feature3.toFixed(1)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1.0}
            maximumValue={7.0}
            step={0.1}
            value={testData.feature3}
            onValueChange={(value) => handleTestDataChange('feature3', value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining || isPredicting}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Petal Width: {testData.feature4.toFixed(1)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={3.0}
            step={0.1}
            value={testData.feature4}
            onValueChange={(value) => handleTestDataChange('feature4', value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining || isPredicting}
          />
        </View>
      </View>
      
      {/* Explanation */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Forest Status */}
      {forest.length > 0 && (
        <View style={styles.forestContainer}>
          <Text style={styles.sectionTitle}>🌲 Forest Durumu</Text>
          <ScrollView horizontal style={styles.forestScroll}>
            {forest.map((tree, index) => (
              <View key={index} style={styles.treeCard}>
                <Text style={styles.treeTitle}>Ağaç {tree.id}</Text>
                <View style={styles.treeDetails}>
                  <Text style={styles.treeInfo}>
                    <Text style={styles.treeInfoLabel}>Features:</Text> {tree.selectedFeatures.map(f => featureNames[f]).join(', ')}
                  </Text>
                  <Text style={styles.treeInfo}>
                    <Text style={styles.treeInfoLabel}>Bootstrap:</Text> {tree.bootstrapIndices.length} örnekten
                  </Text>
                  <Text style={styles.treeInfo}>
                    <Text style={styles.treeInfoLabel}>OOB Score:</Text> {(tree.oobScore * 100).toFixed(1)}%
                  </Text>
                  {treePredictions.find(p => p.treeId === tree.id) && (
                    <Text style={styles.treePrediction}>
                      Tahmin: {treePredictions.find(p => p.treeId === tree.id)?.prediction}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Training Steps */}
      {trainingSteps.length > 0 && (
        <View style={styles.trainingContainer}>
          <Text style={styles.sectionTitle}>🌲 Random Forest Eğitim Adımları</Text>
          <ScrollView style={styles.trainingScroll}>
            {trainingSteps.map((step, index) => (
              <View 
                key={index} 
                style={[
                  styles.trainingStep,
                  index === trainingSteps.length - 1 && styles.lastTrainingStep
                ]}
              >
                <Text style={styles.trainingText}>{step}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Individual Tree Predictions */}
      {treePredictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <Text style={styles.sectionTitle}>🗳️ Bireysel Ağaç Tahminleri</Text>
          <View style={styles.predictionsGrid}>
            {treePredictions.map((pred, index) => ( 
              <View key={index} style={styles.predictionCard}>
                <Text style={styles.predictionTitle}>Ağaç {pred.treeId}</Text>
                <View style={styles.predictionDetails}>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>Tahmin:</Text> 
                    <Text 
                      style={[
                        styles.predictionValue,
                        { color: pred.prediction === 'Setosa' ? '#3498db' : 
                               pred.prediction === 'Versicolor' ? '#2ecc71' : '#e74c3c' }
                      ]}
                    >
                      {pred.prediction}
                    </Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>OOB Score:</Text> 
                    <Text style={styles.predictionValue}>{(pred.confidence * 100).toFixed(1)}%</Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>Ağırlık:</Text> 
                    <Text style={styles.predictionValue}>1/{treePredictions.length}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Final Result */}
      {finalPrediction && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🏆 Random Forest Tahmini</Text>
          <Text style={styles.resultValue}>Sınıf: {finalPrediction}</Text>
          <Text style={styles.resultDetails}>
            Test: ({testData.feature1.toFixed(1)}, {testData.feature2.toFixed(1)}, 
                   {testData.feature3.toFixed(1)}, {testData.feature4.toFixed(1)})
          </Text>
          <Text style={styles.resultSummary}>
            {nTrees} ağaçtan {treePredictions.filter(p => p.prediction === finalPrediction).length} tanesi bu sınıfı seçti
          </Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="random forest" />
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
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
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
  forestContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  forestScroll: {
    marginTop: 10,
  },
  treeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 200,
    elevation: 1,
  },
  treeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  treeDetails: {
  },
  treeInfo: {
    fontSize: 12,
    marginBottom: 4,
    color: '#333',
  },
  treeInfoLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  treePrediction: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#2ecc71',
  },
  trainingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  trainingScroll: {
    maxHeight: 200,
    marginTop: 10,
  },
  trainingStep: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastTrainingStep: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  trainingText: {
    fontSize: 14,
    color: '#333',
  },
  predictionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  predictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  predictionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  predictionDetails: {
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#555',
  },
  predictionValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: 'white',
    textAlign: 'center',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  resultDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSummary: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 24,
  },
});

export default RandomForestVisualization; 