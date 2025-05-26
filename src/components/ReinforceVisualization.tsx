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

// REINFORCE için veri tipleri
interface ReinforceState {
  x: number;
  y: number;
}

interface PolicyEntry {
  state: ReinforceState;
  actionProbabilities: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
}

interface TrajectoryStep {
  state: ReinforceState;
  action: string;
  reward: number;
  return: number;
}

interface ReinforceAgent {
  x: number;
  y: number;
  totalReward: number;
  currentTrajectory: TrajectoryStep[];
}

interface ReinforceEnvironment {
  gridSize: { width: number; height: number };
  agent: ReinforceAgent;
  goal: ReinforceState;
  obstacles: ReinforceState[];
  rewards: { [key: string]: number };
}

interface ReinforceVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// REINFORCE Visualization Component
const ReinforceVisualization: React.FC<ReinforceVisualizationProps> = ({ 
  title, 
  animationSpeed = 1000 
}) => {
  
  // REINFORCE parametreleri
  const [alpha, setAlpha] = useState<number>(0.01); // Learning rate (policy gradient için düşük)
  const [gamma, setGamma] = useState<number>(0.99); // Discount factor
  const [useBaseline, setUseBaseline] = useState<boolean>(true); // Baseline kullanımı
  const [episode, setEpisode] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Ekran genişliği ölçümü
  const { width } = Dimensions.get('window');
  
  // Environment setup
  const GRID_WIDTH = 5;
  const GRID_HEIGHT = 5;
  
  const [environment, setEnvironment] = useState<ReinforceEnvironment>({
    gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
    agent: { x: 0, y: 0, totalReward: 0, currentTrajectory: [] },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 3, y: 3 }
    ],
    rewards: {}
  });
  
  // Policy initialization (uniform distribution)
  const initializePolicy = (): PolicyEntry[] => {
    const policy: PolicyEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        policy.push({
          state: { x, y },
          actionProbabilities: { up: 0.25, down: 0.25, left: 0.25, right: 0.25 }
        });
      }
    }
    return policy;
  };
  
  const [policy, setPolicy] = useState<PolicyEntry[]>(initializePolicy());
  const [baseline, setBaseline] = useState<number>(0); // Value function baseline
  const [explanationText, setExplanationText] = useState<string>(
    'REINFORCE algoritması görselleştirmesi. Policy gradient ile ajan (🤖) stochastic policy öğrenerek hedefe (🎯) ulaşmayı öğrenecek.'
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
  
  // REINFORCE core functions
  const getPolicyEntry = (state: ReinforceState): PolicyEntry | undefined => {
    return policy.find(entry => entry.state.x === state.x && entry.state.y === state.y);
  };
  
  const getActionProbability = (state: ReinforceState, action: string): number => {
    const entry = getPolicyEntry(state);
    if (!entry) return 0.25; // Uniform default
    return entry.actionProbabilities[action as keyof typeof entry.actionProbabilities] || 0;
  };
  
  const sampleAction = (state: ReinforceState): string => {
    const entry = getPolicyEntry(state);
    if (!entry) return 'up'; // Default
    
    const actions = ['up', 'down', 'left', 'right'];
    const probabilities = [
      entry.actionProbabilities.up,
      entry.actionProbabilities.down,
      entry.actionProbabilities.left,
      entry.actionProbabilities.right
    ];
    
    // Cumulative distribution for sampling
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
    
    return actions[0]; // Fallback
  };
  
  const getNextState = (currentState: ReinforceState, action: string): ReinforceState => {
    let newX = currentState.x;
    let newY = currentState.y;
    
    switch (action) {
      case 'up': newY = Math.max(0, newY - 1); break;
      case 'down': newY = Math.min(GRID_HEIGHT - 1, newY + 1); break;
      case 'left': newX = Math.max(0, newX - 1); break;
      case 'right': newX = Math.min(GRID_WIDTH - 1, newX + 1); break;
    }
    
    // Geçersiz pozisyon ise aynı yerde kal
    if (!isValidPosition(newX, newY)) {
      return currentState;
    }
    
    return { x: newX, y: newY };
  };
  
  // Animation helper
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Calculate returns for trajectory
  const calculateReturns = (trajectory: TrajectoryStep[]): TrajectoryStep[] => {
    const updatedTrajectory = [...trajectory];
    let G = 0;
    
    // Backward pass to calculate returns
    for (let t = trajectory.length - 1; t >= 0; t--) {
      G = updatedTrajectory[t].reward + gamma * G;
      updatedTrajectory[t].return = G;
    }
    
    return updatedTrajectory;
  };
  
  // Update policy using REINFORCE
  const updatePolicy = (trajectory: TrajectoryStep[]): void => {
    setPolicy(prevPolicy => {
      const newPolicy = [...prevPolicy];
      
      // Calculate baseline if used
      let currentBaseline = baseline;
      if (useBaseline) {
        const avgReturn = trajectory.reduce((sum, step) => sum + step.return, 0) / trajectory.length;
        currentBaseline = 0.9 * baseline + 0.1 * avgReturn; // Moving average
        setBaseline(currentBaseline);
      }
      
      // Update policy for each step in trajectory
      trajectory.forEach((step, t) => {
        const advantage = useBaseline ? step.return - currentBaseline : step.return;
        
        const policyEntry = newPolicy.find(entry => 
          entry.state.x === step.state.x && entry.state.y === step.state.y
        );
        
        if (policyEntry) {
          const currentProb = getActionProbability(step.state, step.action);
          
          // Policy gradient update: ∇θ log π(a|s) * advantage
          const logGradient = 1 / currentProb; // Simplified gradient of log π
          const update = alpha * logGradient * advantage;
          
          // Update action probability
          const actions = ['up', 'down', 'left', 'right'] as const;
          actions.forEach(action => {
            if (action === step.action) {
              // Increase probability of taken action
              policyEntry.actionProbabilities[action] += update * currentProb * (1 - currentProb);
            } else {
              // Decrease probability of other actions
              policyEntry.actionProbabilities[action] -= update * currentProb * policyEntry.actionProbabilities[action];
            }
          });
          
          // Normalize probabilities to ensure they sum to 1
          const sum = Object.values(policyEntry.actionProbabilities).reduce((s, p) => s + Math.max(0.01, p), 0);
          actions.forEach(action => {
            policyEntry.actionProbabilities[action] = Math.max(0.01, policyEntry.actionProbabilities[action]) / sum;
          });
        }
      });
      
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
  
  // Episode çalıştır
  const runEpisode = async (): Promise<void> => {
    // Ajanı başlangıç pozisyonuna geri getir
    setEnvironment(prev => ({
      ...prev,
      agent: { ...prev.agent, x: 0, y: 0, currentTrajectory: [] }
    }));
    
    setStep(0);
    setExplanationText(`📚 REINFORCE Episode ${episode + 1} başladı. Policy gradient ile öğrenme...`);
    await wait(speed);
    
    let episodeFinished = false;
    let stepCount = 0;
    const maxSteps = 50;
    const trajectory: TrajectoryStep[] = [];
    
    let currentState: ReinforceState = { x: 0, y: 0 };
    
    while (!episodeFinished && stepCount < maxSteps) {
      // Policy'den action sample et
      const action = sampleAction(currentState);
      const actionProb = getActionProbability(currentState, action);
      
      setExplanationText(`🎲 Adım ${stepCount + 1}: ${getActionName(action)} seçildi (prob: ${actionProb.toFixed(3)})`);
      await wait(speed);
      
      // Action'ı gerçekleştir
      const nextState = getNextState(currentState, action);
      const reward = getReward(nextState.x, nextState.y);
      
      // Ajanı hareket ettir
      setEnvironment(prev => ({
        ...prev,
        agent: {
          ...prev.agent,
          x: nextState.x,
          y: nextState.y,
          totalReward: prev.agent.totalReward + reward
        }
      }));
      
      // Trajectory'ye ekle
      const trajectoryStep: TrajectoryStep = {
        state: currentState,
        action: action,
        reward: reward,
        return: 0 // Sonra hesaplanacak
      };
      trajectory.push(trajectoryStep);
      
      setExplanationText(`📍 Pozisyon: (${nextState.x}, ${nextState.y}) | Ödül: ${reward}`);
      await wait(speed);
      
      currentState = nextState;
      stepCount++;
      setStep(stepCount);
      
      // Hedef kontrolü
      if (isGoal(currentState.x, currentState.y)) {
        episodeFinished = true;
      }
    }
    
    // Returns hesapla
    const trajectoryWithReturns = calculateReturns(trajectory);
    
    setEnvironment(prev => ({
      ...prev,
      agent: { ...prev.agent, currentTrajectory: trajectoryWithReturns }
    }));
    
    setExplanationText('📊 Episode tamamlandı. Returns hesaplanıyor...');
    await wait(speed);
    
    // Policy güncelle
    updatePolicy(trajectoryWithReturns);
    
    if (episodeFinished) {
      setExplanationText(`🎉 REINFORCE Episode ${episode + 1} başarıyla tamamlandı! ${stepCount} adımda hedefe ulaştı.`);
    } else {
      setExplanationText(`⏰ REINFORCE Episode ${episode + 1} maksimum adım sayısına ulaştı.`);
    }
    
    setEpisode(prev => prev + 1);
    await wait(speed);
    
    setExplanationText('🔄 Policy gradients ile güncelleme yapıldı. Stochastic policy gelişti.');
  };
  
  // Training kontrolleri
  const startTraining = async (): Promise<void> => {
    setIsTraining(true);
    
    for (let i = 0; i < 5; i++) { // 5 episode çalıştır
      if (!isTraining) break;
      await runEpisode();
      await wait(speed / 2);
    }
    
    setIsTraining(false);
    setExplanationText('🎓 REINFORCE eğitimi tamamlandı! Policy gradients ile öğrenilen stochastic policy incelenebilir.');
  };
  
  const resetEnvironment = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: { x: 0, y: 0, totalReward: 0, currentTrajectory: [] }
    }));
    setPolicy(initializePolicy());
    setBaseline(0);
    setEpisode(0);
    setStep(0);
    setExplanationText('🔄 REINFORCE ortamı sıfırlandı. Policy uniform dağılıma döndü. Yeni policy gradient eğitime hazır.');
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
    
    let cellContent = '';
    
    // Policy distribution'ı background color olarak göster
    const policyEntry = getPolicyEntry({ x, y });
    
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
    } else if (policyEntry) {
      // Policy confidence gösterimi
      const maxProb = Math.max(...Object.values(policyEntry.actionProbabilities));
      const opacity = maxProb * 0.7; // Policy confidence
      
      // En yüksek probability'ye sahip action'ı göster
      const bestAction = Object.entries(policyEntry.actionProbabilities)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      const actionArrow = {
        'up': '↑',
        'down': '↓', 
        'left': '←',
        'right': '→'
      }[bestAction] || '';
      
      cellStyle.backgroundColor = `rgba(155, 89, 182, ${opacity})`;
      
      return (
        <View key={`${x}-${y}`} style={cellStyle}>
          <Text style={styles.qValueText}>{maxProb.toFixed(2)}</Text>
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
          onPress={startTraining}
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
          minimumValue={300}
          maximumValue={2000}
          step={100}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isTraining}
        />
      </View>
      
      {/* REINFORCE Parametreleri */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>REINFORCE Parametreleri</Text>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Alpha (α) - Öğrenme Oranı: {alpha.toFixed(3)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.001}
            maximumValue={0.1}
            step={0.001}
            value={alpha}
            onValueChange={(value) => setAlpha(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Gamma (γ) - İndirim Faktörü: {gamma.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.9}
            maximumValue={0.99}
            step={0.01}
            value={gamma}
            onValueChange={(value) => setGamma(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
        </View>
        
        <View style={styles.baselineContainer}>
          <Text style={styles.paramLabel}>Baseline Kullan (Variance Reduction)</Text>
          <Switch
            value={useBaseline}
            onValueChange={(value) => setUseBaseline(value)}
            disabled={isTraining}
            thumbColor={useBaseline ? '#4CAF50' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#8bc34a' }}
          />
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{fontWeight: 'bold'}}>🎯 Policy Gradient:</Text> REINFORCE stochastic policy öğrenir. 
            Her state'te action probabilities vardır. Baseline variance'ı azaltır ve öğrenmeyi hızlandırır.
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
            <Text style={styles.statLabel}>📊 Baseline:</Text>
            <Text style={styles.statValue}>{baseline.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🎲 Trajectory Length:</Text>
            <Text style={styles.statValue}>{environment.agent.currentTrajectory.length}</Text>
          </View>
        </View>
      </View>
      
      {/* Açıklama */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Grid Environment */}
      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>🎮 REINFORCE (Policy Gradient) Ortamı</Text>
        
        <View style={styles.gridContainer}>
          {Array.from({ length: GRID_HEIGHT }).map((_, y) => (
            <View key={y} style={styles.gridRow}>
              {Array.from({ length: GRID_WIDTH }).map((_, x) => renderGridCell(x, y))}
            </View>
          ))}
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>🤖 Ajan (Agent)</Text>
            <Text style={styles.legendItem}>🎯 Hedef (+100)</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>🧱 Engel (-50)</Text>
            <Text style={styles.legendItem}>⬆️ En iyi eylem</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>🟣 Policy Confidence</Text>
            <Text style={styles.legendItem}>🎲 Stochastic actions</Text>
          </View>
        </View>
      </View>
      
      {/* Policy Distribution Özeti */}
      <View style={styles.policyTableContainer}>
        <Text style={styles.sectionTitle}>📊 Policy Distribution (İlk 6 Durum)</Text>
        
        <View style={styles.policyTableGrid}>
          {policy.slice(0, 6).map((entry, index) => ( 
            <View key={index} style={styles.policyTableEntry}>
              <Text style={styles.stateInfo}>
                Durum ({entry.state.x},{entry.state.y})
              </Text>
              
              <View style={styles.actionsContainer}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↑:</Text> 
                  <Text style={styles.actionValue}>
                    {(entry.actionProbabilities.up * 100).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↓:</Text> 
                  <Text style={styles.actionValue}>
                    {(entry.actionProbabilities.down * 100).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>←:</Text> 
                  <Text style={styles.actionValue}>
                    {(entry.actionProbabilities.left * 100).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>→:</Text> 
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
          <Text style={styles.sectionTitle}>🛤️ Son Episode Trajectory</Text>
          <View style={styles.trajectoryGrid}>
            {environment.agent.currentTrajectory.slice(0, 8).map((step, index) => (
              <View key={index} style={styles.trajectoryItem}>
                <Text style={styles.trajectoryHeader}>Adım {index + 1}</Text>
                <Text style={styles.trajectoryText}>Durum: ({step.state.x},{step.state.y})</Text>
                <Text style={styles.trajectoryText}>Eylem: {getActionName(step.action)}</Text>
                <Text style={styles.trajectoryText}>Ödül: {step.reward}</Text>
                <Text style={styles.trajectoryText}>Return: {step.return.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Algoritma Karşılaştırması */}
      <View style={styles.comparisonContainer}>
        <Text style={styles.sectionTitle}>🔄 REINFORCE vs Value-Based Methods</Text>
        
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>🎯 REINFORCE (Policy-Based)</Text>
          <View style={styles.comparisonList}>
            <Text style={styles.comparisonItem}>• Doğrudan policy öğrenir</Text>
            <Text style={styles.comparisonItem}>• Stochastic action selection</Text>
            <Text style={styles.comparisonItem}>• Monte Carlo method</Text>
            <Text style={styles.comparisonItem}>• ∇θ J(θ) = E[Σt Gt ∇θ log π(at|st,θ)]</Text>
          </View>
        </View>
        
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>⚡ Q-Learning/SARSA (Value-Based)</Text>
          <View style={styles.comparisonList}>
            <Text style={styles.comparisonItem}>• Value function öğrenir</Text>
            <Text style={styles.comparisonItem}>• Deterministic/ε-greedy policy</Text>
            <Text style={styles.comparisonItem}>• Temporal Difference method</Text>
            <Text style={styles.comparisonItem}>• Q(s,a) ← Q(s,a) + α[r + γQ(s',a') - Q(s,a)]</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="reinforce" />
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
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 8,
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
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'transparent',
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
  qValueText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionArrow: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 16,
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
  trajectoryContainer: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  trajectoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trajectoryItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  trajectoryHeader: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  trajectoryText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  comparisonContainer: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  comparisonBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  comparisonTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  comparisonList: {
    marginLeft: 8,
  },
  comparisonItem: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  infoContainer: {
    marginBottom: 24,
  },
});

export default ReinforceVisualization; 