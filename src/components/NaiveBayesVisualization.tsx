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
  Alert,
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

// Naive Bayes için veri tipleri
interface DataPoint {
  id: number;
  feature1: number;
  feature2: number;
  feature3: string; // Categorical feature
  label: string;
}

interface TestData {
  feature1: number;
  feature2: number;
  feature3: string;
}

interface ProbabilityCalculation {
  className: string;
  prior: number;
  likelihood1: number;
  likelihood2: number;
  likelihood3: number;
  posterior: number;
  normalizedPosterior: number;
}

interface NaiveBayesVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Naive Bayes Visualization Component
const NaiveBayesVisualization: React.FC<NaiveBayesVisualizationProps> = ({ 
  title, 
  animationSpeed = 1000 
}) => {
  const { width } = Dimensions.get('window');
  
  // Naive Bayes parametreleri
  const [smoothing, setSmoothing] = useState<number>(1.0); // Laplace smoothing
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Sample dataset - Email classification (Spam/Ham)
  const [dataset] = useState<DataPoint[]>([
    // Spam emails
    { id: 1, feature1: 15, feature2: 5, feature3: 'много', label: 'Spam' },
    { id: 2, feature1: 20, feature2: 8, feature3: 'много', label: 'Spam' },
    { id: 3, feature1: 18, feature2: 6, feature3: 'много', label: 'Spam' },
    { id: 4, feature1: 22, feature2: 9, feature3: 'средне', label: 'Spam' },
    { id: 5, feature1: 16, feature2: 7, feature3: 'много', label: 'Spam' },
    { id: 6, feature1: 19, feature2: 4, feature3: 'много', label: 'Spam' },
    { id: 7, feature1: 21, feature2: 10, feature3: 'средне', label: 'Spam' },
    { id: 8, feature1: 17, feature2: 5, feature3: 'много', label: 'Spam' },
    
    // Ham emails (legitimate)
    { id: 9, feature1: 8, feature2: 2, feature3: 'az', label: 'Ham' },
    { id: 10, feature1: 10, feature2: 3, feature3: 'az', label: 'Ham' },
    { id: 11, feature1: 12, feature2: 1, feature3: 'az', label: 'Ham' },
    { id: 12, feature1: 9, feature2: 2, feature3: 'средне', label: 'Ham' },
    { id: 13, feature1: 7, feature2: 1, feature3: 'az', label: 'Ham' },
    { id: 14, feature1: 11, feature2: 3, feature3: 'az', label: 'Ham' },
    { id: 15, feature1: 6, feature2: 1, feature3: 'az', label: 'Ham' },
    { id: 16, feature1: 13, feature2: 4, feature3: 'средне', label: 'Ham' },
  ]);
  
  const [testData, setTestData] = useState<TestData>({
    feature1: 15,
    feature2: 6,
    feature3: 'много'
  });
  
  const [probabilities, setProbabilities] = useState<ProbabilityCalculation[]>([]);
  const [classificationSteps, setClassificationSteps] = useState<string[]>([]);
  const [explanationText, setExplanationText] = useState<string>(
    'Naive Bayes algoritması görselleştirmesi. Test verilerini değiştirerek farklı sınıflandırma sonuçlarını görebilirsiniz.'
  );
  
  // Prior probability hesaplama
  const calculatePrior = (className: string): number => {
    const classCount = dataset.filter(d => d.label === className).length;
    return (classCount + smoothing) / (dataset.length + smoothing * getUniqueClasses().length);
  };
  
  // Unique classes
  const getUniqueClasses = (): string[] => {
    return [...new Set(dataset.map(d => d.label))];
  };
  
  // Continuous feature likelihood (Gaussian)
  const calculateGaussianLikelihood = (value: number, className: string, featureType: 'feature1' | 'feature2'): number => {
    const classData = dataset.filter(d => d.label === className);
    const values = classData.map(d => d[featureType]);
    
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    let variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    if (variance === 0) variance = 1e-6; // Prevent division by zero
    
    const exponent = -Math.pow(value - mean, 2) / (2 * variance);
    return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(exponent);
  };
  
  // Categorical feature likelihood
  const calculateCategoricalLikelihood = (value: string, className: string): number => {
    const classData = dataset.filter(d => d.label === className);
    const valueCount = classData.filter(d => d.feature3 === value).length;
    const uniqueValues = [...new Set(dataset.map(d => d.feature3))].length;
    
    return (valueCount + smoothing) / (classData.length + smoothing * uniqueValues);
  };
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Naive Bayes Classification
  const classifyData = async (): Promise<void> => {
    setIsClassifying(true);
    setClassificationSteps([]);
    setProbabilities([]);
    
    setExplanationText(`🎯 Test verisi sınıflandırılıyor: (${testData.feature1}, ${testData.feature2}, ${testData.feature3})`);
    await wait(speed);
    
    const classes = getUniqueClasses();
    const calculations: ProbabilityCalculation[] = [];
    
    setClassificationSteps(prev => [...prev, 
      `Adım 1: Prior probabilities hesaplanıyor`
    ]);
    await wait(speed);
    
    for (const className of classes) {
      setClassificationSteps(prev => [...prev, 
        `Adım 2: ${className} sınıfı için likelihood hesaplamaları`
      ]);
      
      // Prior probability
      const prior = calculatePrior(className);
      
      setExplanationText(`📊 ${className} için prior probability: P(${className}) = ${prior.toFixed(4)}`);
      await wait(speed);
      
      // Likelihood calculations
      const likelihood1 = calculateGaussianLikelihood(testData.feature1, className, 'feature1');
      setClassificationSteps(prev => [...prev, 
        `   P(feature1=${testData.feature1}|${className}) = ${likelihood1.toFixed(6)} (Gaussian)`
      ]);
      await wait(speed / 2);
      
      const likelihood2 = calculateGaussianLikelihood(testData.feature2, className, 'feature2');
      setClassificationSteps(prev => [...prev, 
        `   P(feature2=${testData.feature2}|${className}) = ${likelihood2.toFixed(6)} (Gaussian)`
      ]);
      await wait(speed / 2);
      
      const likelihood3 = calculateCategoricalLikelihood(testData.feature3, className);
      setClassificationSteps(prev => [...prev, 
        `   P(feature3=${testData.feature3}|${className}) = ${likelihood3.toFixed(4)} (Categorical)`
      ]);
      await wait(speed / 2);
      
      // Posterior (unnormalized)
      const posterior = prior * likelihood1 * likelihood2 * likelihood3;
      
      setClassificationSteps(prev => [...prev, 
        `   Posterior: ${prior.toFixed(4)} × ${likelihood1.toFixed(6)} × ${likelihood2.toFixed(6)} × ${likelihood3.toFixed(4)} = ${posterior.toFixed(8)}`
      ]);
      
      calculations.push({
        className,
        prior,
        likelihood1,
        likelihood2,
        likelihood3,
        posterior,
        normalizedPosterior: 0 // Will be calculated after all classes
      });
      
      await wait(speed);
    }
    
    // Normalize posteriors
    setClassificationSteps(prev => [...prev, 
      `Adım 3: Posterior probabilities normalize ediliyor`
    ]);
    
    const totalPosterior = calculations.reduce((sum, calc) => sum + calc.posterior, 0);
    
    calculations.forEach(calc => {
      calc.normalizedPosterior = calc.posterior / totalPosterior;
    });
    
    setExplanationText(`🧮 Normalization: Total posterior = ${totalPosterior.toFixed(8)}`);
    await wait(speed);
    
    // Show final results
    for (const calc of calculations) {
      setClassificationSteps(prev => [...prev, 
        `   P(${calc.className}|data) = ${calc.normalizedPosterior.toFixed(4)} (${(calc.normalizedPosterior * 100).toFixed(2)}%)`
      ]);
      await wait(speed / 2);
    }
    
    // Final prediction
    const predicted = calculations.reduce((prev, current) => 
      prev.normalizedPosterior > current.normalizedPosterior ? prev : current
    );
    
    setClassificationSteps(prev => [...prev, 
      `Sonuç: ${predicted.className} (${(predicted.normalizedPosterior * 100).toFixed(2)}% güven)`
    ]);
    
    setProbabilities(calculations);
    
    setExplanationText(
      `🎉 Sınıflandırma tamamlandı! Tahmin: ${predicted.className} (${(predicted.normalizedPosterior * 100).toFixed(2)}% güven)`
    );
    
    setIsClassifying(false);
  };
  
  // Input handlers
  const handleFeature1Change = (value: number): void => {
    setTestData(prev => ({ ...prev, feature1: value }));
  };
  
  const handleFeature2Change = (value: number): void => {
    setTestData(prev => ({ ...prev, feature2: value }));
  };
  
  const handleFeature3Change = (value: string): void => {
    setTestData(prev => ({ ...prev, feature3: value }));
  };
  
  // Reset function
  const resetClassification = (): void => {
    setProbabilities([]);
    setClassificationSteps([]);
    setExplanationText('🔄 Naive Bayes sınıflandırması sıfırlandı. Yeni test verisi girin ve sınıflandırma başlatın.');
  };
  
  // Get statistics for each class
  const getClassStatistics = () => {
    const classes = getUniqueClasses();
    return classes.map(className => {
      const classData = dataset.filter(d => d.label === className);
      const feature1Values = classData.map(d => d.feature1);
      const feature2Values = classData.map(d => d.feature2);
      
      const feature1Mean = feature1Values.reduce((sum, val) => sum + val, 0) / feature1Values.length;
      const feature2Mean = feature2Values.reduce((sum, val) => sum + val, 0) / feature2Values.length;
      
      const feature1Std = Math.sqrt(feature1Values.reduce((sum, val) => sum + Math.pow(val - feature1Mean, 2), 0) / feature1Values.length);
      const feature2Std = Math.sqrt(feature2Values.reduce((sum, val) => sum + Math.pow(val - feature2Mean, 2), 0) / feature2Values.length);
      
      return {
        className,
        count: classData.length,
        feature1Mean: feature1Mean.toFixed(2),
        feature1Std: feature1Std.toFixed(2),
        feature2Mean: feature2Mean.toFixed(2),
        feature2Std: feature2Std.toFixed(2)
      };
    });
  };

  // Tablo satırı (header)
  const renderTableHeader = () => {
    return (
      <View style={styles.tableRow}>
        <View style={[styles.tableHeader, styles.classColumn]}>
          <Text style={styles.tableHeaderText}>Sınıf</Text>
        </View>
        <View style={[styles.tableHeader, styles.countColumn]}>
          <Text style={styles.tableHeaderText}>Örnek Sayısı</Text>
        </View>
        <View style={[styles.tableHeader, styles.featureColumn]}>
          <Text style={styles.tableHeaderText}>Büyük Harf (μ±σ)</Text>
        </View>
        <View style={[styles.tableHeader, styles.featureColumn]}>
          <Text style={styles.tableHeaderText}>Ünlem (μ±σ)</Text>
        </View>
        <View style={[styles.tableHeader, styles.priorColumn]}>
          <Text style={styles.tableHeaderText}>Prior P(C)</Text>
        </View>
      </View>
    );
  };

  // Tablo satırı (data)
  const renderTableRow = (stat: any, index: number) => {
    return (
      <View key={index} style={styles.tableRow}>
        <View style={[styles.tableCell, styles.classColumn]}>
          <Text style={[
            styles.tableCellText, 
            styles.classCellText,
            { color: stat.className === 'Spam' ? '#e74c3c' : '#2ecc71' }
          ]}>
            {stat.className}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.countColumn]}>
          <Text style={styles.tableCellText}>{stat.count}</Text>
        </View>
        <View style={[styles.tableCell, styles.featureColumn]}>
          <Text style={styles.tableCellText}>
            {stat.feature1Mean} ± {stat.feature1Std}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.featureColumn]}>
          <Text style={styles.tableCellText}>
            {stat.feature2Mean} ± {stat.feature2Std}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.priorColumn]}>
          <Text style={styles.tableCellText}>
            {calculatePrior(stat.className).toFixed(3)}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{title}</Text>
        
        {/* Kontroller */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={resetClassification}
            disabled={isClassifying}
          >
            <Text style={styles.buttonText}>🔄 Sıfırla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={classifyData}
            disabled={isClassifying}
          >
            <Text style={styles.buttonText}>
              {isClassifying ? '🧮 Hesaplanıyor...' : '🎯 Sınıflandır'}
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
            disabled={isClassifying}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#bdc3c7"
          />
        </View>
        
        {/* Naive Bayes Parametreleri */}
        <View style={styles.paramsContainer}>
          <Text style={styles.sectionTitle}>Naive Bayes Parametreleri</Text>
          
          <View style={styles.paramControl}>
            <Text>Laplace Smoothing: {smoothing.toFixed(1)}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0.1}
              maximumValue={2.0}
              step={0.1}
              value={smoothing}
              onValueChange={(value) => setSmoothing(value)}
              disabled={isClassifying}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>📊 Naive Bayes:</Text> Bayes theorem ile sınıflandırma yapar. 
              Feature independence varsayımı ile P(X|C) = ∏P(xᵢ|C) hesaplar.
            </Text>
          </View>
        </View>
        
        {/* Test Data Input */}
        <View style={styles.paramsContainer}>
          <Text style={styles.sectionTitle}>🎯 Test Verisi (Email Özellikleri)</Text>
          
          <View style={styles.paramControl}>
            <Text>Büyük Harf Sayısı: {testData.feature1}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={5}
              maximumValue={25}
              step={1}
              value={testData.feature1}
              onValueChange={(value) => handleFeature1Change(value)}
              disabled={isClassifying}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Ünlem İşareti Sayısı: {testData.feature2}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={1}
              maximumValue={12}
              step={1}
              value={testData.feature2}
              onValueChange={(value) => handleFeature2Change(value)}
              disabled={isClassifying}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Promosyon Kelime Yoğunluğu: {testData.feature3}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  "Promosyon Kelime Yoğunluğu Seçin",
                  "Bir seçenek belirleyin",
                  [
                    { text: "Az", onPress: () => handleFeature3Change("az") },
                    { text: "Orta", onPress: () => handleFeature3Change("средне") },
                    { text: "Çok", onPress: () => handleFeature3Change("много") },
                  ]
                );
              }}
              disabled={isClassifying}
            >
              <Text style={styles.pickerButtonText}>
                {testData.feature3 === "az" ? "Az" : 
                 testData.feature3 === "средне" ? "Orta" : "Çok"} ▼
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Açıklama */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{explanationText}</Text>
        </View>
        
        {/* Training Data Statistics */}
        <View style={styles.environmentContainer}>
          <Text style={styles.sectionTitle}>📊 Training Data İstatistikleri</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableContainer}>
              {renderTableHeader()}
              {getClassStatistics().map((stat, index) => renderTableRow(stat, index))}
            </View>
          </ScrollView>
        </View>
        
        {/* Classification Steps */}
        {classificationSteps.length > 0 && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>🧮 Naive Bayes Hesaplama Adımları</Text>
            <ScrollView style={styles.stepsScrollView}>
              {classificationSteps.map((step, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.stepItem,
                    index === classificationSteps.length - 1 ? styles.lastStepItem : null
                  ]}
                >
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Probability Results */}
        {probabilities.length > 0 && (
          <View style={styles.qTableContainer}>
            <Text style={styles.sectionTitle}>📊 Posterior Probabilities</Text>
            <View style={styles.qTableGrid}>
              {probabilities.map((prob, index) => ( 
                <View key={index} style={styles.qTableEntry}>
                  <View style={[
                    styles.stateInfo,
                    {backgroundColor: prob.className === 'Spam' ? '#e74c3c' : '#2ecc71'}
                  ]}>
                    <Text style={styles.stateInfoText}>{prob.className}</Text>
                  </View>
                  <View style={styles.actionsInfo}>
                    <View style={styles.actionRow}>
                      <Text>Prior:</Text> 
                      <Text style={styles.actionValue}>{prob.prior.toFixed(4)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Text>L1 (Gaussian):</Text> 
                      <Text style={styles.actionValue}>{prob.likelihood1.toFixed(6)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Text>L2 (Gaussian):</Text> 
                      <Text style={styles.actionValue}>{prob.likelihood2.toFixed(6)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Text>L3 (Categorical):</Text> 
                      <Text style={styles.actionValue}>{prob.likelihood3.toFixed(4)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Text>Posterior:</Text> 
                      <Text style={[styles.actionValue, styles.posteriorValue]}>
                        {(prob.normalizedPosterior * 100).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Probability Visualization */}
        {probabilities.length > 0 && (
          <View style={styles.environmentContainer}>
            <Text style={styles.sectionTitle}>📈 Posterior Probability Dağılımı</Text>
            <View style={styles.chartContainer}>
              <Svg width={width - 40} height={200} style={styles.chart}>
                {/* Background */}
                <Rect x="0" y="0" width={width - 40} height="200" fill="#f8f9fa" />
                
                {/* Bars */}
                {probabilities.map((prob, index) => {
                  const barHeight = prob.normalizedPosterior * 150;
                  const barWidth = 120;
                  const x = 50 + index * 150;
                  const y = 180 - barHeight;
                  const color = prob.className === 'Spam' ? '#e74c3c' : '#2ecc71';
                  
                  return (
                    <G key={index}>
                      {/* Bar */}
                      <Rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                        opacity="0.7"
                      />
                      {/* Label */}
                      <SvgText
                        x={x + barWidth/2}
                        y={190}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#333"
                      >
                        {prob.className}
                      </SvgText>
                      {/* Percentage */}
                      <SvgText
                        x={x + barWidth/2}
                        y={y - 5}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill={color}
                      >
                        {(prob.normalizedPosterior * 100).toFixed(1)}%
                      </SvgText>
                    </G>
                  );
                })}
                
                {/* Y-axis labels */}
                <SvgText x="20" y="30" fontSize="10" fill="#666">100%</SvgText>
                <SvgText x="25" y="105" fontSize="10" fill="#666">50%</SvgText>
                <SvgText x="30" y="180" fontSize="10" fill="#666">0%</SvgText>
              </Svg>
            </View>
          </View>
        )}
        
        {/* Algorithm Comparison section adapted from PPO */}
        <View style={styles.algorithmComparisonContainer}>
          <Text style={styles.comparisonTitle}>🔄 Naive Bayes vs Diğer Sınıflandırma Yöntemleri</Text>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonItemTitle}>🎯 Naive Bayes</Text>
              <View style={styles.comparisonList}>
                <Text style={styles.comparisonListItem}>• Olasılık temelli yaklaşım</Text>
                <Text style={styles.comparisonListItem}>• Özellik bağımsızlığı varsayımı</Text>
                <Text style={styles.comparisonListItem}>• Hızlı eğitim ve tahmin</Text>
                <Text style={styles.comparisonListItem}>• Az veriyle bile çalışır</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonItemTitle}>🎭 Logistic Regression</Text>
              <View style={styles.comparisonList}>
                <Text style={styles.comparisonListItem}>• Doğrusal karar sınırı</Text>
                <Text style={styles.comparisonListItem}>• Olasılıksal yorumlama</Text>
                <Text style={styles.comparisonListItem}>• Gradyan temelli optimizasyon</Text>
                <Text style={styles.comparisonListItem}>• Özellikler arası ilişkiyi modeller</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonItemTitle}>🌳 Decision Tree</Text>
              <View style={styles.comparisonList}>
                <Text style={styles.comparisonListItem}>• Hiyerarşik karar yapısı</Text>
                <Text style={styles.comparisonListItem}>• Özellik etkileşimlerini yakalar</Text>
                <Text style={styles.comparisonListItem}>• Doğrusal olmayan sınırlar</Text>
                <Text style={styles.comparisonListItem}>• Kolay yorumlanabilir</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Final Result */}
        {probabilities.length > 0 && (
          <View style={styles.enhancedResultContainer}>
            <Text style={styles.resultTitle}>🎯 Naive Bayes Sınıflandırma Sonucu</Text>
            {(() => {
              const predicted = probabilities.reduce((prev, current) => 
                prev.normalizedPosterior > current.normalizedPosterior ? prev : current
              );
              return (
                <View>
                  <Text style={styles.enhancedResultClass}>
                    {predicted.className}
                  </Text>
                  <View style={styles.resultFeatures}>
                    <Text style={styles.resultFeatureTitle}>Email Özellikleri:</Text>
                    <View style={styles.resultFeatureGrid}>
                      <View style={styles.resultFeatureItem}>
                        <Text style={styles.resultFeatureLabel}>Büyük Harf:</Text>
                        <Text style={styles.resultFeatureValue}>{testData.feature1}</Text>
                      </View>
                      <View style={styles.resultFeatureItem}>
                        <Text style={styles.resultFeatureLabel}>Ünlem:</Text>
                        <Text style={styles.resultFeatureValue}>{testData.feature2}</Text>
                      </View>
                      <View style={styles.resultFeatureItem}>
                        <Text style={styles.resultFeatureLabel}>Promosyon:</Text>
                        <Text style={styles.resultFeatureValue}>
                          {testData.feature3 === "az" ? "Az" : 
                           testData.feature3 === "средне" ? "Orta" : "Çok"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.confidenceContainer}>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill, 
                          { 
                            width: (width - 80) * predicted.normalizedPosterior,
                            backgroundColor: predicted.className === 'Spam' ? '#e74c3c' : '#2ecc71'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.confidenceText}>
                      Güven: {(predicted.normalizedPosterior * 100).toFixed(2)}%
                    </Text>
                  </View>
                  <Text style={styles.smoothingInfo}>
                    Laplace Smoothing: {smoothing}
                  </Text>
                </View>
              );
            })()}
          </View>
        )}
        
        <View style={styles.infoSection}>
          <AlgorithmInfoCard algorithmType="naive bayes" />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 4,
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
    paddingHorizontal: 16,
  },
  paramsContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 16,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: 'white',
  },
  pickerButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3e0',
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
    marginHorizontal: 16,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  environmentContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  tableCell: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 12,
    textAlign: 'center',
  },
  classCellText: {
    fontWeight: 'bold',
  },
  classColumn: {
    width: 80,
  },
  countColumn: {
    width: 80,
  },
  featureColumn: {
    width: 120,
  },
  priorColumn: {
    width: 80,
  },
  stepsContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#3742fa',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepsScrollView: {
    maxHeight: 300,
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
    fontSize: 14,
    lineHeight: 20,
  },
  qTableContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  qTableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  qTableEntry: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    backgroundColor: 'white',
  },
  stateInfo: {
    padding: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  stateInfoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionsInfo: {
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  actionValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  posteriorValue: {
    fontSize: 14,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  chart: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  enhancedResultContainer: {
    marginVertical: 16,
    padding: 20,
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    marginHorizontal: 16,
    elevation: 4,
  },
  enhancedResultClass: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultFeatures: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultFeatureTitle: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  resultFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultFeatureItem: {
    width: '30%',
    marginBottom: 8,
  },
  resultFeatureLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  resultFeatureValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  confidenceContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  confidenceBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  smoothingInfo: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 8,
  },
  algorithmComparisonContainer: {
    backgroundColor: '#3742fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 16,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  comparisonGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  comparisonItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  comparisonItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  comparisonList: {
    paddingLeft: 8,
  },
  comparisonListItem: {
    fontSize: 12,
    color: 'white',
    lineHeight: 18,
    marginBottom: 4,
  },
  infoSection: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
});

export default NaiveBayesVisualization; 