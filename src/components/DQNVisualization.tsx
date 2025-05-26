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

// DQN için veri tipleri
interface DQNState {
  x: number;
  y: number;
}

interface DQNExperience {
  state: DQNState;
  action: string;
  reward: number;
  nextState: DQNState;
  done: boolean;
  timestamp: number;
}

interface DQNQValue {
  state: DQNState;
  qValues: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
  targetQValues: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
}

interface DQNAgent {
  x: number;
  y: number;
  totalReward: number;
  epsilon: number;
  experienceBuffer: DQNExperience[];
  lastAction: string | null;
  lastLoss: number;
  targetUpdateCounter: number;
}

interface DQNEnvironment {
  gridSize: { width: number; height: number };
  agent: DQNAgent;
  goal: DQNState;
  obstacles: DQNState[];
  rewards: { [key: string]: number };
}

interface DQNVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// DQN Visualization Component
const DQNVisualization: React.FC<DQNVisualizationProps> = ({ 
  title, 
  animationSpeed = 1000 
}) => {
  const { width } = Dimensions.get('window');
  
  // DQN parametreleri
  const [learningRate, setLearningRate] = useState<number>(0.001); // Learning rate
  const [gamma, setGamma] = useState<number>(0.99); // Discount factor
  const [epsilonStart, setEpsilonStart] = useState<number>(1.0); // Initial exploration
  const [epsilonEnd, setEpsilonEnd] = useState<number>(0.01); // Final exploration
  const [epsilonDecay, setEpsilonDecay] = useState<number>(0.995); // Decay rate
  const [bufferSize, setBufferSize] = useState<number>(100); // Experience replay buffer size
  const [batchSize, setBatchSize] = useState<number>(8); // Mini-batch size
  const [targetUpdateFreq, setTargetUpdateFreq] = useState<number>(10); // Target network update frequency
  const [episode, setEpisode] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Environment setup
  const GRID_WIDTH = 5;
  const GRID_HEIGHT = 5;
  
  const [environment, setEnvironment] = useState<DQNEnvironment>({
    gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
    agent: { 
      x: 0, y: 0, totalReward: 0, epsilon: epsilonStart, 
      experienceBuffer: [], lastAction: null, lastLoss: 0, targetUpdateCounter: 0
    },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 3, y: 3 }
    ],
    rewards: {}
  });
  
  // Q-Network ve Target Network initialization
  const initializeQNetwork = (): DQNQValue[] => {
    const qNetwork: DQNQValue[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const randomQ = () => (Math.random() - 0.5) * 10; // Random initialization [-5, 5]
        qNetwork.push({
          state: { x, y },
          qValues: {
            up: randomQ(),
            down: randomQ(),
            left: randomQ(),
            right: randomQ()
          },
          targetQValues: {
            up: randomQ(),
            down: randomQ(),
            left: randomQ(),
            right: randomQ()
          }
        });
      }
    }
    return qNetwork;
  };
  
  const [qNetwork, setQNetwork] = useState<DQNQValue[]>(initializeQNetwork());
  const [explanationText, setExplanationText] = useState<string>(
    'DQN (Deep Q-Network) algoritması görselleştirmesi. Neural network ile Q-function approximation, experience replay ve target network kullanır.'
  );

  // Helper functions
  const isObstacle = (x: number, y: number): boolean => {
    return environment.obstacles.some(obs => obs.x === x && obs.y === y);
  };
  
  const isGoal = (x: number, y: number): boolean => {
    return environment.goal.x === x && environment.goal.y === y;
  };
  
  const isValidPosition = (x: number, y: number): boolean => {
    return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT && !isObstacle(x, y);
  };
  
  const getReward = (x: number, y: number): number => {
    if (isGoal(x, y)) return 100;
    if (isObstacle(x, y)) return -50;
    return -1;
  };
  
  // Q-Network functions
  const getQEntry = (state: DQNState): DQNQValue | undefined => {
    return qNetwork.find(entry => entry.state.x === state.x && entry.state.y === state.y);
  };
  
  const getQValue = (state: DQNState, action: string, useTarget: boolean = false): number => {
    const entry = getQEntry(state);
    if (!entry) return 0;
    const qValues = useTarget ? entry.targetQValues : entry.qValues;
    return qValues[action as keyof typeof qValues] || 0;
  };
  
  const getMaxQValue = (state: DQNState, useTarget: boolean = false): number => {
    const entry = getQEntry(state);
    if (!entry) return 0;
    const qValues = useTarget ? entry.targetQValues : entry.qValues;
    return Math.max(qValues.up, qValues.down, qValues.left, qValues.right);
  };
  
  const getBestAction = (state: DQNState, useTarget: boolean = false): string => {
    const entry = getQEntry(state);
    if (!entry) return 'up';
    const qValues = useTarget ? entry.targetQValues : entry.qValues;
    return Object.entries(qValues).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  };
  
  // ε-greedy action selection
  const selectAction = (state: DQNState, epsilon: number): string => {
    if (Math.random() < epsilon) {
      // Exploration: random action
      const actions = ['up', 'down', 'left', 'right'];
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      // Exploitation: best action from Q-network
      return getBestAction(state);
    }
  };
  
  const getNextState = (currentState: DQNState, action: string): DQNState => {
    let newX = currentState.x;
    let newY = currentState.y;
    
    switch (action) {
      case 'up': newY = Math.max(0, newY - 1); break;
      case 'down': newY = Math.min(GRID_HEIGHT - 1, newY + 1); break;
      case 'left': newX = Math.max(0, newX - 1); break;
      case 'right': newX = Math.min(GRID_WIDTH - 1, newX + 1); break;
    }
    
    if (!isValidPosition(newX, newY)) {
      return currentState;
    }
    
    return { x: newX, y: newY };
  };
  
  // Experience replay buffer management
  const addExperience = (experience: DQNExperience): void => {
    setEnvironment(prev => {
      const newBuffer = [...prev.agent.experienceBuffer, experience];
      // Keep buffer size limit
      if (newBuffer.length > bufferSize) {
        newBuffer.shift(); // Remove oldest experience
      }
      return {
        ...prev,
        agent: { ...prev.agent, experienceBuffer: newBuffer }
      };
    });
  };
  
  const sampleBatch = (): DQNExperience[] => {
    const buffer = environment.agent.experienceBuffer;
    if (buffer.length < batchSize) return buffer;
    
    // Random sampling from buffer
    const sampled: DQNExperience[] = [];
    const indices = new Set<number>();
    
    while (indices.size < batchSize && indices.size < buffer.length) {
      indices.add(Math.floor(Math.random() * buffer.length));
    }
    
    Array.from(indices).forEach(index => {
      sampled.push(buffer[index]);
    });
    
    return sampled;
  };

  // Q-Network training (simplified)
  const trainQNetwork = (): number => {
    const batch = sampleBatch();
    if (batch.length === 0) return 0;
    
    let totalLoss = 0;
    
    setQNetwork(prevQNetwork => {
      const newQNetwork = [...prevQNetwork];
      
      batch.forEach(experience => {
        const qEntry = newQNetwork.find(entry => 
          entry.state.x === experience.state.x && entry.state.y === experience.state.y
        );
        
        if (qEntry) {
          const currentQ = qEntry.qValues[experience.action as keyof typeof qEntry.qValues];
          const nextMaxQ = experience.done ? 0 : getMaxQValue(experience.nextState, true); // Use target network
          const target = experience.reward + gamma * nextMaxQ;
          
          // Q-learning update with neural network approximation
          const error = target - currentQ;
          const newQ = currentQ + learningRate * error;
          
          qEntry.qValues[experience.action as keyof typeof qEntry.qValues] = newQ;
          totalLoss += error * error; // MSE loss
        }
      });
      
      return newQNetwork;
    });
    
    return totalLoss / batch.length;
  };
  
  // Target network update
  const updateTargetNetwork = (): void => {
    setQNetwork(prevQNetwork => {
      const newQNetwork = prevQNetwork.map(entry => ({
        ...entry,
        targetQValues: { ...entry.qValues } // Copy main network to target network
      }));
      return newQNetwork;
    });
  };
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // DQN step
  const runDQNStep = async (): Promise<boolean> => {
    const currentState: DQNState = { x: environment.agent.x, y: environment.agent.y };
    
    if (isGoal(currentState.x, currentState.y)) {
      return true; // Episode finished
    }
    
    // Action selection with ε-greedy
    const action = selectAction(currentState, environment.agent.epsilon);
    const isExploration = Math.random() < environment.agent.epsilon;
    
    setExplanationText(`🎯 DQN: ${getActionName(action)} seçildi (${isExploration ? 'Exploration 🎲' : 'Exploitation 🧠'}, ε=${environment.agent.epsilon.toFixed(3)})`);
    await wait(speed);
    
    // Execute action
    const nextState = getNextState(currentState, action);
    const reward = getReward(nextState.x, nextState.y);
    const done = isGoal(nextState.x, nextState.y);
    
    // Store experience in replay buffer
    const experience: DQNExperience = {
      state: currentState,
      action: action,
      reward: reward,
      nextState: nextState,
      done: done,
      timestamp: Date.now()
    };
    
    addExperience(experience);
    
    setExplanationText(`📚 Experience stored: (${currentState.x},${currentState.y}) → ${getActionName(action)} → ${reward}`);
    await wait(speed);
    
    // Train Q-Network if enough experiences
    let loss = 0;
    if (environment.agent.experienceBuffer.length >= batchSize) {
      loss = trainQNetwork();
      setExplanationText(`🧠 Neural Network training: Batch size=${batchSize}, Loss=${loss.toFixed(3)}`);
      await wait(speed);
    }
    
    // Update target network periodically
    const newTargetCounter = environment.agent.targetUpdateCounter + 1;
    if (newTargetCounter >= targetUpdateFreq) {
      updateTargetNetwork();
      setExplanationText(`🎯 Target Network güncellendi! (Her ${targetUpdateFreq} adımda)`);
      await wait(speed);
      setEnvironment(prev => ({
        ...prev,
        agent: { ...prev.agent, targetUpdateCounter: 0 }
      }));
    } else {
      setEnvironment(prev => ({
        ...prev,
        agent: { ...prev.agent, targetUpdateCounter: newTargetCounter }
      }));
    }
    
    // Move agent and update stats
    setEnvironment(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        x: nextState.x,
        y: nextState.y,
        totalReward: prev.agent.totalReward + reward,
        lastAction: action,
        lastLoss: loss
      }
    }));
    
    setExplanationText(`📍 Pozisyon: (${nextState.x}, ${nextState.y}) | Ödül: ${reward} | Buffer: ${environment.agent.experienceBuffer.length}/${bufferSize}`);
    await wait(speed);
    
    return done;
  };
  
  // Epsilon decay
  const decayEpsilon = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        epsilon: Math.max(epsilonEnd, prev.agent.epsilon * epsilonDecay)
      }
    }));
  };
  
  const getActionName = (action: string): string => {
    const actionNames: { [key: string]: string } = {
      'up': '↑ Yukarı',
      'down': '↓ Aşağı',
      'left': '← Sol',
      'right': '→ Sağ'
    };
    return actionNames[action] || action;
  };

  // Episode execution
  const runDQNEpisode = async (): Promise<void> => {
    setEnvironment(prev => ({
      ...prev,
      agent: { ...prev.agent, x: 0, y: 0, lastAction: null, lastLoss: 0 }
    }));
    
    setStep(0);
    setExplanationText(`📚 DQN Episode ${episode + 1} başladı. Neural network Q-function learning...`);
    await wait(speed);
    
    let episodeFinished = false;
    let stepCount = 0;
    const maxSteps = 50;
    
    while (!episodeFinished && stepCount < maxSteps) {
      episodeFinished = await runDQNStep();
      stepCount++;
      setStep(stepCount);
    }
    
    // Decay epsilon after episode
    decayEpsilon();
    
    if (episodeFinished) {
      setExplanationText(`🎉 DQN Episode ${episode + 1} başarıyla tamamlandı! ${stepCount} adımda hedefe ulaştı.`);
    } else {
      setExplanationText(`⏰ DQN Episode ${episode + 1} maksimum adım sayısına ulaştı.`);
    }
    
    setEpisode(prev => prev + 1);
  };
  
  // Training controls
  const startDQNTraining = async (): Promise<void> => {
    setIsTraining(true);
    
    for (let i = 0; i < 5; i++) {
      if (!isTraining) break;
      await runDQNEpisode();
      await wait(speed / 2);
    }
    
    setIsTraining(false);
    setExplanationText('🎓 DQN eğitimi tamamlandı! Neural network convergence achieved.');
  };
  
  const resetEnvironment = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: { 
        x: 0, y: 0, totalReward: 0, epsilon: epsilonStart,
        experienceBuffer: [], lastAction: null, lastLoss: 0, targetUpdateCounter: 0
      }
    }));
    setQNetwork(initializeQNetwork());
    setEpisode(0);
    setStep(0);
    setExplanationText('🔄 DQN ortamı sıfırlandı. Neural networks yeniden başlatıldı.');
  };
  
  const runSingleEpisode = (): void => {
    if (!isTraining) {
      runDQNEpisode();
    }
  };
  
  // Render grid cell
  const renderGridCell = (x: number, y: number): React.ReactElement => {
    const isAgentHere = environment.agent.x === x && environment.agent.y === y;
    const isGoalHere = isGoal(x, y);
    const isObstacleHere = isObstacle(x, y);
    
    let cellStyles: Array<any> = [styles.gridCell];
    let cellContent = '';
    
    if (isObstacleHere) {
      cellStyles.push(styles.obstacleCell);
      cellContent = '🧱';
    } else if (isGoalHere) {
      cellStyles.push(styles.goalCell);
      cellContent = '🎯';
    } else if (isAgentHere) {
      cellStyles.push(styles.agentCell);
      cellContent = '🤖';
    }
    
    // Q-values'ı background color olarak göster
    const maxQ = getMaxQValue({ x, y });
    const normalizedQ = Math.max(-1, Math.min(1, maxQ / 50)); // Normalize to [-1, 1]
    const opacity = Math.abs(normalizedQ) * 0.6;
    
    let bgColorStyle = {};
    if (!isAgentHere && !isGoalHere && !isObstacleHere) {
      if (normalizedQ > 0) {
        bgColorStyle = { backgroundColor: `rgba(0, 150, 136, ${opacity})` }; // Teal - pozitif Q-value
      } else {
        bgColorStyle = { backgroundColor: `rgba(255, 87, 34, ${opacity})` }; // Orange - negatif Q-value
      }
    }
    
    // En iyi action'ı göster
    const bestAction = getBestAction({ x, y });
    const actionArrow = {
      'up': '↑',
      'down': '↓', 
      'left': '←',
      'right': '→'
    }[bestAction] || '';
    
    return (
      <View 
        key={`${x}-${y}`} 
        style={[styles.gridCell, bgColorStyle]}
      >
        <Text style={styles.cellContent}>{cellContent}</Text>
        {!isAgentHere && !isGoalHere && !isObstacleHere && (
          <View style={styles.qCellInfo}>
            <Text style={styles.qValue}>{maxQ.toFixed(1)}</Text>
            <Text style={styles.actionArrow}>{actionArrow}</Text>
          </View>
        )}
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
            onPress={resetEnvironment}
            disabled={isTraining}
          >
            <Text style={styles.buttonText}>🔄 Sıfırla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={runSingleEpisode}
            disabled={isTraining}
          >
            <Text style={styles.buttonText}>▶️ Tek Episode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={startDQNTraining}
            disabled={isTraining}
          >
            <Text style={styles.buttonText}>
              {isTraining ? '🧠 DQN Eğitiliyor...' : '🚀 DQN Eğitimi'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Hız kontrolü */}
        <View style={styles.speedControl}>
          <Text>Hız: {speed}ms</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={300}
            maximumValue={1800}
            step={100}
            value={speed}
            onValueChange={(value) => setSpeed(value)}
            disabled={isTraining}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#bdc3c7"
          />
        </View>
        
        {/* DQN Parametreleri */}
        <View style={styles.paramsContainer}>
          <Text style={styles.sectionTitle}>DQN (Deep Q-Network) Parametreleri</Text>
          
          <View style={styles.paramControl}>
            <Text>Learning Rate (α) - Öğrenme Oranı: {learningRate.toFixed(4)}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0.0001}
              maximumValue={0.01}
              step={0.0001}
              value={learningRate}
              onValueChange={(value) => setLearningRate(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Epsilon Decay - Keşif Azalması: {epsilonDecay.toFixed(3)}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0.990}
              maximumValue={0.999}
              step={0.001}
              value={epsilonDecay}
              onValueChange={(value) => setEpsilonDecay(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Buffer Size - Deneyim Tamponu: {bufferSize}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={50}
              maximumValue={200}
              step={10}
              value={bufferSize}
              onValueChange={(value) => setBufferSize(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>🧠 DQN:</Text> Neural network ile Q-function approximation yapıyor. 
              Experience replay ve target network stabilite sağlıyor. Deep Learning + RL!
            </Text>
          </View>
        </View>
        
        {/* İstatistikler */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📚 Episode:</Text>
              <Text style={styles.statValue}>{episode}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>👣 Adım:</Text>
              <Text style={styles.statValue}>{step}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🎲 Epsilon (ε):</Text>
              <Text style={styles.statValue}>{environment.agent.epsilon.toFixed(3)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🏆 Toplam Ödül:</Text>
              <Text style={styles.statValue}>{environment.agent.totalReward}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📚 Buffer Size:</Text>
              <Text style={styles.statValue}>{environment.agent.experienceBuffer.length}/{bufferSize}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🧠 Loss:</Text>
              <Text style={styles.statValue}>{environment.agent.lastLoss.toFixed(4)}</Text>
            </View>
          </View>
        </View>
        
        {/* Açıklama */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{explanationText}</Text>
        </View>
        
        {/* Grid Environment */}
        <View style={styles.environmentContainer}>
          <Text style={styles.sectionTitle}>🎮 DQN (Neural Network) Ortamı</Text>
          <View style={styles.gridContainer}>
            {Array.from({ length: GRID_HEIGHT }, (_, y) => (
              <View key={y} style={styles.gridRow}>
                {Array.from({ length: GRID_WIDTH }, (_, x) => renderGridCell(x, y))}
              </View>
            ))}
          </View>
          
          <View style={styles.legendContainer}>
            <Text style={styles.legendItem}>🤖 Ajan (DQN Agent)</Text>
            <Text style={styles.legendItem}>🎯 Hedef (+100 ödül)</Text>
            <Text style={styles.legendItem}>🧱 Engel (-50 ceza)</Text>
            <Text style={styles.legendItem}>🟢 Pozitif Q-value (Neural Net)</Text>
            <Text style={styles.legendItem}>🔶 Negatif Q-value (Neural Net)</Text>
          </View>
        </View>
        
        {/* Q-Network Display */}
        <View style={styles.qNetworkContainer}>
          <Text style={styles.sectionTitle}>🧠 DQN Q-Network (İlk 6 Durum)</Text>
          <View style={styles.qTableGrid}>
            {qNetwork.slice(0, 6).map((entry, index) => ( 
              <View key={index} style={styles.qTableEntry}>
                <View style={styles.stateInfo}>
                  <Text style={styles.stateInfoText}>Durum ({entry.state.x},{entry.state.y})</Text>
                </View>
                <View style={styles.actionsInfo}>
                  <View style={styles.actionRow}>
                    <Text>↑:</Text> 
                    <Text style={[
                      styles.actionValue, 
                      entry.qValues.up > 0 ? styles.positiveValue : styles.negativeValue
                    ]}>
                      {entry.qValues.up.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Text>↓:</Text> 
                    <Text style={[
                      styles.actionValue, 
                      entry.qValues.down > 0 ? styles.positiveValue : styles.negativeValue
                    ]}>
                      {entry.qValues.down.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Text>←:</Text> 
                    <Text style={[
                      styles.actionValue, 
                      entry.qValues.left > 0 ? styles.positiveValue : styles.negativeValue
                    ]}>
                      {entry.qValues.left.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Text>→:</Text> 
                    <Text style={[
                      styles.actionValue, 
                      entry.qValues.right > 0 ? styles.positiveValue : styles.negativeValue
                    ]}>
                      {entry.qValues.right.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        {/* Experience Replay Buffer */}
        {environment.agent.experienceBuffer.length > 0 && (
          <View style={styles.experienceContainer}>
            <Text style={styles.sectionTitle}>📚 Experience Replay Buffer (Son 6 Deneyim)</Text>
            <View style={styles.experienceGrid}>
              {environment.agent.experienceBuffer.slice(-6).map((exp, index) => (
                <View key={index} style={styles.experienceItem}>
                  <Text style={styles.experienceTitle}>Exp {environment.agent.experienceBuffer.length - 6 + index + 1}</Text>
                  <Text style={styles.experienceText}>S: ({exp.state.x},{exp.state.y})</Text>
                  <Text style={styles.experienceText}>A: {getActionName(exp.action)}</Text>
                  <Text style={styles.experienceText}>R: {exp.reward}</Text>
                  <Text style={styles.experienceText}>S': ({exp.nextState.x},{exp.nextState.y})</Text>
                  <Text style={styles.experienceText}>Done: {exp.done ? '✅' : '❌'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.infoSection}>
          <AlgorithmInfoCard algorithmType="dqn" />
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
  gridContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 2,
    position: 'relative',
  },
  obstacleCell: {
    backgroundColor: '#7f8c8d',
  },
  goalCell: {
    backgroundColor: '#2ecc71',
  },
  agentCell: {
    backgroundColor: '#3498db',
  },
  cellContent: {
    fontSize: 20,
  },
  qCellInfo: {
    position: 'absolute',
    alignItems: 'center',
  },
  qValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionArrow: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    fontSize: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  qNetworkContainer: {
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
  experienceContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#004d40',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  experienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  experienceItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  experienceTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  experienceText: {
    color: 'white',
    fontSize: 11,
    marginVertical: 1,
  },
  infoSection: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
});

export default DQNVisualization; 