import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { AlgorithmInfoCard } from './VisualizationHelpers';

// Actor-Critic için veri tipleri
interface ACState {
  x: number;
  y: number;
}

interface ActorEntry {
  state: ACState;
  actionProbabilities: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
}

interface CriticEntry {
  state: ACState;
  stateValue: number;
}

interface ACAgent {
  x: number;
  y: number;
  totalReward: number;
  lastAction: string | null;
  lastTDError: number;
  lastAdvantage: number;
}

interface ACEnvironment {
  gridSize: { width: number; height: number };
  agent: ACAgent;
  goal: ACState;
  obstacles: ACState[];
  rewards: { [key: string]: number };
}

interface ActorCriticVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Actor-Critic Visualization Component
const ActorCriticVisualization: React.FC<ActorCriticVisualizationProps> = ({ 
  title, 
  animationSpeed = 800 
}) => {
  
  // Actor-Critic parametreleri
  const [alphaActor, setAlphaActor] = useState<number>(0.01); // Actor learning rate
  const [alphaCritic, setAlphaCritic] = useState<number>(0.05); // Critic learning rate
  const [gamma, setGamma] = useState<number>(0.95); // Discount factor
  const [episode, setEpisode] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Ekran genişliği ölçümü
  const { width } = Dimensions.get('window');
  
  // Environment setup
  const GRID_WIDTH = 5;
  const GRID_HEIGHT = 5;
  
  const [environment, setEnvironment] = useState<ACEnvironment>({
    gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
    agent: { x: 0, y: 0, totalReward: 0, lastAction: null, lastTDError: 0, lastAdvantage: 0 },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 3, y: 3 }
    ],
    rewards: {}
  });
  
  // Actor network (policy) initialization
  const initializeActor = (): ActorEntry[] => {
    const actor: ActorEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        actor.push({
          state: { x, y },
          actionProbabilities: { up: 0.25, down: 0.25, left: 0.25, right: 0.25 }
        });
      }
    }
    return actor;
  };
  
  // Critic network (value function) initialization
  const initializeCritic = (): CriticEntry[] => {
    const critic: CriticEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        critic.push({
          state: { x, y },
          stateValue: Math.random() * 2 - 1 // Random initialization [-1, 1]
        });
      }
    }
    return critic;
  };
  
  const [actor, setActor] = useState<ActorEntry[]>(initializeActor());
  const [critic, setCritic] = useState<CriticEntry[]>(initializeCritic());
  const [explanationText, setExplanationText] = useState<string>(
    'Actor-Critic algoritması görselleştirmesi. Actor (🎭) policy öğrenir, Critic (🎯) value function öğrenir ve Actor\'a guidance sağlar.'
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
    if (isGoal(x, y)) return 100; // Hedefe ulaşma ödülü
    if (isObstacle(x, y)) return -50; // Engel cezası
    return -1; // Her adım için küçük maliyet
  };
  
  // Actor functions
  const getActorEntry = (state: ACState): ActorEntry | undefined => {
    return actor.find(entry => entry.state.x === state.x && entry.state.y === state.y);
  };
  
  const getActionProbability = (state: ACState, action: string): number => {
    const entry = getActorEntry(state);
    if (!entry) return 0.25;
    return entry.actionProbabilities[action as keyof typeof entry.actionProbabilities] || 0;
  };
  
  const sampleAction = (state: ACState): string => {
    const entry = getActorEntry(state);
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
  
  // Critic functions
  const getCriticEntry = (state: ACState): CriticEntry | undefined => {
    return critic.find(entry => entry.state.x === state.x && entry.state.y === state.y);
  };
  
  const getStateValue = (state: ACState): number => {
    const entry = getCriticEntry(state);
    return entry ? entry.stateValue : 0;
  };
  
  const updateStateValue = (state: ACState, newValue: number): void => {
    setCritic(prevCritic => {
      const newCritic = [...prevCritic];
      const entry = newCritic.find(entry => entry.state.x === state.x && entry.state.y === state.y);
      if (entry) {
        entry.stateValue = newValue;
      }
      return newCritic;
    });
  };
  
  const getNextState = (currentState: ACState, action: string): ACState => {
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
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Actor-Critic step
  const runACStep = async (): Promise<boolean> => {
    const currentState: ACState = { x: environment.agent.x, y: environment.agent.y };
    
    if (isGoal(currentState.x, currentState.y)) {
      return true; // Episode finished
    }
    
    // Actor: Sample action from policy
    const action = sampleAction(currentState);
    const actionProb = getActionProbability(currentState, action);
    
    setExplanationText(`🎭 Actor: ${getActionName(action)} seçildi (prob: ${actionProb.toFixed(3)})`);
    await wait(speed);
    
    // Execute action
    const nextState = getNextState(currentState, action);
    const reward = getReward(nextState.x, nextState.y);
    
    // Critic: Get state values
    const currentValue = getStateValue(currentState);
    const nextValue = isGoal(nextState.x, nextState.y) ? 0 : getStateValue(nextState);
    
    // Calculate TD error
    const tdTarget = reward + gamma * nextValue;
    const tdError = tdTarget - currentValue;
    
    setExplanationText(`🎯 Critic: V(s)=${currentValue.toFixed(2)}, TD error=${tdError.toFixed(2)}`);
    await wait(speed);
    
    // Update Critic (value function)
    const newValue = currentValue + alphaCritic * tdError;
    updateStateValue(currentState, newValue);
    
    // Update Actor (policy) using advantage
    const advantage = tdError; // In AC, TD error = advantage
    updateActor(currentState, action, advantage);
    
    // Move agent
    setEnvironment(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        x: nextState.x,
        y: nextState.y,
        totalReward: prev.agent.totalReward + reward,
        lastAction: action,
        lastTDError: tdError,
        lastAdvantage: advantage
      }
    }));
    
    setExplanationText(`📍 Pozisyon: (${nextState.x}, ${nextState.y}) | Ödül: ${reward} | Advantage: ${advantage.toFixed(2)}`);
    await wait(speed);
    
    return isGoal(nextState.x, nextState.y);
  };
  
  // Update Actor using policy gradient
  const updateActor = (state: ACState, action: string, advantage: number): void => {
    setActor(prevActor => {
      const newActor = [...prevActor];
      const entry = newActor.find(entry => entry.state.x === state.x && entry.state.y === state.y);
      
      if (entry) {
        const currentProb = getActionProbability(state, action);
        const actions = ['up', 'down', 'left', 'right'] as const;
        
        // Policy gradient update
        actions.forEach(a => {
          if (a === action) {
            // Increase probability of taken action if advantage > 0
            entry.actionProbabilities[a] += alphaActor * advantage * currentProb * (1 - currentProb);
          } else {
            // Decrease probability of other actions if advantage > 0
            entry.actionProbabilities[a] -= alphaActor * advantage * currentProb * entry.actionProbabilities[a];
          }
        });
        
        // Normalize probabilities
        const sum = Object.values(entry.actionProbabilities).reduce((s, p) => s + Math.max(0.01, p), 0);
        actions.forEach(a => {
          entry.actionProbabilities[a] = Math.max(0.01, entry.actionProbabilities[a]) / sum;
        });
      }
      
      return newActor;
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
  
  // Episode execution
  const runEpisode = async (): Promise<void> => {
    setEnvironment(prev => ({
      ...prev,
      agent: { ...prev.agent, x: 0, y: 0, totalReward: 0, lastAction: null, lastTDError: 0, lastAdvantage: 0 }
    }));
    
    setStep(0);
    setExplanationText(`📚 Actor-Critic Episode ${episode + 1} başladı. Actor ve Critic birlikte öğreniyor...`);
    await wait(speed);
    
    let episodeFinished = false;
    let stepCount = 0;
    const maxSteps = 50;
    
    while (!episodeFinished && stepCount < maxSteps) {
      episodeFinished = await runACStep();
      stepCount++;
      setStep(stepCount);
    }
    
    if (episodeFinished) {
      setExplanationText(`🎉 Episode ${episode + 1} başarıyla tamamlandı! ${stepCount} adımda hedefe ulaştı.`);
    } else {
      setExplanationText(`⏰ Episode ${episode + 1} maksimum adım sayısına ulaştı.`);
    }
    
    setEpisode(prev => prev + 1);
  };
  
  // Training controls
  const startTraining = async (): Promise<void> => {
    setIsTraining(true);
    
    for (let i = 0; i < 5; i++) {
      if (!isTraining) break;
      await runEpisode();
      await wait(speed / 2);
    }
    
    setIsTraining(false);
    setExplanationText('🎓 Actor-Critic eğitimi tamamlandı! Actor ve Critic networks optimize edildi.');
  };
  
  const resetEnvironment = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: { x: 0, y: 0, totalReward: 0, lastAction: null, lastTDError: 0, lastAdvantage: 0 }
    }));
    setActor(initializeActor());
    setCritic(initializeCritic());
    setEpisode(0);
    setStep(0);
    setExplanationText('🔄 Actor-Critic ortamı sıfırlandı. Actor ve Critic networks yeniden başlatıldı.');
  };
  
  const runSingleEpisode = (): void => {
    if (!isTraining) {
      runEpisode();
    }
  };
  
  // Render grid cell
  const renderGridCell = (x: number, y: number): React.ReactElement => {
    const isAgentHere = environment.agent.x === x && environment.agent.y === y;
    const isGoalHere = isGoal(x, y);
    const isObstacleHere = isObstacle(x, y);
    
    const CELL_SIZE = width * 0.14; // Adaptive cell size based on screen width
    
    let cellContent = '';
    let backgroundColor = 'white';
    let borderColor = '#ddd';
    
    if (isObstacleHere) {
      backgroundColor = '#e74c3c';
      cellContent = '🧱';
    } else if (isGoalHere) {
      backgroundColor = '#2ecc71';
      cellContent = '🎯';
    } else if (isAgentHere) {
      backgroundColor = '#3498db';
      cellContent = '🤖';
    } else {
      // Value function'ı background color olarak göster
      const stateValue = getStateValue({ x, y });
      const normalizedValue = Math.max(-1, Math.min(1, stateValue / 50)); // Normalize to [-1, 1]
      const opacity = Math.abs(normalizedValue) * 0.7;
      backgroundColor = normalizedValue > 0 
        ? `rgba(76, 175, 80, ${opacity})` // Yeşil - pozitif value
        : `rgba(244, 67, 54, ${opacity})`; // Kırmızı - negatif value
    }
    
    // Actor'dan en iyi action'ı al
    const actorEntry = getActorEntry({ x, y });
    const bestAction = actorEntry ? 
      Object.entries(actorEntry.actionProbabilities).reduce((a, b) => a[1] > b[1] ? a : b)[0] : '';
    
    const actionArrow = {
      'up': '↑',
      'down': '↓', 
      'left': '←',
      'right': '→'
    }[bestAction] || '';
    
    return (
      <View
        key={`${x}-${y}`}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {cellContent ? (
          <Text style={{ fontSize: 18 }}>{cellContent}</Text>
        ) : (
          <View>
            <Text style={{ fontSize: 10, color: '#333' }}>
              {getStateValue({ x, y }).toFixed(1)}
            </Text>
            <Text style={{ fontSize: 14 }}>{actionArrow}</Text>
          </View>
        )}
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
          <Text style={styles.buttonText}>▶️ Tek Episode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={startTraining}
          disabled={isTraining}
        >
          <Text style={styles.buttonText}>
            {isTraining ? '🎓 Eğitiliyor...' : '🚀 Actor-Critic Eğitimi'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Hız kontrolü */}
      <View style={styles.speedControl}>
        <Text>Hız: {speed}ms</Text>
        <Slider
          style={{width: '100%', height: 40}}
          minimumValue={200}
          maximumValue={1500}
          step={100}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          disabled={isTraining}
          minimumTrackTintColor="#3498db"
          maximumTrackTintColor="#bdc3c7"
        />
      </View>
      
      {/* Actor-Critic Parametreleri */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>Actor-Critic Parametreleri</Text>
        
        <View style={styles.paramControl}>
          <Text>Alpha Actor (α_π) - Actor Öğrenme Oranı: {alphaActor.toFixed(3)}</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={0.001}
            maximumValue={0.1}
            step={0.001}
            value={alphaActor}
            onValueChange={(value) => setAlphaActor(value)}
            disabled={isTraining}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#bdc3c7"
          />
        </View>
        
        <View style={styles.paramControl}>
          <Text>Alpha Critic (α_v) - Critic Öğrenme Oranı: {alphaCritic.toFixed(3)}</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={0.01}
            maximumValue={0.2}
            step={0.01}
            value={alphaCritic}
            onValueChange={(value) => setAlphaCritic(value)}
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
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            <Text style={styles.infoTextBold}>🎭🎯 Actor-Critic:</Text> Actor policy öğrenir (🎭), Critic value function öğrenir (🎯). 
            Critic'in verdiği TD error Actor'ı yönlendirir. Hybrid approach!
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
            <Text style={styles.statLabel}>🏆 Toplam Ödül:</Text>
            <Text style={styles.statValue}>{environment.agent.totalReward}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>📍 Pozisyon:</Text>
            <Text style={styles.statValue}>({environment.agent.x}, {environment.agent.y})</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🎯 TD Error:</Text>
            <Text style={styles.statValue}>{environment.agent.lastTDError.toFixed(3)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>⚡ Advantage:</Text>
            <Text style={styles.statValue}>{environment.agent.lastAdvantage.toFixed(3)}</Text>
          </View>
        </View>
      </View>
      
      {/* Açıklama */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Grid Environment */}
      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>🎮 Actor-Critic (Hybrid) Ortamı</Text>
        <View style={styles.gridContainer}>
          {Array.from({ length: GRID_HEIGHT }, (_, y) => (
            <View key={`row-${y}`} style={styles.gridRow}>
              {Array.from({ length: GRID_WIDTH }, (_, x) => renderGridCell(x, y))}
            </View>
          ))}
        </View>
        
        <View style={styles.legendContainer}>
          <Text style={styles.legendItem}>🤖 Ajan (Agent)</Text>
          <Text style={styles.legendItem}>🎯 Hedef (+100 ödül)</Text>
          <Text style={styles.legendItem}>🧱 Engel (-50 ceza)</Text>
          <Text style={styles.legendItem}>🟢 Pozitif State Value</Text>
          <Text style={styles.legendItem}>🔴 Negatif State Value</Text>
          <Text style={styles.legendItem}>⬆️ En iyi eylem</Text>
        </View>
      </View>
      
      {/* Algoritma Karşılaştırması */}
      <View style={styles.comparisonContainer}>
        <Text style={styles.sectionTitle}>🔄 Actor-Critic vs Diğer Methods</Text>
        <View style={styles.comparisonMethod}>
          <Text style={styles.methodTitle}>🎭 Actor-Critic (Hybrid)</Text>
          <Text style={styles.methodDetail}>• Policy + Value learning</Text>
          <Text style={styles.methodDetail}>• TD error guidance</Text>
          <Text style={styles.methodDetail}>• Lower variance than REINFORCE</Text>
          <Text style={styles.methodDetail}>• Online learning</Text>
        </View>
        
        <View style={styles.comparisonMethod}>
          <Text style={styles.methodTitle}>🎯 REINFORCE (Policy-Only)</Text>
          <Text style={styles.methodDetail}>• Policy gradient only</Text>
          <Text style={styles.methodDetail}>• Monte Carlo returns</Text>
          <Text style={styles.methodDetail}>• High variance</Text>
          <Text style={styles.methodDetail}>• Episode-based learning</Text>
        </View>
        
        <View style={styles.comparisonMethod}>
          <Text style={styles.methodTitle}>⚡ Q-Learning (Value-Only)</Text>
          <Text style={styles.methodDetail}>• Value function only</Text>
          <Text style={styles.methodDetail}>• Discrete actions</Text>
          <Text style={styles.methodDetail}>• ε-greedy policy</Text>
          <Text style={styles.methodDetail}>• Step-based learning</Text>
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <AlgorithmInfoCard algorithmType="actor-critic" />
      </View>
    </ScrollView>
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
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
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
  statsContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginRight: 4,
  },
  statValue: {
    fontSize: 12,
    color: '#333',
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
  gridContainer: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  gridRow: {
    flexDirection: 'row',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    fontSize: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  comparisonContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  comparisonMethod: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  methodDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: '#555',
  },
  infoSection: {
    marginVertical: 12,
  },
});

export default ActorCriticVisualization; 