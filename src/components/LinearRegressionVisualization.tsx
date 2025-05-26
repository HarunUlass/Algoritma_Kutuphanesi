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

// Linear Regression için veri tipleri
interface DataPoint {
  id: number;
  x: number;
  y: number;
}

interface RegressionModel {
  slope: number;      // w1 (weight)
  intercept: number;  // w0 (bias)
  cost: number;       // MSE cost
  rSquared: number;   // R-squared
}

interface GradientStep {
  iteration: number;
  slope: number;
  intercept: number;
  cost: number;
  gradientSlope: number;
  gradientIntercept: number;
}

interface LinearRegressionVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Linear Regression Visualization Component
const LinearRegressionVisualization: React.FC<LinearRegressionVisualizationProps> = ({ 
  title, 
  animationSpeed = 800 
}) => {
  const { width } = Dimensions.get('window');
  
  // Linear Regression parametreleri
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [maxIterations, setMaxIterations] = useState<number>(100);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentIteration, setCurrentIteration] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Sample dataset - Ev büyüklüğü vs Fiyat
  const [dataset] = useState<DataPoint[]>([
    { id: 1, x: 50, y: 120 },   // 50m² -> 120K TL
    { id: 2, x: 80, y: 200 },   // 80m² -> 200K TL
    { id: 3, x: 120, y: 280 },  // 120m² -> 280K TL
    { id: 4, x: 60, y: 150 },   // 60m² -> 150K TL
    { id: 5, x: 100, y: 240 },  // 100m² -> 240K TL
    { id: 6, x: 70, y: 170 },   // 70m² -> 170K TL
    { id: 7, x: 90, y: 210 },   // 90m² -> 210K TL
    { id: 8, x: 110, y: 260 },  // 110m² -> 260K TL
    { id: 9, x: 40, y: 100 },   // 40m² -> 100K TL
    { id: 10, x: 130, y: 300 }, // 130m² -> 300K TL
  ]);
  
  const [model, setModel] = useState<RegressionModel>({
    slope: 0,
    intercept: 0,
    cost: 0,
    rSquared: 0
  });
  
  const [gradientSteps, setGradientSteps] = useState<GradientStep[]>([]);
  const [explanationText, setExplanationText] = useState<string>(
    'Lineer Regresyon algoritması görselleştirmesi. Ev büyüklüğü ile fiyat arasındaki ilişki modellenir.'
  );
  
  // Mean Square Error hesaplama
  const calculateMSE = (slope: number, intercept: number): number => {
    let mse = 0;
    dataset.forEach(point => {
      const predicted = slope * point.x + intercept;
      const error = point.y - predicted;
      mse += error * error;
    });
    return mse / dataset.length;
  };
  
  // R-squared hesaplama
  const calculateRSquared = (slope: number, intercept: number): number => {
    const yMean = dataset.reduce((sum, point) => sum + point.y, 0) / dataset.length;
    
    let ssRes = 0; // Sum of squares of residuals
    let ssTot = 0; // Total sum of squares
    
    dataset.forEach(point => {
      const predicted = slope * point.x + intercept;
      ssRes += Math.pow(point.y - predicted, 2);
      ssTot += Math.pow(point.y - yMean, 2);
    });
    
    return 1 - (ssRes / ssTot);
  };
  
  // Gradient hesaplama
  const calculateGradients = (slope: number, intercept: number): { slopeGrad: number; interceptGrad: number } => {
    let slopeGrad = 0;
    let interceptGrad = 0;
    const n = dataset.length;
    
    dataset.forEach(point => {
      const predicted = slope * point.x + intercept;
      const error = predicted - point.y;
      
      slopeGrad += error * point.x;
      interceptGrad += error;
    });
    
    return {
      slopeGrad: (2 * slopeGrad) / n,
      interceptGrad: (2 * interceptGrad) / n
    };
  };
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Gradient Descent bir adımı
  const gradientDescentStep = async (iteration: number, currentSlope: number, currentIntercept: number): Promise<{ newSlope: number; newIntercept: number }> => {
    const gradients = calculateGradients(currentSlope, currentIntercept);
    const cost = calculateMSE(currentSlope, currentIntercept);
    
    // Gradient descent update
    const newSlope = currentSlope - learningRate * gradients.slopeGrad;
    const newIntercept = currentIntercept - learningRate * gradients.interceptGrad;
    
    // Store step
    const step: GradientStep = {
      iteration,
      slope: newSlope,
      intercept: newIntercept,
      cost,
      gradientSlope: gradients.slopeGrad,
      gradientIntercept: gradients.interceptGrad
    };
    
    setGradientSteps(prev => [...prev, step]);
    
    // Update model
    const rSquared = calculateRSquared(newSlope, newIntercept);
    setModel({
      slope: newSlope,
      intercept: newIntercept,
      cost,
      rSquared
    });
    
    setExplanationText(
      `İterasyon ${iteration}: Cost = ${cost.toFixed(3)}, Slope = ${newSlope.toFixed(3)}, Intercept = ${newIntercept.toFixed(3)}, R² = ${rSquared.toFixed(3)}`
    );
    
    await wait(speed);
    
    return { newSlope, newIntercept };
  };
  
  // Training başlatma
  const startTraining = async (): Promise<void> => {
    setIsTraining(true);
    setCurrentIteration(0);
    setGradientSteps([]);
    
    // Random initialization
    let currentSlope = Math.random() * 2;
    let currentIntercept = Math.random() * 50;
    
    setExplanationText(`📈 Lineer regresyon eğitimi başlıyor... İlk değerler: Slope=${currentSlope.toFixed(3)}, Intercept=${currentIntercept.toFixed(3)}`);
    await wait(speed);
    
    for (let i = 1; i <= maxIterations; i++) {
      if (!isTraining) break;
      
      setCurrentIteration(i);
      const result = await gradientDescentStep(i, currentSlope, currentIntercept);
      currentSlope = result.newSlope;
      currentIntercept = result.newIntercept;
      
      // Early stopping if converged
      if (i > 1 && gradientSteps.length > 0) {
        const lastCost = gradientSteps[gradientSteps.length - 1]?.cost || 0;
        const currentCost = calculateMSE(currentSlope, currentIntercept);
        if (Math.abs(lastCost - currentCost) < 0.001) {
          setExplanationText(`🎉 Convergence achieved at iteration ${i}! Final R² = ${calculateRSquared(currentSlope, currentIntercept).toFixed(3)}`);
          break;
        }
      }
    }
    
    setIsTraining(false);
    setExplanationText(`🎓 Lineer regresyon eğitimi tamamlandı! Final model: y = ${currentSlope.toFixed(3)}x + ${currentIntercept.toFixed(3)}`);
  };
  
  // Reset fonksiyonu
  const resetRegression = (): void => {
    setModel({ slope: 0, intercept: 0, cost: 0, rSquared: 0 });
    setGradientSteps([]);
    setCurrentIteration(0);
    setExplanationText('🔄 Lineer regresyon modeli sıfırlandı. Yeni eğitim başlatmak için eğitimi başlatın.');
  };
  
  // Prediction yapma
  const predict = (x: number): number => {
    return model.slope * x + model.intercept;
  };
  
  // Chart scales
  const chartWidth = Math.min(width - 40, 400);
  const chartHeight = 300;
  const padding = 50;
  
  const xMin = Math.min(...dataset.map(d => d.x)) - 10;
  const xMax = Math.max(...dataset.map(d => d.x)) + 10;
  const yMin = Math.min(...dataset.map(d => d.y)) - 20;
  const yMax = Math.max(...dataset.map(d => d.y)) + 20;
  
  const scaleX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * (chartWidth - 2 * padding);
  const scaleY = (y: number) => chartHeight - padding - ((y - yMin) / (yMax - yMin)) * (chartHeight - 2 * padding);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>{title}</Text>
        
        {/* Kontroller */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={resetRegression}
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
              {isTraining ? '📈 Eğitiliyor...' : '🚀 Gradient Descent'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Hız kontrolü */}
        <View style={styles.speedControl}>
          <Text>Hız: {speed}ms</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={200}
            maximumValue={1200}
            step={100}
            value={speed}
            onValueChange={(value) => setSpeed(value)}
            disabled={isTraining}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#bdc3c7"
          />
        </View>
        
        {/* Linear Regression Parametreleri */}
        <View style={styles.paramsContainer}>
          <Text style={styles.sectionTitle}>Lineer Regresyon Parametreleri</Text>
          
          <View style={styles.paramControl}>
            <Text>Learning Rate (α): {learningRate.toFixed(3)}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0.001}
              maximumValue={0.1}
              step={0.001}
              value={learningRate}
              onValueChange={(value) => setLearningRate(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Maksimum İterasyon: {maxIterations}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={50}
              maximumValue={200}
              step={10}
              value={maxIterations}
              onValueChange={(value) => setMaxIterations(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>📈 Lineer Regresyon:</Text> Gradient descent ile en küçük MSE'yi bulan doğru denklemi: 
              y = wx + b. R² değeri modelin açıklama gücünü gösterir.
            </Text>
          </View>
        </View>
        
        {/* Model Metrikleri */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🔢 İterasyon:</Text>
              <Text style={styles.statValue}>{currentIteration}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📐 Slope (w):</Text>
              <Text style={styles.statValue}>{model.slope.toFixed(3)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📍 Intercept (b):</Text>
              <Text style={styles.statValue}>{model.intercept.toFixed(3)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💰 MSE Cost:</Text>
              <Text style={styles.statValue}>{model.cost.toFixed(3)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📊 R-Squared:</Text>
              <Text style={styles.statValue}>{model.rSquared.toFixed(3)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🎯 Model Accuracy:</Text>
              <Text style={styles.statValue}>{(model.rSquared * 100).toFixed(1)}%</Text>
            </View>
          </View>
        </View>
        
        {/* Açıklama */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{explanationText}</Text>
        </View>
        
        {/* Regression Visualization */}
        <View style={styles.environmentContainer}>
          <Text style={styles.sectionTitle}>📈 Lineer Regresyon Grafiği</Text>
          <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
              {/* Axes */}
              <Line 
                x1={padding} 
                y1={chartHeight - padding} 
                x2={chartWidth - padding} 
                y2={chartHeight - padding} 
                stroke="#333" 
                strokeWidth="2"
              />
              <Line 
                x1={padding} 
                y1={padding} 
                x2={padding} 
                y2={chartHeight - padding} 
                stroke="#333" 
                strokeWidth="2"
              />
              
              {/* Axis labels */}
              <SvgText 
                x={chartWidth / 2} 
                y={chartHeight - 10} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#333"
              >
                Ev Büyüklüğü (m²)
              </SvgText>
              <SvgText 
                x="15" 
                y={chartHeight / 2} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#333"
                rotation="-90"
                originX="15"
                originY={chartHeight / 2}
              >
                Fiyat (K₺)
              </SvgText>
              
              {/* Grid lines */}
              {[60, 80, 100, 120].map(x => (
                <G key={`x-${x}`}>
                  <Line 
                    x1={scaleX(x)} 
                    y1={padding} 
                    x2={scaleX(x)} 
                    y2={chartHeight - padding} 
                    stroke="#eee" 
                    strokeWidth="1"
                  />
                  <SvgText 
                    x={scaleX(x)} 
                    y={chartHeight - padding + 15} 
                    textAnchor="middle" 
                    fontSize="10"
                    fill="#333"
                  >
                    {x}
                  </SvgText>
                </G>
              ))}
              {[100, 150, 200, 250, 300].map(y => (
                <G key={`y-${y}`}>
                  <Line 
                    x1={padding} 
                    y1={scaleY(y)} 
                    x2={chartWidth - padding} 
                    y2={scaleY(y)} 
                    stroke="#eee" 
                    strokeWidth="1"
                  />
                  <SvgText 
                    x={padding - 10} 
                    y={scaleY(y) + 5} 
                    textAnchor="end" 
                    fontSize="10"
                    fill="#333"
                  >
                    {y}
                  </SvgText>
                </G>
              ))}
              
              {/* Data points */}
              {dataset.map(point => (
                <Circle
                  key={`point-${point.id}`}
                  cx={scaleX(point.x)}
                  cy={scaleY(point.y)}
                  r="5"
                  fill="#3498db"
                  stroke="#2980b9"
                  strokeWidth="2"
                />
              ))}
              
              {/* Regression line */}
              {model.slope !== 0 && (
                <Line
                  x1={scaleX(xMin)}
                  y1={scaleY(predict(xMin))}
                  x2={scaleX(xMax)}
                  y2={scaleY(predict(xMax))}
                  stroke="#e74c3c"
                  strokeWidth="3"
                  opacity="0.8"
                />
              )}
              
              {/* Residual lines (errors) */}
              {model.slope !== 0 && dataset.map(point => (
                <Line
                  key={`residual-${point.id}`}
                  x1={scaleX(point.x)}
                  y1={scaleY(point.y)}
                  x2={scaleX(point.x)}
                  y2={scaleY(predict(point.x))}
                  stroke="#95a5a6"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ))}
            </Svg>
          </View>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.dataPointColor]} />
              <Text style={styles.legendText}>Veri Noktaları</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.regressionLineColor]} />
              <Text style={styles.legendText}>Regresyon Doğrusu</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.residualLineColor]} />
              <Text style={styles.legendText}>Hatalar (Residuals)</Text>
            </View>
          </View>
        </View>
        
        {/* Cost Function Visualization */}
        {gradientSteps.length > 0 && (
          <View style={styles.environmentContainer}>
            <Text style={styles.sectionTitle}>📉 Cost Function (MSE) Değişimi</Text>
            <View style={styles.chartContainer}>
              <Svg width={chartWidth} height={250} style={styles.chart}>
                {/* Axes */}
                <Line x1="50" y1="200" x2={chartWidth - 50} y2="200" stroke="#333" strokeWidth="2"/>
                <Line x1="50" y1="30" x2="50" y2="200" stroke="#333" strokeWidth="2"/>
                
                {/* Labels */}
                <SvgText x={chartWidth / 2} y="230" textAnchor="middle" fontSize="12" fill="#333">İterasyon</SvgText>
                <SvgText x="20" y="115" textAnchor="middle" fontSize="12" fill="#333" rotation="-90" originX="20" originY="115">MSE Cost</SvgText>
                
                {/* Cost curve */}
                {gradientSteps.length > 1 && (
                  <G>
                    {gradientSteps.map((step, index) => {
                      if (index === 0) return null;
                      
                      const prevStep = gradientSteps[index - 1];
                      const maxCost = Math.max(...gradientSteps.map(s => s.cost));
                      
                      const x1 = 50 + ((index - 1) / (gradientSteps.length - 1)) * (chartWidth - 100);
                      const y1 = 200 - (prevStep.cost / maxCost) * 170;
                      const x2 = 50 + (index / (gradientSteps.length - 1)) * (chartWidth - 100);
                      const y2 = 200 - (step.cost / maxCost) * 170;
                      
                      return (
                        <Line 
                          key={`cost-line-${index}`} 
                          x1={x1} 
                          y1={y1} 
                          x2={x2} 
                          y2={y2} 
                          stroke="#e67e22" 
                          strokeWidth="2" 
                        />
                      );
                    })}
                  </G>
                )}
                
                {/* Current point */}
                {gradientSteps.length > 0 && (
                  <Circle
                    cx={50 + ((gradientSteps.length - 1) / Math.max(gradientSteps.length - 1, 1)) * (chartWidth - 100)}
                    cy={200 - (gradientSteps[gradientSteps.length - 1].cost / Math.max(...gradientSteps.map(s => s.cost))) * 170}
                    r="4"
                    fill="#c0392b"
                  />
                )}
              </Svg>
            </View>
          </View>
        )}
        
        {/* Gradient Steps Display */}
        {gradientSteps.length > 0 && (
          <View style={styles.qTableContainer}>
            <Text style={styles.sectionTitle}>🔢 Gradient Descent Adımları (Son 5)</Text>
            <View style={styles.qTableGrid}>
              {gradientSteps.slice(-5).map((step, index) => ( 
                <View key={index} style={styles.qTableEntry}>
                  <View style={styles.stateInfo}>
                    <Text style={styles.stateInfoText}>İterasyon {step.iteration}</Text>
                  </View>
                  <View style={styles.actionsInfo}>
                    <View style={styles.actionRow}>
                      <Text>Slope:</Text> 
                      <Text style={styles.actionValue}>{step.slope.toFixed(3)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Text>Intercept:</Text> 
                      <Text style={styles.actionValue}>{step.intercept.toFixed(3)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Text>Cost:</Text> 
                      <Text style={styles.actionValue}>{step.cost.toFixed(3)}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Text>∇ Slope:</Text> 
                      <Text style={[
                        styles.actionValue, 
                        step.gradientSlope < 0 ? styles.positiveValue : styles.negativeValue
                      ]}>
                        {step.gradientSlope.toFixed(3)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Model Equation */}
        {model.slope !== 0 && (
          <View style={styles.modelEquationContainer}>
            <Text style={styles.modelTitle}>📐 Öğrenilen Model Denklemi</Text>
            <Text style={styles.modelEquation}>
              y = {model.slope.toFixed(3)}x + {model.intercept.toFixed(3)}
            </Text>
            <Text style={styles.modelDescription}>
              Ev Fiyatı = {model.slope.toFixed(3)} × Ev Büyüklüğü + {model.intercept.toFixed(3)}
            </Text>
            <Text style={styles.modelRSquared}>
              R² = {model.rSquared.toFixed(3)} ({(model.rSquared * 100).toFixed(1)}% varyans açıklanıyor)
            </Text>
          </View>
        )}
        
        <View style={styles.infoSection}>
          <AlgorithmInfoCard algorithmType="linear regression" />
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
    marginHorizontal: 16,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  statsContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  environmentContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  chart: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 5,
  },
  dataPointColor: {
    backgroundColor: '#3498db',
  },
  regressionLineColor: {
    backgroundColor: '#e74c3c',
    borderRadius: 0,
    height: 3,
  },
  residualLineColor: {
    backgroundColor: '#95a5a6',
    borderRadius: 0,
    height: 2,
  },
  legendText: {
    fontSize: 12,
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
    backgroundColor: '#34495e',
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
  positiveValue: {
    color: '#27ae60',
  },
  negativeValue: {
    color: '#e74c3c',
  },
  modelEquationContainer: {
    marginVertical: 12,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    backgroundColor: '#f39c12',
    alignItems: 'center',
  },
  modelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  modelEquation: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  modelDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  modelRSquared: {
    fontSize: 12,
    color: 'white',
    marginTop: 10,
    opacity: 0.8,
  },
  infoSection: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
});

export default LinearRegressionVisualization; 