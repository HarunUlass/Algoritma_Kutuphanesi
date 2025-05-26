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
  Rect,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { AlgorithmInfoCard } from './VisualizationHelpers';

interface AutoencoderVisualizationProps {
  title: string;
  animationSpeed?: number;
}

interface DataPoint {
  id: number;
  original: number[];
  encoded: number[];
  decoded: number[];
  reconstructionError: number;
}

// SVG constants
const { width } = Dimensions.get('window');
const SVG_WIDTH = width - 80;
const SVG_HEIGHT = 320;
const PADDING = 40;
const NODE_RADIUS = 12;
const LAYER_SPACING = (SVG_WIDTH - 2 * PADDING) / 4;

const AutoencoderVisualization: React.FC<AutoencoderVisualizationProps> = ({
  title,
  animationSpeed = 1000
}) => {
  // Visualization parameters
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [explanationText, setExplanationText] = useState<string>(
    'Otokodlayıcı (Autoencoder) görselleştirmesi. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.'
  );
  const [logs, setLogs] = useState<string[]>([]);

  // Network architecture
  const [inputSize, setInputSize] = useState<number>(6);
  const [latentSize, setLatentSize] = useState<number>(2);
  const [hiddenSize, setHiddenSize] = useState<number>(4);
  const [learningRate, setLearningRate] = useState<number>(0.1);
  const [epochs, setEpochs] = useState<number>(5);

  // Data for visualization
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentDataPointIndex, setCurrentDataPointIndex] = useState<number>(0);
  const [activationValues, setActivationValues] = useState<number[][]>([]);
  const [weights, setWeights] = useState<number[][][]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [batchReconstructionError, setBatchReconstructionError] = useState<number>(0);
  
  // Dataset properties
  const [datasetSize, setDatasetSize] = useState<number>(10);
  
  // Network architecture layers
  const layers = [
    { name: 'Input', size: inputSize },
    { name: 'Hidden Encoder', size: hiddenSize },
    { name: 'Latent', size: latentSize },
    { name: 'Hidden Decoder', size: hiddenSize },
    { name: 'Output', size: inputSize }
  ];
  
  // Generate random data
  useEffect(() => {
    generateData();
  }, [inputSize, latentSize, hiddenSize, datasetSize]);
  
  // Initialize network weights
  useEffect(() => {
    initializeWeights();
  }, [inputSize, hiddenSize, latentSize]);
  
  // Generate synthetic data
  const generateData = () => {
    const newDataPoints: DataPoint[] = [];
    
    for (let i = 0; i < datasetSize; i++) {
      // Generate original data (random normalized vector)
      const original = Array.from({ length: inputSize }, () => Math.random());
      
      // Initially, encoded and decoded are empty
      const encoded: number[] = [];
      const decoded: number[] = [];
      
      newDataPoints.push({
        id: i,
        original,
        encoded,
        decoded,
        reconstructionError: 0
      });
    }
    
    setDataPoints(newDataPoints);
    setBatchReconstructionError(0);
    setCurrentEpoch(0);
    setCurrentStep(0);
    setLogs([]);
    setExplanationText('Otokodlayıcı (Autoencoder) görselleştirmesi. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.');
  };
  
  // Initialize network weights with random values
  const initializeWeights = () => {
    const newWeights: number[][][] = [];
    
    // Encoder weights: Input -> Hidden
    const encoderWeights1: number[][] = [];
    for (let i = 0; i < hiddenSize; i++) {
      const neuronWeights: number[] = [];
      for (let j = 0; j < inputSize; j++) {
        neuronWeights.push((Math.random() - 0.5) * 0.2);
      }
      encoderWeights1.push(neuronWeights);
    }
    newWeights.push(encoderWeights1);
    
    // Encoder weights: Hidden -> Latent
    const encoderWeights2: number[][] = [];
    for (let i = 0; i < latentSize; i++) {
      const neuronWeights: number[] = [];
      for (let j = 0; j < hiddenSize; j++) {
        neuronWeights.push((Math.random() - 0.5) * 0.2);
      }
      encoderWeights2.push(neuronWeights);
    }
    newWeights.push(encoderWeights2);
    
    // Decoder weights: Latent -> Hidden
    const decoderWeights1: number[][] = [];
    for (let i = 0; i < hiddenSize; i++) {
      const neuronWeights: number[] = [];
      for (let j = 0; j < latentSize; j++) {
        neuronWeights.push((Math.random() - 0.5) * 0.2);
      }
      decoderWeights1.push(neuronWeights);
    }
    newWeights.push(decoderWeights1);
    
    // Decoder weights: Hidden -> Output
    const decoderWeights2: number[][] = [];
    for (let i = 0; i < inputSize; i++) {
      const neuronWeights: number[] = [];
      for (let j = 0; j < hiddenSize; j++) {
        neuronWeights.push((Math.random() - 0.5) * 0.2);
      }
      decoderWeights2.push(neuronWeights);
    }
    newWeights.push(decoderWeights2);
    
    setWeights(newWeights);
    
    // Initialize empty activation values
    const emptyActivations = layers.map(layer => 
      Array(layer.size).fill(0)
    );
    setActivationValues(emptyActivations);
  };
  
  // Sigmoid activation function
  const sigmoid = (x: number): number => {
    return 1 / (1 + Math.exp(-x));
  };
  
  // Forward pass (feed forward)
  const forwardPass = (input: number[]): { activations: number[][], output: number[] } => {
    const activations: number[][] = [];
    activations.push([...input]); // Input layer activations
    
    let currentActivations = [...input];
    
    // Process each layer
    for (let i = 0; i < weights.length; i++) {
      const layerWeights = weights[i];
      const nextLayerSize = layerWeights.length;
      const nextActivations: number[] = Array(nextLayerSize).fill(0);
      
      // For each neuron in the next layer
      for (let j = 0; j < nextLayerSize; j++) {
        let sum = 0;
        
        // Sum weighted inputs
        for (let k = 0; k < currentActivations.length; k++) {
          sum += currentActivations[k] * layerWeights[j][k];
        }
        
        // Apply activation function
        nextActivations[j] = sigmoid(sum);
      }
      
      activations.push(nextActivations);
      currentActivations = nextActivations;
    }
    
    return { 
      activations,
      output: currentActivations
    };
  };
  
  // Backpropagation (simplified for visualization)
  const backpropagate = (
    input: number[], 
    activations: number[][], 
    error: number[]
  ): number[][][] => {
    const weightGradients: number[][][] = weights.map(layer => 
      layer.map(neuron => Array(neuron.length).fill(0))
    );
    
    // Output layer error
    let deltas: number[] = error.map(err => err);
    
    // Backpropagate error through layers
    for (let i = weights.length - 1; i >= 0; i--) {
      const layerWeights = weights[i];
      const layerInputs = activations[i];
      const layerOutputs = activations[i + 1];
      
      // Calculate gradients for this layer
      for (let j = 0; j < layerWeights.length; j++) {
        for (let k = 0; k < layerWeights[j].length; k++) {
          weightGradients[i][j][k] = deltas[j] * layerInputs[k] * 
                                    layerOutputs[j] * (1 - layerOutputs[j]);
        }
      }
      
      // Calculate deltas for previous layer (only if not at the input layer)
      if (i > 0) {
        const prevDeltas: number[] = Array(layerInputs.length).fill(0);
        for (let j = 0; j < deltas.length; j++) {
          for (let k = 0; k < layerInputs.length; k++) {
            prevDeltas[k] += deltas[j] * layerWeights[j][k] * 
                           layerOutputs[j] * (1 - layerOutputs[j]);
          }
        }
        deltas = prevDeltas;
      }
    }
    
    return weightGradients;
  };
  
  // Update weights based on gradients
  const updateWeights = (gradients: number[][][], learningRate: number): void => {
    const updatedWeights = weights.map((layerWeights, layerIndex) => 
      layerWeights.map((neuronWeights, neuronIndex) => 
        neuronWeights.map((weight, weightIndex) => 
          weight - learningRate * gradients[layerIndex][neuronIndex][weightIndex]
        )
      )
    );
    
    setWeights(updatedWeights);
  };
  
  // Calculate reconstruction error (mean squared error)
  const calculateReconstructionError = (original: number[], reconstructed: number[]): number => {
    let sum = 0;
    for (let i = 0; i < original.length; i++) {
      sum += Math.pow(reconstructed[i] - original[i], 2);
    }
    return sum / original.length;
  };
  
  // Run the autoencoder training algorithm
  const runAutoencoder = async () => {
    if (isRunning) return;
    
    try {
      setIsRunning(true);
      setCurrentStep(0);
      setLogs([]);
      
      // Initialize step
      let stepLog = "Otokodlayıcı eğitimi başlatılıyor";
      setExplanationText(stepLog);
      setLogs(prev => [...prev, stepLog]);
      await wait(speed);
      setCurrentStep(1);
      
      // Initialize weights
      stepLog = "Ağırlıklar rastgele değerlerle başlatılıyor";
      setExplanationText(stepLog);
      setLogs(prev => [...prev, stepLog]);
      initializeWeights();
      await wait(speed);
      setCurrentStep(2);
      
      // Training loop
      for (let epoch = 0; epoch < epochs; epoch++) {
        setCurrentEpoch(epoch + 1);
        
        stepLog = `Epoch ${epoch + 1}/${epochs} başladı`;
        setExplanationText(stepLog);
        setLogs(prev => [...prev, stepLog]);
        
        let totalError = 0;
        
        // Process each data point
        for (let dataIndex = 0; dataIndex < dataPoints.length; dataIndex++) {
          setCurrentDataPointIndex(dataIndex);
          
          const dataPoint = dataPoints[dataIndex];
          const input = dataPoint.original;
          
          // Forward pass
          stepLog = `Veri Noktası ${dataIndex + 1}: İleri Yayılım (Forward Pass)`;
          setExplanationText(stepLog);
          setLogs(prev => [...prev, stepLog]);
          
          const { activations, output } = forwardPass(input);
          setActivationValues(activations);
          
          // Extract encoded representation (latent space)
          const encoded = activations[2]; // Layer 2 is the latent space
          
          // Update data point with encoded and decoded values
          const updatedDataPoints = [...dataPoints];
          updatedDataPoints[dataIndex].encoded = encoded;
          updatedDataPoints[dataIndex].decoded = output;
          
          // Calculate reconstruction error
          const error = output.map((val, i) => val - input[i]);
          const reconstructionError = calculateReconstructionError(input, output);
          updatedDataPoints[dataIndex].reconstructionError = reconstructionError;
          
          totalError += reconstructionError;
          setDataPoints(updatedDataPoints);
          await wait(speed / 2);
          
          // Backpropagation
          stepLog = `Veri Noktası ${dataIndex + 1}: Geri Yayılım (Backpropagation)`;
          setExplanationText(stepLog);
          setLogs(prev => [...prev, stepLog]);
          
          const gradients = backpropagate(input, activations, error);
          updateWeights(gradients, learningRate);
          await wait(speed / 2);
        }
        
        // Calculate average error for this epoch
        const avgError = totalError / dataPoints.length;
        setBatchReconstructionError(avgError);
        
        stepLog = `Epoch ${epoch + 1} tamamlandı. Ortalama Yeniden Yapılandırma Hatası: ${avgError.toFixed(4)}`;
        setExplanationText(stepLog);
        setLogs(prev => [...prev, stepLog]);
        await wait(speed);
      }
      
      // Training completed
      setCurrentStep(3);
      stepLog = `Eğitim tamamlandı! Son ortalama yeniden yapılandırma hatası: ${batchReconstructionError.toFixed(4)}`;
      setExplanationText(stepLog);
      setLogs(prev => [...prev, stepLog]);
      
    } catch (error) {
      console.error('Otokodlayıcı eğitiminde hata oluştu:', error);
      setExplanationText('Algoritma çalıştırılırken bir hata oluştu.');
      setLogs(prev => [...prev, 'HATA: Algoritma çalıştırılırken bir sorun oluştu.']);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Helper function to wait
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Render nodes in a layer
  const renderLayer = (layerIndex: number, x: number) => {
    const layer = layers[layerIndex];
    const neurons = [];
    
    const layerHeight = SVG_HEIGHT - 2 * PADDING;
    const nodeSpacing = layerHeight / (layer.size + 1);
    
    for (let i = 0; i < layer.size; i++) {
      const y = PADDING + nodeSpacing * (i + 1);
      const activationValue = activationValues[layerIndex] ? activationValues[layerIndex][i] || 0 : 0;
      
      // Color intensity based on activation value
      const intensity = Math.min(255, Math.floor(activationValue * 255));
      const fillColor = `rgb(${intensity}, ${intensity}, 255)`;
      
      neurons.push(
        <G key={`node-${layerIndex}-${i}`}>
          <Circle
            cx={x}
            cy={y}
            r={NODE_RADIUS}
            fill={fillColor}
            stroke="#333"
            strokeWidth="1.5"
          />
          {/* Display activation value for visible nodes */}
          {currentStep > 0 && activationValues[layerIndex] && (
            <SvgText
              x={x}
              y={y + 5}
              textAnchor="middle"
              fontSize="10"
              fill="#000"
            >
              {activationValue.toFixed(1)}
            </SvgText>
          )}
        </G>
      );
    }
    
    return neurons;
  };
  
  // Render connections between layers
  const renderConnections = (fromLayer: number, toLayer: number) => {
    const connections = [];
    const fromLayerConfig = layers[fromLayer];
    const toLayerConfig = layers[toLayer];
    
    const fromX = PADDING + fromLayer * LAYER_SPACING;
    const toX = PADDING + toLayer * LAYER_SPACING;
    
    const fromLayerHeight = SVG_HEIGHT - 2 * PADDING;
    const fromNodeSpacing = fromLayerHeight / (fromLayerConfig.size + 1);
    
    const toLayerHeight = SVG_HEIGHT - 2 * PADDING;
    const toNodeSpacing = toLayerHeight / (toLayerConfig.size + 1);
    
    // Get weights for this layer connection
    const layerWeights = weights[fromLayer] || [];
    
    for (let i = 0; i < fromLayerConfig.size; i++) {
      const fromY = PADDING + fromNodeSpacing * (i + 1);
      
      for (let j = 0; j < toLayerConfig.size; j++) {
        const toY = PADDING + toNodeSpacing * (j + 1);
        
        // Get weight value (if available)
        const weight = layerWeights[j] ? layerWeights[j][i] || 0 : 0;
        
        // Line thickness based on weight value
        const weightAbs = Math.abs(weight);
        const strokeWidth = Math.max(0.5, Math.min(3, weightAbs * 5));
        
        // Line color based on weight sign
        const strokeColor = weight >= 0 ? '#3498db' : '#e74c3c';
        
        connections.push(
          <Line
            key={`connection-${fromLayer}-${i}-${toLayer}-${j}`}
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeOpacity={0.6}
          />
        );
      }
    }
    
    return connections;
  };
  
  // Render current data point representation
  const renderDataRepresentation = () => {
    if (dataPoints.length === 0 || currentDataPointIndex >= dataPoints.length) {
      return null;
    }
    
    const dataPoint = dataPoints[currentDataPointIndex];
    
    return (
      <View style={styles.dataContainer}>
        <Text style={styles.dataTitle}>Veri Noktası {currentDataPointIndex + 1} Gösterimi</Text>
        
        <View style={styles.dataRepresentation}>
          {/* Original data */}
          <View style={styles.dataColumn}>
            <Text style={styles.dataLabel}>Orijinal</Text>
            <View style={styles.dataVisual}>
              {dataPoint.original.map((value, i) => (
                <View 
                  key={`original-${i}`} 
                  style={[
                    styles.dataBar, 
                    { height: value * 100, backgroundColor: '#3498db' }
                  ]}
                />
              ))}
            </View>
          </View>
          
          {/* Encoded data (latent space representation) */}
          {dataPoint.encoded.length > 0 && (
            <View style={styles.dataColumn}>
              <Text style={styles.dataLabel}>Kodlanmış</Text>
              <View style={styles.dataVisual}>
                {dataPoint.encoded.map((value, i) => (
                  <View 
                    key={`encoded-${i}`} 
                    style={[
                      styles.dataBar, 
                      { height: value * 100, backgroundColor: '#9b59b6' }
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
          
          {/* Decoded data (reconstruction) */}
          {dataPoint.decoded.length > 0 && (
            <View style={styles.dataColumn}>
              <Text style={styles.dataLabel}>Yeniden Oluşturulmuş</Text>
              <View style={styles.dataVisual}>
                {dataPoint.decoded.map((value, i) => (
                  <View 
                    key={`decoded-${i}`} 
                    style={[
                      styles.dataBar, 
                      { height: value * 100, backgroundColor: '#2ecc71' }
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Reconstruction error */}
        {dataPoint.reconstructionError > 0 && (
          <Text style={styles.errorText}>
            Yeniden Yapılandırma Hatası: {dataPoint.reconstructionError.toFixed(4)}
          </Text>
        )}
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Algorithm explanation */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Controls */}
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
          onPress={runAutoencoder}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isRunning ? '⏳ Çalışıyor...' : '▶️ Algoritmayı Çalıştır'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Parameters sliders */}
      <View style={styles.paramsContainer}>
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Girdi Boyutu: {inputSize}</Text>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={8}
            step={1}
            value={inputSize}
            onValueChange={(value) => setInputSize(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Gizli Katman Boyutu: {hiddenSize}</Text>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={6}
            step={1}
            value={hiddenSize}
            onValueChange={(value) => setHiddenSize(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Gizli Kodlama Boyutu: {latentSize}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={4}
            step={1}
            value={latentSize}
            onValueChange={(value) => setLatentSize(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Öğrenme Oranı: {learningRate.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.01}
            maximumValue={0.5}
            step={0.01}
            value={learningRate}
            onValueChange={(value) => setLearningRate(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Epoch Sayısı: {epochs}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={epochs}
            onValueChange={(value) => setEpochs(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isRunning}
          />
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
      </View>
      
      {/* Network Architecture Visualization */}
      <View style={styles.visualizationContainer}>
        <Text style={styles.visualizationTitle}>
          Otokodlayıcı Ağ Mimarisi
        </Text>
        
        <View style={styles.networkContainer}>
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
            {/* Layer labels */}
            {layers.map((layer, i) => (
              <SvgText
                key={`layer-label-${i}`}
                x={PADDING + i * LAYER_SPACING}
                y={20}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#333"
              >
                {layer.name}
              </SvgText>
            ))}
            
            {/* Connections */}
            {layers.slice(0, -1).map((_, i) => 
              renderConnections(i, i + 1)
            )}
            
            {/* Nodes */}
            {layers.map((_, i) => 
              renderLayer(i, PADDING + i * LAYER_SPACING)
            )}
          </Svg>
        </View>
      </View>
      
      {/* Data Representation */}
      {renderDataRepresentation()}
      
      {/* Progress Information */}
      {currentStep > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>
            Eğitim İlerlemesi - Epoch {currentEpoch}/{epochs}
          </Text>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(currentEpoch / epochs) * 100}%` }
              ]} 
            />
          </View>
          
          {batchReconstructionError > 0 && (
            <Text style={styles.batchError}>
              Ortalama Yeniden Yapılandırma Hatası: {batchReconstructionError.toFixed(4)}
            </Text>
          )}
        </View>
      )}
      
      {/* Algorithm Steps */}
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
      
      {/* Algorithm Info */}
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="autoencoder" />
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
  paramsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
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
  networkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
  },
  dataContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  dataRepresentation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  dataColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  dataVisual: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  dataBar: {
    width: 10,
    backgroundColor: '#3498db',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  batchError: {
    textAlign: 'center',
    marginTop: 8,
    color: '#e74c3c',
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
    marginBottom: 16,
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
});

export default AutoencoderVisualization; 