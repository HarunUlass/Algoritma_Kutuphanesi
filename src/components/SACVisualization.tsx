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

// SAC için veri tipleri
interface SACState {
  x: number;
  y: number;
}

interface SACPolicyEntry {
  state: SACState;
  actionDistribution: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
  entropy: number;
}

interface SACQEntry {
  state: SACState;
  q1Values: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
  q2Values: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
  softValue: number; // V(s) = E[Q(s,a) - α*log(π(a|s))]
}

interface SACAgent {
  x: number;
  y: number;
  totalReward: number;
  temperature: number; // α parameter for entropy regularization
  lastEntropy: number;
  lastTemperatureLoss: number;
  lastPolicyLoss: number;
  lastQ1Loss: number;
  lastQ2Loss: number;
}

interface SACEnvironment {
  gridSize: { width: number; height: number };
  agent: SACAgent;
  goal: SACState;
  obstacles: SACState[];
  rewards: { [key: string]: number };
}

interface SACVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// SAC Visualization Component
const SACVisualization: React.FC<SACVisualizationProps> = ({ 
  title, 
  animationSpeed = 1100 
}) => {
  
  // SAC parametreleri
  const [learningRate, setLearningRate] = useState<number>(0.003); // Learning rate
  const [gamma, setGamma] = useState<number>(0.99); // Discount factor
  const [tau, setTau] = useState<number>(0.005); // Soft update parameter
  const [targetTemperature, setTargetTemperature] = useState<number>(0.2); // Target entropy
  const [autoTempTuning, setAutoTempTuning] = useState<boolean>(true); // Automatic temperature tuning
  const [episode, setEpisode] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Ekran genişliği ölçümü
  const { width } = Dimensions.get('window');
  
  // Environment setup
  const GRID_WIDTH = 5;
  const GRID_HEIGHT = 5;
  
  const [environment, setEnvironment] = useState<SACEnvironment>({
    gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
    agent: { 
      x: 0, y: 0, totalReward: 0, temperature: 0.2,
      lastEntropy: 0, lastTemperatureLoss: 0, lastPolicyLoss: 0, lastQ1Loss: 0, lastQ2Loss: 0
    },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 3, y: 3 }
    ],
    rewards: {}
  });
  
  // Policy initialization (stochastic)
  const initializePolicy = (): SACPolicyEntry[] => {
    const policy: SACPolicyEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        // Start with near-uniform distribution for maximum entropy
        const probs = { up: 0.25, down: 0.25, left: 0.25, right: 0.25 };
        const entropy = -Object.values(probs).reduce((sum, p) => sum + p * Math.log(p + 1e-8), 0);
        policy.push({
          state: { x, y },
          actionDistribution: probs,
          entropy: entropy
        });
      }
    }
    return policy;
  };
  
  // Twin Q-Networks initialization
  const initializeQNetworks = (): SACQEntry[] => {
    const qNetworks: SACQEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const randomQ = () => (Math.random() - 0.5) * 5; // Random initialization [-2.5, 2.5]
        qNetworks.push({
          state: { x, y },
          q1Values: {
            up: randomQ(),
            down: randomQ(),
            left: randomQ(),
            right: randomQ()
          },
          q2Values: {
            up: randomQ(),
            down: randomQ(),
            left: randomQ(),
            right: randomQ()
          },
          softValue: 0 // Will be calculated
        });
      }
    }
    return qNetworks;
  };
  
  const [policy, setPolicy] = useState<SACPolicyEntry[]>(initializePolicy());
  const [qNetworks, setQNetworks] = useState<SACQEntry[]>(initializeQNetworks());
  const [explanationText, setExplanationText] = useState<string>(
    'SAC (Soft Actor-Critic) algoritması görselleştirmesi. Maximum entropy framework ile exploration, twin Q-networks ve temperature parameter kullanır.'
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
  
  // Policy functions
  const getPolicyEntry = (state: SACState): SACPolicyEntry | undefined => {
    return policy.find(entry => entry.state.x === state.x && entry.state.y === state.y);
  };
  
  const getQEntry = (state: SACState): SACQEntry | undefined => {
    return qNetworks.find(entry => entry.state.x === state.x && entry.state.y === state.y);
  };
  
  // Soft value function: V(s) = E[Q(s,a) - α*log(π(a|s))]
  const calculateSoftValue = (state: SACState): number => {
    const policyEntry = getPolicyEntry(state);
    const qEntry = getQEntry(state);
    
    if (!policyEntry || !qEntry) return 0;
    
    const actions = ['up', 'down', 'left', 'right'] as const;
    let softValue = 0;
    
    actions.forEach(action => {
      const prob = policyEntry.actionDistribution[action];
      const q1 = qEntry.q1Values[action];
      const q2 = qEntry.q2Values[action];
      const minQ = Math.min(q1, q2); // Use minimum of twin Q-values
      const logProb = Math.log(prob + 1e-8);
      
      softValue += prob * (minQ - environment.agent.temperature * logProb);
    });
    
    return softValue;
  };
  
  // Sample action from stochastic policy
  const sampleAction = (state: SACState): string => {
    const entry = getPolicyEntry(state);
    if (!entry) return 'up';
    
    const actions = ['up', 'down', 'left', 'right'];
    const probabilities = [
      entry.actionDistribution.up,
      entry.actionDistribution.down,
      entry.actionDistribution.left,
      entry.actionDistribution.right
    ];
    
    const cumulativeProbs = probabilities.reduce((acc, prob, index) => {
      acc[index] = (acc[index - 1] || 0) + prob;
      return acc;
    }, [] as number[]);
    
    const random = Math.random();
    for (let i = 0; i < cumulativeProbs.length; i++) {
      if (random <= cumulativeProbs[i]) {
        return actions[i];
      }
    }
    return actions[0];
  };
  
  const getNextState = (currentState: SACState, action: string): SACState => {
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
  
  // Update soft value functions
  const updateSoftValues = (): void => {
    setQNetworks(prevQNetworks => {
      const newQNetworks = prevQNetworks.map(entry => ({
        ...entry,
        softValue: calculateSoftValue(entry.state)
      }));
      return newQNetworks;
    });
  };
  
  // SAC Q-learning update (Twin Q-networks)
  const updateQNetworks = (state: SACState, action: string, reward: number, nextState: SACState, done: boolean): { q1Loss: number; q2Loss: number } => {
    let q1Loss = 0;
    let q2Loss = 0;
    
    setQNetworks(prevQNetworks => {
      const newQNetworks = [...prevQNetworks];
      
      const qEntry = newQNetworks.find(entry => entry.state.x === state.x && entry.state.y === state.y);
      if (!qEntry) return newQNetworks;
      
      // Target value calculation with soft value function
      const nextSoftValue = done ? 0 : calculateSoftValue(nextState);
      const target = reward + gamma * nextSoftValue;
      
      // Update Q1
      const currentQ1 = qEntry.q1Values[action as keyof typeof qEntry.q1Values];
      const q1Error = target - currentQ1;
      qEntry.q1Values[action as keyof typeof qEntry.q1Values] = currentQ1 + learningRate * q1Error;
      q1Loss = q1Error * q1Error;
      
      // Update Q2
      const currentQ2 = qEntry.q2Values[action as keyof typeof qEntry.q2Values];
      const q2Error = target - currentQ2;
      qEntry.q2Values[action as keyof typeof qEntry.q2Values] = currentQ2 + learningRate * q2Error;
      q2Loss = q2Error * q2Error;
      
      return newQNetworks;
    });
    
    return { q1Loss, q2Loss };
  };
  
  // SAC Policy update with maximum entropy
  const updatePolicy = (state: SACState): { policyLoss: number; entropy: number } => {
    let policyLoss = 0;
    let entropy = 0;
    
    setPolicy(prevPolicy => {
      const newPolicy = [...prevPolicy];
      const policyEntry = newPolicy.find(entry => entry.state.x === state.x && entry.state.y === state.y);
      const qEntry = getQEntry(state);
      
      if (!policyEntry || !qEntry) return newPolicy;
      
      const actions = ['up', 'down', 'left', 'right'] as const;
      const newProbs = { ...policyEntry.actionDistribution };
      
      // Calculate new action probabilities with entropy regularization
      const temperatureParam = environment.agent.temperature;
      actions.forEach(action => {
        const q1 = qEntry.q1Values[action];
        const q2 = qEntry.q2Values[action];
        const minQ = Math.min(q1, q2);
        
        // Soft policy update: π(a|s) ∝ exp((Q(s,a) - V(s))/α)
        const advantage = minQ - qEntry.softValue;
        const logit = advantage / temperatureParam;
        newProbs[action] = Math.exp(logit);
      });
      
      // Normalize to make it a probability distribution
      const sum = Object.values(newProbs).reduce((s, p) => s + p, 0);
      actions.forEach(action => {
        newProbs[action] = newProbs[action] / sum;
      });
      
      // Calculate entropy and policy loss
      entropy = -Object.values(newProbs).reduce((sum, p) => sum + p * Math.log(p + 1e-8), 0);
      
      // Soft policy gradient loss (simplified)
      const expectedQ = actions.reduce((sum, action) => {
        const q1 = qEntry.q1Values[action];
        const q2 = qEntry.q2Values[action];
        const minQ = Math.min(q1, q2);
        return sum + newProbs[action] * minQ;
      }, 0);
      
      policyLoss = -(expectedQ + temperatureParam * entropy); // Maximize entropy-regularized expected return
      
      // Update policy entry
      policyEntry.actionDistribution = newProbs;
      policyEntry.entropy = entropy;
      
      return newPolicy;
    });
    
    return { policyLoss, entropy };
  };
  
  // Temperature (α) parameter update for automatic tuning
  const updateTemperature = (entropy: number): number => {
    if (!autoTempTuning) return 0;
    
    const entropyError = targetTemperature - entropy;
    const temperatureLoss = Math.abs(entropyError);
    
    setEnvironment(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        temperature: Math.max(0.01, prev.agent.temperature + learningRate * entropyError)
      }
    }));
    
    return temperatureLoss;
  };
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // SAC step
  const runSACStep = async (): Promise<boolean> => {
    const currentState: SACState = { x: environment.agent.x, y: environment.agent.y };
    
    if (isGoal(currentState.x, currentState.y)) {
      return true; // Episode finished
    }
    
    // Sample action from stochastic policy
    const action = sampleAction(currentState);
    const policyEntry = getPolicyEntry(currentState);
    const actionProb = policyEntry ? policyEntry.actionDistribution[action as keyof typeof policyEntry.actionDistribution] : 0.25;
    const currentEntropy = policyEntry ? policyEntry.entropy : 0;
    
    setExplanationText(`🎲 SAC: ${getActionName(action)} seçildi (prob: ${actionProb.toFixed(3)}, entropy: ${currentEntropy.toFixed(3)}, α: ${environment.agent.temperature.toFixed(3)})`);
    await wait(speed);
    
    // Execute action
    const nextState = getNextState(currentState, action);
    const reward = getReward(nextState.x, nextState.y);
    const done = isGoal(nextState.x, nextState.y);
    
    setExplanationText(`🎯 Action executed: Reward=${reward}, Next state=(${nextState.x}, ${nextState.y})`);
    await wait(speed);
    
    // Update Q-networks (Twin Q-learning)
    const { q1Loss, q2Loss } = updateQNetworks(currentState, action, reward, nextState, done);
    
    setExplanationText(`🧠 Twin Q-Networks updated: Q1 Loss=${q1Loss.toFixed(4)}, Q2 Loss=${q2Loss.toFixed(4)}`);
    await wait(speed);
    
    // Update soft values
    updateSoftValues();
    
    // Update policy with maximum entropy
    const { policyLoss, entropy } = updatePolicy(currentState);
    
    setExplanationText(`🎭 Policy updated with entropy regularization: Entropy=${entropy.toFixed(3)}`);
    await wait(speed);
    
    // Update temperature (automatic tuning)
    const temperatureLoss = updateTemperature(entropy);
    
    if (autoTempTuning) {
      setExplanationText(`🌡️ Temperature auto-tuned: α=${environment.agent.temperature.toFixed(3)}, Target entropy=${targetTemperature.toFixed(3)}`);
      await wait(speed);
    }
    
    // Move agent and update stats
    setEnvironment(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        x: nextState.x,
        y: nextState.y,
        totalReward: prev.agent.totalReward + reward,
        lastEntropy: entropy,
        lastTemperatureLoss: temperatureLoss,
        lastPolicyLoss: policyLoss,
        lastQ1Loss: q1Loss,
        lastQ2Loss: q2Loss
      }
    }));
    
    setExplanationText(`📍 Pozisyon: (${nextState.x}, ${nextState.y}) | Ödül: ${reward} | Max Entropy Principle aktif`);
    await wait(speed);
    
    return done;
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
  const runSACEpisode = async (): Promise<void> => {
    setEnvironment(prev => ({
      ...prev,
      agent: { 
        ...prev.agent, 
        x: 0, y: 0, 
        lastEntropy: 0, lastTemperatureLoss: 0, lastPolicyLoss: 0, lastQ1Loss: 0, lastQ2Loss: 0
      }
    }));
    
    setStep(0);
    setExplanationText(`📚 SAC Episode ${episode + 1} başladı. Maximum entropy reinforcement learning...`);
    await wait(speed);
    
    let episodeFinished = false;
    let stepCount = 0;
    const maxSteps = 50;
    
    while (!episodeFinished && stepCount < maxSteps) {
      episodeFinished = await runSACStep();
      stepCount++;
      setStep(stepCount);
    }
    
    if (episodeFinished) {
      setExplanationText(`🎉 SAC Episode ${episode + 1} başarıyla tamamlandı! ${stepCount} adımda hedefe ulaştı.`);
    } else {
      setExplanationText(`⏰ SAC Episode ${episode + 1} maksimum adım sayısına ulaştı.`);
    }
    
    setEpisode(prev => prev + 1);
  };
  
  // Training controls
  const startSACTraining = async (): Promise<void> => {
    setIsTraining(true);
    
    for (let i = 0; i < 4; i++) { // 4 episode (SAC daha karmaşık)
      if (!isTraining) break;
      await runSACEpisode();
      await wait(speed / 2);
    }
    
    setIsTraining(false);
    setExplanationText('🎓 SAC eğitimi tamamlandı! Maximum entropy reinforcement learning achieved.');
  };
  
  const resetEnvironment = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: { 
        x: 0, y: 0, totalReward: 0, temperature: 0.2,
        lastEntropy: 0, lastTemperatureLoss: 0, lastPolicyLoss: 0, lastQ1Loss: 0, lastQ2Loss: 0
      }
    }));
    setPolicy(initializePolicy());
    setQNetworks(initializeQNetworks());
    setEpisode(0);
    setStep(0);
    setExplanationText('🔄 SAC ortamı sıfırlandı. Twin Q-networks ve stochastic policy yeniden başlatıldı.');
  };
  
  const runSingleEpisode = (): void => {
    if (!isTraining) {
      runSACEpisode();
    }
  };

  // Render grid cell
  const renderGridCell = (x: number, y: number): React.ReactElement => {
    const isAgentHere = environment.agent.x === x && environment.agent.y === y;
    const isGoalHere = isGoal(x, y);
    const isObstacleHere = isObstacle(x, y);
    
    let cellContent = '';
    
    // Policy entry ve Q entry
    const policyEntry = getPolicyEntry({ x, y });
    const qEntry = getQEntry({ x, y });
    
    let cellStyle = {...styles.gridCell};
    
    if (isObstacleHere) {
      cellStyle = {...cellStyle, ...styles.obstacleCell};
      cellContent = '🧱';
    } else if (isGoalHere) {
      cellStyle = {...cellStyle, ...styles.goalCell};
      cellContent = '🎯';
    } else if (isAgentHere) {
      cellStyle = {...cellStyle, ...styles.agentCell};
      cellContent = '🤖';
    } else if (policyEntry && qEntry) {
      // Entropy'yi background color olarak göster
      const entropy = policyEntry.entropy;
      const maxEntropy = Math.log(4); // Maximum entropy for 4 actions
      const normalizedEntropy = entropy / maxEntropy;
      const opacity = normalizedEntropy * 0.7;
      
      // Create a custom style object with backgroundColor
      const entropyStyle = {
        backgroundColor: `rgba(156, 39, 176, ${opacity})`
      };
      
      // En yüksek olasılıklı eylemi ok ile göster
      const bestAction = Object.entries(policyEntry.actionDistribution)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      const actionArrow = {
        'up': '↑',
        'down': '↓', 
        'left': '←',
        'right': '→'
      }[bestAction] || '';
      
      return (
        <View key={`${x}-${y}`} style={[cellStyle, entropyStyle]}>
          <Text style={styles.entropyText}>{entropy.toFixed(2)}</Text>
          <Text style={styles.actionArrow}>{actionArrow}</Text>
        </View>
      );
    }
    
    return (
      <View key={`${x}-${y}`} style={cellStyle}>
        <Text style={styles.cellContentText}>{cellContent}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.buttonText}>▶️ Episode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={startSACTraining}
          disabled={isTraining}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isTraining ? '🎓 Eğitim...' : '🚀 Eğitim'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.speedContainer}>
        <Text style={styles.sliderLabel}>Hız: {speed}ms</Text>
        <Slider
          style={styles.slider}
          minimumValue={400}
          maximumValue={2000}
          step={100}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isTraining}
        />
      </View>
      
      {/* SAC Parametreleri */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>SAC Parametreleri</Text>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Learning Rate: {learningRate.toFixed(4)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.0001}
            maximumValue={0.01}
            step={0.0001}
            value={learningRate}
            onValueChange={(value) => setLearningRate(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Soft Update (τ): {tau.toFixed(3)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.001}
            maximumValue={0.01}
            step={0.001}
            value={tau}
            onValueChange={(value) => setTau(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Target Entropy: {targetTemperature.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={0.5}
            step={0.01}
            value={targetTemperature}
            onValueChange={(value) => setTargetTemperature(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
        </View>
        
        <View style={styles.baselineContainer}>
          <Text style={styles.paramLabel}>Automatic Temperature Tuning</Text>
          <Switch
            value={autoTempTuning}
            onValueChange={(value) => setAutoTempTuning(value)}
            disabled={isTraining}
            thumbColor={autoTempTuning ? '#4CAF50' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#8bc34a' }}
          />
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{fontWeight: 'bold'}}>🧪 SAC:</Text> Maximum entropy framework ile exploration maximize ediyor. 
            Twin Q-networks stabilite sağlıyor, temperature parameter entropy'yi kontrol ediyor!
          </Text>
        </View>
      </View>
      
      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>📚 Episode:</Text>
            <Text style={styles.statValue}>{episode}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>👣 Adım:</Text>
            <Text style={styles.statValue}>{step}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🌡️ Temperature (α):</Text>
            <Text style={styles.statValue}>{environment.agent.temperature.toFixed(3)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🏆 Toplam Ödül:</Text>
            <Text style={styles.statValue}>{environment.agent.totalReward}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>📍 Pozisyon:</Text>
            <Text style={styles.statValue}>({environment.agent.x}, {environment.agent.y})</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🎲 Entropy:</Text>
            <Text style={styles.statValue}>{environment.agent.lastEntropy.toFixed(3)}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🧠 Q1 Loss:</Text>
            <Text style={styles.statValue}>{environment.agent.lastQ1Loss.toFixed(4)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🧠 Q2 Loss:</Text>
            <Text style={styles.statValue}>{environment.agent.lastQ2Loss.toFixed(4)}</Text>
          </View>
        </View>
      </View>
      
      {/* Açıklama */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Grid Environment */}
      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>🎮 SAC (Maximum Entropy) Ortamı</Text>
        
        <View style={styles.gridContainer}>
          {Array.from({ length: GRID_HEIGHT }).map((_, y) => (
            <View key={y} style={styles.gridRow}>
              {Array.from({ length: GRID_WIDTH }).map((_, x) => renderGridCell(x, y))}
            </View>
          ))}
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>🤖 Ajan (SAC Agent)</Text>
            <Text style={styles.legendItem}>🎯 Hedef (+100)</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>🧱 Engel (-50)</Text>
            <Text style={styles.legendItem}>⬆️ En iyi eylem</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>🟣 Entropy Level</Text>
            <Text style={styles.legendItem}>🎲 Stochastic policy</Text>
          </View>
        </View>
      </View>
      
      {/* Twin Q-Networks Display */}
      <View style={styles.networkDisplayContainer}>
        <Text style={styles.sectionTitle}>🧠 Twin Q-Networks (İlk 6 Durum)</Text>
        
        <View style={styles.networkSplitContainer}>
          {/* Q1 Network */}
          <View style={styles.networkSection}>
            <Text style={styles.networkTitle}>Q1 Network</Text>
            
            <View style={styles.qTableGrid}>
              {qNetworks.slice(0, 6).map((entry, index) => ( 
                <View key={index} style={styles.qTableEntry}>
                  <Text style={styles.stateInfo}>
                    Durum ({entry.state.x},{entry.state.y})
                  </Text>
                  
                  <View style={styles.actionsContainer}>
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>↑:</Text> 
                      <Text style={[styles.actionValue, entry.q1Values.up > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q1Values.up.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>↓:</Text> 
                      <Text style={[styles.actionValue, entry.q1Values.down > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q1Values.down.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>←:</Text> 
                      <Text style={[styles.actionValue, entry.q1Values.left > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q1Values.left.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>→:</Text> 
                      <Text style={[styles.actionValue, entry.q1Values.right > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q1Values.right.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          {/* Q2 Network */}
          <View style={styles.networkSection}>
            <Text style={styles.networkTitle}>Q2 Network</Text>
            
            <View style={styles.qTableGrid}>
              {qNetworks.slice(0, 6).map((entry, index) => ( 
                <View key={index} style={styles.qTableEntry}>
                  <Text style={styles.stateInfo}>
                    Durum ({entry.state.x},{entry.state.y})
                  </Text>
                  
                  <View style={styles.actionsContainer}>
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>↑:</Text> 
                      <Text style={[styles.actionValue, entry.q2Values.up > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q2Values.up.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>↓:</Text> 
                      <Text style={[styles.actionValue, entry.q2Values.down > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q2Values.down.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>←:</Text> 
                      <Text style={[styles.actionValue, entry.q2Values.left > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q2Values.left.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>→:</Text> 
                      <Text style={[styles.actionValue, entry.q2Values.right > 0 ? styles.positiveValue : styles.negativeValue]}>
                        {entry.q2Values.right.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
      
      {/* Policy Distribution with Entropy */}
      <View style={styles.policyTableContainer}>
        <Text style={styles.sectionTitle}>🎭 Stochastic Policy with Entropy (İlk 6 Durum)</Text>
        
        <View style={styles.policyTableGrid}>
          {policy.slice(0, 6).map((entry, index) => ( 
            <View key={index} style={styles.policyTableEntry}>
              <Text style={styles.stateInfo}>
                Durum ({entry.state.x},{entry.state.y})
              </Text>
              <Text style={styles.entropyLabel}>
                Entropy: {entry.entropy.toFixed(3)}
              </Text>
              
              <View style={styles.actionsContainer}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↑:</Text> 
                  <Text style={styles.probabilityValue}>
                    {(entry.actionDistribution.up * 100).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↓:</Text> 
                  <Text style={styles.probabilityValue}>
                    {(entry.actionDistribution.down * 100).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>←:</Text> 
                  <Text style={styles.probabilityValue}>
                    {(entry.actionDistribution.left * 100).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>→:</Text> 
                  <Text style={styles.probabilityValue}>
                    {(entry.actionDistribution.right * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {/* Algoritma Karşılaştırması */}
      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonSectionTitle}>🔄 SAC vs Diğer Advanced RL Methods</Text>
        
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>🧪 SAC (Max Entropy)</Text>
          <View style={styles.comparisonList}>
            <Text style={styles.comparisonItem}>• Maximum entropy framework</Text>
            <Text style={styles.comparisonItem}>• Twin Q-networks (Q1, Q2)</Text>
            <Text style={styles.comparisonItem}>• Automatic temperature tuning</Text>
            <Text style={styles.comparisonItem}>• Stochastic policy</Text>
          </View>
        </View>
        
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>🎯 PPO (Policy)</Text>
          <View style={styles.comparisonList}>
            <Text style={styles.comparisonItem}>• Clipped surrogate objective</Text>
            <Text style={styles.comparisonItem}>• Trust region constraint</Text>
            <Text style={styles.comparisonItem}>• Single Q-network</Text>
            <Text style={styles.comparisonItem}>• No entropy regularization</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="sac" />
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
  paramRow: {
    marginBottom: 12,
  },
  paramLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  baselineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
  },
  infoBox: {
    backgroundColor: '#f4e6ff',
    borderRadius: 6,
    padding: 10,
    marginTop: 15,
  },
  infoBoxText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  gridContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  obstacleCell: {
    backgroundColor: '#7E57C2',
  },
  goalCell: {
    backgroundColor: '#66BB6A',
  },
  agentCell: {
    backgroundColor: '#42A5F5',
  },
  cellContentText: {
    fontSize: 20,
  },
  entropyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  actionArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  legendContainer: {
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  legendItem: {
    fontSize: 14,
  },
  networkDisplayContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  networkSplitContainer: {
    flexDirection: 'column', // Changed to column for better mobile display
  },
  networkSection: {
    marginBottom: 16,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  qTableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  qTableEntry: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  stateInfo: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  actionsContainer: {
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positiveValue: {
    color: '#4CAF50',
  },
  negativeValue: {
    color: '#f44336',
  },
  policyTableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  policyTableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  policyTableEntry: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  entropyLabel: {
    fontSize: 12,
    color: '#9c27b0',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  comparisonContainer: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  comparisonSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white',
  },
  comparisonBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  comparisonList: {
    marginLeft: 8,
  },
  comparisonItem: {
    fontSize: 14,
    marginBottom: 4,
    color: 'white',
    lineHeight: 20,
  },
  infoContainer: {
    marginBottom: 24,
  },
});

export default SACVisualization; 