import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { 
  Rect, 
  G, 
  Text as SvgText 
} from 'react-native-svg';
import { AlgorithmInfoCard } from './VisualizationHelpers';

// PPO için veri tipleri
interface PPOState {
  x: number;
  y: number;
}

interface PPOPolicyEntry {
  state: PPOState;
  actionProbabilities: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
  oldActionProbabilities: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
}

interface PPOValueEntry {
  state: PPOState;
  stateValue: number;
}

interface PPOTrajectoryStep {
  state: PPOState;
  action: string;
  reward: number;
  advantage: number;
  importanceRatio: number;
  clippedRatio: number;
  policyLoss: number;
}

interface PPOAgent {
  x: number;
  y: number;
  totalReward: number;
  currentTrajectory: PPOTrajectoryStep[];
  lastImportanceRatio: number;
  lastClippedRatio: number;
}

interface PPOEnvironment {
  gridSize: { width: number; height: number };
  agent: PPOAgent;
  goal: PPOState;
  obstacles: PPOState[];
  rewards: { [key: string]: number };
}

interface PPOVisualizationProps {
  title: string;
  animationSpeed?: number;
}

const PPOVisualization: React.FC<PPOVisualizationProps> = ({ 
  title, 
  animationSpeed = 1200 
}) => {
  const { width } = Dimensions.get('window');
  
  // PPO parametreleri
  const [learningRate, setLearningRate] = useState<number>(0.003); // Learning rate
  const [gamma, setGamma] = useState<number>(0.99); // Discount factor
  const [epsilon, setEpsilon] = useState<number>(0.2); // Clipping parameter
  const [epochs, setEpochs] = useState<number>(4); // Update epochs per batch
  const [episode, setEpisode] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Environment setup
  const GRID_WIDTH = 5;
  const GRID_HEIGHT = 5;
  
  const [environment, setEnvironment] = useState<PPOEnvironment>({
    gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
    agent: { 
      x: 0, y: 0, totalReward: 0, currentTrajectory: [], 
      lastImportanceRatio: 1.0, lastClippedRatio: 1.0 
    },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 3, y: 3 }
    ],
    rewards: {}
  });
  
  // Policy initialization
  const initializePolicy = (): PPOPolicyEntry[] => {
    const policy: PPOPolicyEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const uniformProb = { up: 0.25, down: 0.25, left: 0.25, right: 0.25 };
        policy.push({
          state: { x, y },
          actionProbabilities: { ...uniformProb },
          oldActionProbabilities: { ...uniformProb }
        });
      }
    }
    return policy;
  };
  
  // Value function initialization
  const initializeValueFunction = (): PPOValueEntry[] => {
    const valueFunction: PPOValueEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        valueFunction.push({
          state: { x, y },
          stateValue: Math.random() * 10 - 5 // Random initialization [-5, 5]
        });
      }
    }
    return valueFunction;
  };
  
  const [policy, setPolicy] = useState<PPOPolicyEntry[]>(initializePolicy());
  const [valueFunction, setValueFunction] = useState<PPOValueEntry[]>(initializeValueFunction());
  const [explanationText, setExplanationText] = useState<string>(
    'PPO (Proximal Policy Optimization) algoritması görselleştirmesi. Clipped objective ile güvenli policy update yapılır. Trust region yaklaşımı kullanır.'
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
  const getPolicyEntry = (state: PPOState): PPOPolicyEntry | undefined => {
    return policy.find(entry => entry.state.x === state.x && entry.state.y === state.y);
  };

  const getActionProbability = (state: PPOState, action: string, useOld: boolean = false): number => {
    const entry = getPolicyEntry(state);
    if (!entry) return 0.25;
    const probs = useOld ? entry.oldActionProbabilities : entry.actionProbabilities;
    return probs[action as keyof typeof probs] || 0;
  };

  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Render grid cell
  const renderGridCell = (x: number, y: number): React.ReactElement => {
    const isAgentHere = environment.agent.x === x && environment.agent.y === y;
    const isGoalHere = isGoal(x, y);
    const isObstacleHere = isObstacle(x, y);
    
    let cellContent = '';
    let backgroundColor = '#f9f9f9';
    let textColor = '#333';
    
    // Get policy entry for this cell
    const policyEntry = getPolicyEntry({ x, y });
    
    if (isObstacleHere) {
      cellContent = '🧱';
      backgroundColor = '#e74c3c';
    } else if (isGoalHere) {
      cellContent = '🎯';
      backgroundColor = '#27ae60';
    } else if (isAgentHere) {
      cellContent = '🤖';
      backgroundColor = '#3498db';
    } else {
      // Policy confidence as background color
      if (policyEntry) {
        const maxProb = Math.max(...Object.values(policyEntry.actionProbabilities));
        const opacity = maxProb * 0.8;
        backgroundColor = `rgba(33, 150, 243, ${opacity})`;
        
        const bestAction = Object.entries(policyEntry.actionProbabilities)
          .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        const actionArrow = {
          'up': '↑',
          'down': '↓', 
          'left': '←',
          'right': '→'
        }[bestAction] || '';
        
        cellContent = actionArrow;
      }
    }
    
    return (
      <View 
        key={`${x}-${y}`} 
        style={[
          styles.gridCell, 
          { backgroundColor }
        ]}
      >
        <Text style={[styles.gridCellText, { color: textColor, fontSize: 20 }]}>
          {cellContent}
        </Text>
        {!isAgentHere && !isGoalHere && !isObstacleHere && policyEntry && (
          <Text style={[styles.cellValue, { fontSize: 10, fontWeight: 'bold' }]}>
            {Math.max(...Object.values(policyEntry.actionProbabilities)).toFixed(2)}
          </Text>
        )}
      </View>
    );
  };

  // Value function helpers
  const getStateValue = (state: PPOState): number => {
    const entry = valueFunction.find(entry => entry.state.x === state.x && entry.state.y === state.y);
    return entry ? entry.stateValue : 0;
  };

  const getNextState = (currentState: PPOState, action: string): PPOState => {
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

  const sampleAction = (state: PPOState): string => {
    const entry = getPolicyEntry(state);
    if (!entry) return 'up';
    
    const actions = ['up', 'down', 'left', 'right'];
    const probabilities = [
      entry.actionProbabilities.up,
      entry.actionProbabilities.down,
      entry.actionProbabilities.left,
      entry.actionProbabilities.right
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

  // Calculate advantages using simplified TD(0)
  const calculateAdvantages = (trajectory: PPOTrajectoryStep[]): PPOTrajectoryStep[] => {
    const updatedTrajectory = [...trajectory];
    
    for (let t = 0; t < trajectory.length; t++) {
      const currentValue = getStateValue(trajectory[t].state);
      const nextValue = t < trajectory.length - 1 ? getStateValue(trajectory[t + 1].state) : 0;
      const tdError = trajectory[t].reward + gamma * nextValue - currentValue;
      
      updatedTrajectory[t].advantage = tdError; // Simplified advantage (can use GAE)
    }
    
    return updatedTrajectory;
  };

  // PPO update step
  const updatePPO = (trajectory: PPOTrajectoryStep[]): void => {
    // Store old policy
    setPolicy(prevPolicy => {
      const newPolicy = prevPolicy.map(entry => ({
        ...entry,
        oldActionProbabilities: { ...entry.actionProbabilities }
      }));
      return newPolicy;
    });
    
    // Multiple epochs update
    for (let epoch = 0; epoch < epochs; epoch++) {
      setCurrentEpoch(epoch + 1);
      
      trajectory.forEach(step => {
        // Calculate importance sampling ratio
        const newProb = getActionProbability(step.state, step.action, false);
        const oldProb = getActionProbability(step.state, step.action, true);
        const ratio = oldProb > 0 ? newProb / oldProb : 1.0;
        
        // Calculate clipped ratio
        const clippedRatio = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio));
        
        // PPO clipped objective
        const surrogate1 = ratio * step.advantage;
        const surrogate2 = clippedRatio * step.advantage;
        const policyLoss = -Math.min(surrogate1, surrogate2);
        
        // Update step data
        step.importanceRatio = ratio;
        step.clippedRatio = clippedRatio;
        step.policyLoss = policyLoss;
        
        // Update policy using gradient (simplified)
        updatePolicyGradient(step.state, step.action, step.advantage, ratio);
      });
    }
  };

  // Update policy using PPO gradient
  const updatePolicyGradient = (state: PPOState, action: string, advantage: number, ratio: number): void => {
    setPolicy(prevPolicy => {
      const newPolicy = [...prevPolicy];
      const entry = newPolicy.find(entry => entry.state.x === state.x && entry.state.y === state.y);
      
      if (entry) {
        const actions = ['up', 'down', 'left', 'right'] as const;
        const currentProb = entry.actionProbabilities[action as keyof typeof entry.actionProbabilities];
        
        // Clipped gradient update
        const clippedRatio = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio));
        const effectiveAdvantage = advantage * clippedRatio;
        
        actions.forEach(a => {
          if (a === action) {
            // Increase probability if advantage > 0 and within trust region
            const gradient = learningRate * effectiveAdvantage * currentProb * (1 - currentProb);
            entry.actionProbabilities[a] += gradient;
          } else {
            // Decrease other action probabilities
            const gradient = learningRate * effectiveAdvantage * currentProb * entry.actionProbabilities[a];
            entry.actionProbabilities[a] -= gradient;
          }
        });
        
        // Normalize probabilities
        const sum = Object.values(entry.actionProbabilities).reduce((s, p) => s + Math.max(0.01, p), 0);
        actions.forEach(a => {
          entry.actionProbabilities[a] = Math.max(0.01, entry.actionProbabilities[a]) / sum;
        });
      }
      
      return newPolicy;
    });
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

  // Episode execution with PPO
  const runPPOEpisode = async (): Promise<void> => {
    setEnvironment(prev => ({
      ...prev,
      agent: { 
        ...prev.agent, 
        x: 0, y: 0, 
        currentTrajectory: [], 
        lastImportanceRatio: 1.0, 
        lastClippedRatio: 1.0 
      }
    }));
    
    setStep(0);
    setCurrentEpoch(0);
    setExplanationText(`📚 PPO Episode ${episode + 1} başladı. Trajectory toplama aşaması...`);
    await wait(speed);
    
    // Trajectory collection phase
    let episodeFinished = false;
    let stepCount = 0;
    const maxSteps = 50;
    const trajectory: PPOTrajectoryStep[] = [];
    
    let currentState: PPOState = { x: 0, y: 0 };
    
    while (!episodeFinished && stepCount < maxSteps) {
      // Sample action from current policy
      const action = sampleAction(currentState);
      const actionProb = getActionProbability(currentState, action);
      
      setExplanationText(`🎯 Adım ${stepCount + 1}: ${getActionName(action)} seçildi (prob: ${actionProb.toFixed(3)})`);
      await wait(speed);
      
      // Execute action
      const nextState = getNextState(currentState, action);
      const reward = getReward(nextState.x, nextState.y);
      
      // Add to trajectory
      trajectory.push({
        state: currentState,
        action: action,
        reward: reward,
        advantage: 0, // Will be calculated later
        importanceRatio: 1.0,
        clippedRatio: 1.0,
        policyLoss: 0
      });
      
      // Move agent
      setEnvironment(prev => ({
        ...prev,
        agent: {
          ...prev.agent,
          x: nextState.x,
          y: nextState.y,
          totalReward: prev.agent.totalReward + reward
        }
      }));
      
      setExplanationText(`📍 Pozisyon: (${nextState.x}, ${nextState.y}) | Ödül: ${reward}`);
      await wait(speed);
      
      currentState = nextState;
      stepCount++;
      setStep(stepCount);
      
      if (isGoal(currentState.x, currentState.y)) {
        episodeFinished = true;
      }
    }
    
    // Calculate advantages
    const trajectoryWithAdvantages = calculateAdvantages(trajectory);
    
    setEnvironment(prev => ({
      ...prev,
      agent: { ...prev.agent, currentTrajectory: trajectoryWithAdvantages }
    }));
    
    setExplanationText('📊 Trajectory toplama tamamlandı. Advantage hesaplanıyor...');
    await wait(speed);
    
    // PPO update phase
    setExplanationText(`🔄 PPO Update: ${epochs} epoch boyunca policy güncelleniyor...`);
    await wait(speed);
    
    updatePPO(trajectoryWithAdvantages);
    
    // Calculate average importance ratio for display
    const avgImportanceRatio = trajectoryWithAdvantages.length > 0 
      ? trajectoryWithAdvantages.reduce((sum, step) => sum + step.importanceRatio, 0) / trajectoryWithAdvantages.length 
      : 1.0;
    
    const avgClippedRatio = trajectoryWithAdvantages.length > 0 
      ? trajectoryWithAdvantages.reduce((sum, step) => sum + step.clippedRatio, 0) / trajectoryWithAdvantages.length 
      : 1.0;
    
    setEnvironment(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        lastImportanceRatio: avgImportanceRatio,
        lastClippedRatio: avgClippedRatio
      }
    }));
    
    if (episodeFinished) {
      setExplanationText(`🎉 PPO Episode ${episode + 1} başarıyla tamamlandı! ${stepCount} adımda hedefe ulaştı.`);
    } else {
      setExplanationText(`⏰ PPO Episode ${episode + 1} maksimum adım sayısına ulaştı.`);
    }
    
    setEpisode(prev => prev + 1);
  };

  // Training controls
  const startPPOTraining = async (): Promise<void> => {
    setIsTraining(true);
    
    for (let i = 0; i < 3; i++) { // 3 episode (PPO daha yavaş)
      if (!isTraining) break;
      await runPPOEpisode();
      await wait(speed / 2);
    }
    
    setIsTraining(false);
    setExplanationText('🎓 PPO eğitimi tamamlandı! Clipped objective ile güvenli policy optimization yapıldı.');
  };

  const resetEnvironment = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: { 
        x: 0, y: 0, totalReward: 0, currentTrajectory: [], 
        lastImportanceRatio: 1.0, lastClippedRatio: 1.0 
      }
    }));
    setPolicy(initializePolicy());
    setValueFunction(initializeValueFunction());
    setEpisode(0);
    setStep(0);
    setCurrentEpoch(0);
    setExplanationText('🔄 PPO ortamı sıfırlandı. Policy uniform dağılıma döndü.');
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
            onPress={() => runPPOEpisode()}
            disabled={isTraining}
          >
            <Text style={styles.buttonText}>▶️ Tek Episode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={startPPOTraining}
            disabled={isTraining}
          >
            <Text style={[styles.buttonText, {color: 'white'}]}>
              {isTraining ? '🎓 PPO Eğitiliyor...' : '🚀 PPO Eğitimi'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Açıklama */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{explanationText}</Text>
        </View>
        
        {/* Grid Environment - Önce çevreyi göster */}
        <View style={styles.environmentContainer}>
          <Text style={styles.sectionTitle}>🎮 PPO (Trust Region) Ortamı</Text>
          <View style={[
            styles.grid,
            {
              width: Math.min(width - 24, 350),
              height: Math.min(width - 24, 350),
              alignSelf: 'center'
            }
          ]}>
            {Array.from({ length: GRID_HEIGHT }).map((_, y) => (
              <View key={`row-${y}`} style={styles.gridRow}>
                {Array.from({ length: GRID_WIDTH }).map((_, x) => renderGridCell(x, y))}
              </View>
            ))}
          </View>
          
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <Text style={styles.legendText}>🤖 Ajan (Agent)</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendText}>🎯 Hedef (+100 ödül)</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendText}>🧱 Engel (-50 ceza)</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendText}>🔵 Policy Confidence</Text>
            </View>
          </View>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>📊 Eğitim İstatistikleri</Text>
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
              <Text style={styles.statLabel}>🔄 Current Epoch:</Text>
              <Text style={styles.statValue}>{currentEpoch}/{epochs}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🏆 Toplam Ödül:</Text>
              <Text style={styles.statValue}>{environment.agent.totalReward}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📍 Pozisyon:</Text>
              <Text style={styles.statValue}>({environment.agent.x}, {environment.agent.y})</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📊 Importance Ratio:</Text>
              <Text style={styles.statValue}>{environment.agent.lastImportanceRatio.toFixed(3)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>✂️ Clipped Ratio:</Text>
              <Text style={styles.statValue}>{environment.agent.lastClippedRatio.toFixed(3)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🛤️ Trajectory Length:</Text>
              <Text style={styles.statValue}>{environment.agent.currentTrajectory.length}</Text>
            </View>
          </View>
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

        {/* PPO Parametreleri */}
        <View style={styles.paramsContainer}>
          <Text style={styles.sectionTitle}>PPO (Proximal Policy Optimization) Parametreleri</Text>
          
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
            <Text>Epsilon (ε) - Clipping Parameter: {epsilon.toFixed(2)}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0.1}
              maximumValue={0.5}
              step={0.01}
              value={epsilon}
              onValueChange={(value) => setEpsilon(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Gamma (γ) - İndirim Faktörü: {gamma.toFixed(2)}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={0.9}
              maximumValue={0.99}
              step={0.01}
              value={gamma}
              onValueChange={(value) => setGamma(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.paramControl}>
            <Text>Update Epochs - Güncelleme Epoch Sayısı: {epochs}</Text>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={epochs}
              onValueChange={(value) => setEpochs(value)}
              disabled={isTraining}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
            />
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>🎯 PPO:</Text> Clipped surrogate objective ile güvenli policy update yapar. 
              Trust region yaklaşımı sayesinde büyük policy değişikliklerini engeller. TRPO'nun basitleştirilmiş hali.
            </Text>
          </View>
        </View>

        {/* PPO Policy Display */}
        <View style={styles.policyTableContainer}>
          <Text style={styles.sectionTitle}>🎯 PPO Policy (İlk 6 Durum)</Text>
          <View style={styles.policyTableGrid}>
            {policy.slice(0, 6).map((entry, index) => ( 
              <View key={index} style={styles.policyTableEntry}>
                <View style={styles.stateInfo}>
                  <Text style={styles.stateInfoText}>Durum ({entry.state.x},{entry.state.y})</Text>
                </View>
                <View style={styles.actionsInfo}>
                  <View style={styles.actionRow}>
                    <Text>↑:</Text> 
                    <Text style={styles.actionValue}>
                      {(entry.actionProbabilities.up * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Text>↓:</Text> 
                    <Text style={styles.actionValue}>
                      {(entry.actionProbabilities.down * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Text>←:</Text> 
                    <Text style={styles.actionValue}>
                      {(entry.actionProbabilities.left * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Text>→:</Text> 
                    <Text style={styles.actionValue}>
                      {(entry.actionProbabilities.right * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        {/* Trajectory Display */}
        {environment.agent.currentTrajectory.length > 0 && (
          <View style={styles.trajectoryContainer}>
            <Text style={styles.trajectoryTitle}>🛤️ PPO Trajectory (Son Episode)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.trajectoryContent}>
                {environment.agent.currentTrajectory.slice(0, 6).map((step, index) => (
                  <View key={index} style={styles.trajectoryStep}>
                    <Text style={styles.trajectoryStepTitle}>Adım {index + 1}</Text>
                    <Text style={styles.trajectoryStepText}>Durum: ({step.state.x},{step.state.y})</Text>
                    <Text style={styles.trajectoryStepText}>Eylem: {step.action}</Text>
                    <Text style={styles.trajectoryStepText}>Ödül: {step.reward}</Text>
                    <Text style={styles.trajectoryStepText}>Advantage: {step.advantage.toFixed(2)}</Text>
                    <Text style={styles.trajectoryStepText}>Ratio: {step.importanceRatio.toFixed(3)}</Text>
                    <Text style={[
                      styles.trajectoryStepText, 
                      Math.abs(step.importanceRatio - step.clippedRatio) > 0.001 ? styles.clippedHighlight : null
                    ]}>
                      Clipped: {step.clippedRatio.toFixed(3)}
                      {Math.abs(step.importanceRatio - step.clippedRatio) > 0.001 ? " ✂️" : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Algorithm Comparison */}
        <View style={styles.algorithmComparisonContainer}>
          <Text style={styles.comparisonTitle}>🔄 PPO vs Diğer Policy Methods</Text>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonItemTitle}>🎯 PPO (Clipped)</Text>
              <View style={styles.comparisonList}>
                <Text style={styles.comparisonListItem}>• Clipped surrogate objective</Text>
                <Text style={styles.comparisonListItem}>• Trust region constraint</Text>
                <Text style={styles.comparisonListItem}>• Multiple epochs per batch</Text>
                <Text style={styles.comparisonListItem}>• Conservative updates</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonItemTitle}>🎭 Actor-Critic</Text>
              <View style={styles.comparisonList}>
                <Text style={styles.comparisonListItem}>• Online TD learning</Text>
                <Text style={styles.comparisonListItem}>• Step-by-step updates</Text>
                <Text style={styles.comparisonListItem}>• Lower variance</Text>
                <Text style={styles.comparisonListItem}>• Simple implementation</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonItemTitle}>🎲 REINFORCE</Text>
              <View style={styles.comparisonList}>
                <Text style={styles.comparisonListItem}>• Monte Carlo returns</Text>
                <Text style={styles.comparisonListItem}>• Episode-based learning</Text>
                <Text style={styles.comparisonListItem}>• High variance</Text>
                <Text style={styles.comparisonListItem}>• Unbiased estimates</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <AlgorithmInfoCard algorithmType="ppo" />
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
  infoSection: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
  environmentContainer: {
    marginVertical: 12,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  grid: {
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
    backgroundColor: '#fff',
    alignSelf: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 40,
  },
  gridCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    position: 'relative',
    minHeight: 40,
    minWidth: 40,
    maxWidth: 70,
  },
  gridCellText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cellValue: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 10,
    color: '#333',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
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
  paramControl: {
    marginVertical: 8,
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
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  policyTableContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  policyTableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  policyTableEntry: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    backgroundColor: 'white',
  },
  stateInfo: {
    backgroundColor: '#3498db',
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
  trajectoryContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#3742fa',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  trajectoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  trajectoryContent: {
    flexDirection: 'row',
    gap: 12,
  },
  trajectoryStep: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    width: 160,
  },
  trajectoryStepTitle: {
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  trajectoryStepText: {
    fontSize: 12,
    color: 'white',
    marginVertical: 2,
  },
  clippedHighlight: {
    color: '#ffeb3b',
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
});

export default PPOVisualization; 