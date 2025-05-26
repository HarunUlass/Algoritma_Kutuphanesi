import React, { useState, useEffect } from 'react';
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

// Q-Learning için veri tipleri
interface QState {
  x: number;
  y: number;
}

interface QTableEntry {
  state: QState;
  actions: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
}

interface QAgent {
  x: number;
  y: number;
  totalReward: number;
}

interface QEnvironment {
  gridSize: { width: number; height: number };
  agent: QAgent;
  goal: QState;
  obstacles: QState[];
  rewards: { [key: string]: number };
}

interface QLearningVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Q-Learning Visualization Component
const QLearningVisualization: React.FC<QLearningVisualizationProps> = ({ 
  title, 
  animationSpeed = 800 
}) => {
  
  // Q-Learning parametreleri
  const [alpha, setAlpha] = useState<number>(0.1); // Learning rate
  const [gamma, setGamma] = useState<number>(0.9); // Discount factor
  const [epsilon, setEpsilon] = useState<number>(0.3); // Exploration rate
  const [episode, setEpisode] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  
  // Ekran genişliği ölçümü
  const { width } = Dimensions.get('window');
  
  // Environment setup
  const GRID_WIDTH = 5;
  const GRID_HEIGHT = 5;
  
  const [environment, setEnvironment] = useState<QEnvironment>({
    gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
    agent: { x: 0, y: 0, totalReward: 0 },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 3, y: 3 }
    ],
    rewards: {}
  });
  
  // Q-Table initialization
  const initializeQTable = (): QTableEntry[] => {
    const qTable: QTableEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        qTable.push({
          state: { x, y },
          actions: { up: 0, down: 0, left: 0, right: 0 }
        });
      }
    }
    return qTable;
  };
  
  const [qTable, setQTable] = useState<QTableEntry[]>(initializeQTable());
  const [explanationText, setExplanationText] = useState<string>(
    'Q-Learning algoritması görselleştirmesi. Ajan (🤖) engelleri (🧱) geçerek hedefe (🎯) ulaşmayı öğrenecek.'
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
  
  // Q-Learning core functions
  const getQValue = (state: QState, action: string): number => {
    const entry = qTable.find(entry => entry.state.x === state.x && entry.state.y === state.y);
    if (!entry) return 0;
    return entry.actions[action as keyof typeof entry.actions] || 0;
  };
  
  const updateQValue = (state: QState, action: string, value: number): void => {
    setQTable(prevTable => {
      const newTable = [...prevTable];
      const entry = newTable.find(entry => entry.state.x === state.x && entry.state.y === state.y);
      if (entry) {
        entry.actions[action as keyof typeof entry.actions] = value;
      }
      return newTable;
    });
  };
  
  const getMaxQValue = (state: QState): number => {
    const actions = ['up', 'down', 'left', 'right'];
    return Math.max(...actions.map(action => getQValue(state, action)));
  };
  
  const getBestAction = (state: QState): string => {
    const actions = ['up', 'down', 'left', 'right'];
    let bestAction = actions[0];
    let bestValue = getQValue(state, bestAction);
    
    for (const action of actions) {
      const value = getQValue(state, action);
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }
    return bestAction;
  };
  
  const chooseAction = (state: QState): string => {
    // Epsilon-greedy policy
    if (Math.random() < epsilon) {
      // Exploration: rastgele eylem seç
      const actions = ['up', 'down', 'left', 'right'];
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      // Exploitation: en iyi eylemi seç
      return getBestAction(state);
    }
  };
  
  const getNextState = (currentState: QState, action: string): QState => {
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
  
  // Q-Learning algorithm execution
  const runQLearningStep = async (): Promise<boolean> => {
    const currentState: QState = { x: environment.agent.x, y: environment.agent.y };
    
    // Hedef ulaşıldı mı kontrol et
    if (isGoal(currentState.x, currentState.y)) {
      return true; // Episode bitti
    }
    
    // Eylem seç
    const action = chooseAction(currentState);
    const explorationMode = Math.random() < epsilon ? 'Keşfetme' : 'Sömürü';
    setExplanationText(`Adım ${step}: ${getActionName(action)} seçildi (${explorationMode} - ε=${epsilon.toFixed(2)})`);
    await wait(speed);
    
    // Bir sonraki durum
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
    
    // Q-value güncelle (Bellman denklemi)
    const currentQValue = getQValue(currentState, action);
    const maxNextQValue = getMaxQValue(nextState);
    const newQValue = currentQValue + alpha * (reward + gamma * maxNextQValue - currentQValue);
    
    updateQValue(currentState, action, newQValue);
    
    setExplanationText(
      `Q-değer güncellendi: Q(${currentState.x},${currentState.y},${action}) = ${newQValue.toFixed(2)} | Ödül: ${reward}`
    );
    
    setStep(prev => prev + 1);
    await wait(speed);
    
    return isGoal(nextState.x, nextState.y);
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
      agent: { ...prev.agent, x: 0, y: 0 }
    }));
    
    setStep(0);
    setExplanationText(`📚 Episode ${episode + 1} başladı. Ajan başlangıç pozisyonunda (0,0).`);
    await wait(speed);
    
    let episodeFinished = false;
    let stepCount = 0;
    const maxSteps = 50; // Sonsuz döngüyü önlemek için
    
    while (!episodeFinished && stepCount < maxSteps) {
      episodeFinished = await runQLearningStep();
      stepCount++;
    }
    
    if (episodeFinished) {
      setExplanationText(`🎉 Episode ${episode + 1} başarıyla tamamlandı! Ajan ${stepCount} adımda hedefe ulaştı.`);
    } else {
      setExplanationText(`⏰ Episode ${episode + 1} maksimum adım sayısına (${maxSteps}) ulaştı.`);
    }
    
    setEpisode(prev => prev + 1);
    
    // Epsilon decay (zamanla exploration azalt)
    setEpsilon(prev => Math.max(0.01, prev * 0.99));
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
    setExplanationText('🎓 Eğitim tamamlandı! Q-tablosundaki değerleri ve öğrenilen politikayı inceleyebilirsiniz.');
  };
  
  const resetEnvironment = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: { x: 0, y: 0, totalReward: 0 }
    }));
    setQTable(initializeQTable());
    setEpisode(0);
    setStep(0);
    setEpsilon(0.3);
    setExplanationText('🔄 Ortam sıfırlandı. Q-tablosu temizlendi. Yeni eğitime hazır.');
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
    
    // Q-değerlerini background color olarak göster
    const qEntry = qTable.find(entry => entry.state.x === x && entry.state.y === y);
    const maxQ = qEntry ? Math.max(...Object.values(qEntry.actions)) : 0;
    const opacity = Math.min(Math.abs(maxQ) / 50, 0.8); // Normalize
    const backgroundColor = maxQ > 0 
      ? `rgba(76, 175, 80, ${opacity})` // Yeşil - pozitif değer
      : maxQ < 0 
        ? `rgba(244, 67, 54, ${opacity})` // Kırmızı - negatif değer
        : 'rgba(200, 200, 200, 0.1)'; // Gri - sıfır değer
    
    // En iyi eylemi göster
    const bestAction = qEntry ? getBestAction({ x, y }) : '';
    const actionArrow = {
      'up': '↑',
      'down': '↓', 
      'left': '←',
      'right': '→'
    }[bestAction] || '';
    
    // Apply the appropriate style based on cell type
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
    } else {
      // For empty cells, apply the Q-value background
      cellStyle.backgroundColor = backgroundColor;
    }
    
    if (!isAgentHere && !isGoalHere && !isObstacleHere) {
      return (
        <View key={`${x}-${y}`} style={cellStyle}>
          <Text style={styles.qValueText}>{maxQ !== 0 ? maxQ.toFixed(1) : ''}</Text>
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
          <Text style={styles.buttonText}>▶️ Tek Episode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={startTraining}
          disabled={isTraining}
        >
          <Text style={styles.buttonText}>
            {isTraining ? '🎓 Eğitiliyor...' : '🚀 Eğitim Başlat'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.speedContainer}>
        <Text style={styles.sliderLabel}>Hız: {speed}ms</Text>
        <Slider
          style={styles.slider}
          minimumValue={200}
          maximumValue={1500}
          step={100}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isTraining}
        />
      </View>
      
      {/* Q-Learning Parametreleri */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>Q-Learning Parametreleri</Text>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Alpha (α) - Öğrenme Oranı: {alpha.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.01}
            maximumValue={1}
            step={0.01}
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
            minimumValue={0.1}
            maximumValue={1}
            step={0.1}
            value={gamma}
            onValueChange={(value) => setGamma(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
        </View>
        
        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Epsilon (ε) - Keşfetme Oranı: {epsilon.toFixed(3)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.01}
            maximumValue={1}
            step={0.01}
            value={epsilon}
            onValueChange={(value) => setEpsilon(value)}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            disabled={isTraining}
          />
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
      </View>
      
      {/* Açıklama */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Grid Environment */}
      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>🎮 Q-Learning Ortamı</Text>
        
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
            <Text style={styles.legendItem}>🟢 Pozitif Q-değer</Text>
            <Text style={styles.legendItem}>🔴 Negatif Q-değer</Text>
          </View>
        </View>
      </View>
      
      {/* Q-Table Özeti */}
      <View style={styles.qTableContainer}>
        <Text style={styles.sectionTitle}>📊 Q-Table Özeti (İlk 6 Durum)</Text>
        
        <View style={styles.qTableGrid}>
          {qTable.slice(0, 6).map((entry, index) => ( 
            <View key={index} style={styles.qTableEntry}>
              <Text style={styles.stateInfo}>
                Durum ({entry.state.x},{entry.state.y})
              </Text>
              
              <View style={styles.actionsContainer}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↑:</Text> 
                  <Text style={[
                    styles.actionValue,
                    entry.actions.up > 0 ? styles.positive : 
                    entry.actions.up < 0 ? styles.negative : null
                  ]}>
                    {entry.actions.up.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↓:</Text> 
                  <Text style={[
                    styles.actionValue,
                    entry.actions.down > 0 ? styles.positive : 
                    entry.actions.down < 0 ? styles.negative : null
                  ]}>
                    {entry.actions.down.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>←:</Text> 
                  <Text style={[
                    styles.actionValue,
                    entry.actions.left > 0 ? styles.positive : 
                    entry.actions.left < 0 ? styles.negative : null
                  ]}>
                    {entry.actions.left.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>→:</Text> 
                  <Text style={[
                    styles.actionValue,
                    entry.actions.right > 0 ? styles.positive : 
                    entry.actions.right < 0 ? styles.negative : null
                  ]}>
                    {entry.actions.right.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="q-learning" />
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
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
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
  qTableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
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
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#F44336',
  },
  infoContainer: {
    marginBottom: 24,
  },
});

export default QLearningVisualization; 