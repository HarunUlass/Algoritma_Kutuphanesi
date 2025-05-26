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
import { AlgorithmInfoCard } from './VisualizationHelpers';

// SARSA için veri tipleri
interface SarsaState {
  x: number;
  y: number;
}

interface SarsaTableEntry {
  state: SarsaState;
  actions: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
}

interface SarsaAgent {
  x: number;
  y: number;
  totalReward: number;
  currentAction: string | null;
  nextAction: string | null;
}

interface SarsaEnvironment {
  gridSize: { width: number; height: number };
  agent: SarsaAgent;
  goal: SarsaState;
  obstacles: SarsaState[];
  rewards: { [key: string]: number };
}

interface SarsaVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// SARSA Visualization Component
const SarsaVisualization: React.FC<SarsaVisualizationProps> = ({ 
  title, 
  animationSpeed = 900 
}) => {
  
  // SARSA parametreleri
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
  
  const [environment, setEnvironment] = useState<SarsaEnvironment>({
    gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
    agent: { x: 0, y: 0, totalReward: 0, currentAction: null, nextAction: null },
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 3, y: 3 }
    ],
    rewards: {}
  });
  
  // SARSA Table initialization
  const initializeSarsaTable = (): SarsaTableEntry[] => {
    const sarsaTable: SarsaTableEntry[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        sarsaTable.push({
          state: { x, y },
          actions: { up: 0, down: 0, left: 0, right: 0 }
        });
      }
    }
    return sarsaTable;
  };
  
  const [sarsaTable, setSarsaTable] = useState<SarsaTableEntry[]>(initializeSarsaTable());
  const [explanationText, setExplanationText] = useState<string>(
    'SARSA algoritması görselleştirmesi. On-policy temporal difference öğrenme ile ajan (🤖) hedefe (🎯) ulaşmayı öğrenecek.'
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
  
  // SARSA core functions
  const getSarsaValue = (state: SarsaState, action: string): number => {
    const entry = sarsaTable.find(entry => entry.state.x === state.x && entry.state.y === state.y);
    if (!entry) return 0;
    return entry.actions[action as keyof typeof entry.actions] || 0;
  };
  
  const updateSarsaValue = (state: SarsaState, action: string, value: number): void => {
    setSarsaTable(prevTable => {
      const newTable = [...prevTable];
      const entry = newTable.find(entry => entry.state.x === state.x && entry.state.y === state.y);
      if (entry) {
        entry.actions[action as keyof typeof entry.actions] = value;
      }
      return newTable;
    });
  };
  
  const getBestAction = (state: SarsaState): string => {
    const actions = ['up', 'down', 'left', 'right'];
    let bestAction = actions[0];
    let bestValue = getSarsaValue(state, bestAction);
    
    for (const action of actions) {
      const value = getSarsaValue(state, action);
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }
    return bestAction;
  };
  
  const chooseAction = (state: SarsaState): string => {
    // Epsilon-greedy policy (SARSA kullandığı politika)
    if (Math.random() < epsilon) {
      // Exploration: rastgele eylem seç
      const actions = ['up', 'down', 'left', 'right'];
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      // Exploitation: en iyi eylemi seç
      return getBestAction(state);
    }
  };
  
  const getNextState = (currentState: SarsaState, action: string): SarsaState => {
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
  
  // SARSA algorithm execution
  const runSarsaStep = async (currentAction: string, nextAction: string): Promise<{ finished: boolean; newNextAction: string }> => {
    const currentState: SarsaState = { x: environment.agent.x, y: environment.agent.y };
    
    // Hedef ulaşıldı mı kontrol et
    if (isGoal(currentState.x, currentState.y)) {
      return { finished: true, newNextAction: '' };
    }
    
    // Mevcut eylemi gerçekleştir
    const explorationMode = Math.random() < epsilon ? 'Keşfetme' : 'Sömürü';
    setExplanationText(`🎯 Adım ${step}: ${getActionName(currentAction)} gerçekleştiriliyor (${explorationMode})`);
    await wait(speed);
    
    // Bir sonraki durum
    const nextState = getNextState(currentState, currentAction);
    const reward = getReward(nextState.x, nextState.y);
    
    // Ajanı hareket ettir
    setEnvironment(prev => ({
      ...prev,
      agent: {
        ...prev.agent,
        x: nextState.x,
        y: nextState.y,
        totalReward: prev.agent.totalReward + reward,
        currentAction: currentAction,
        nextAction: nextAction
      }
    }));
    
    // Yeni durumda yeni bir eylem seç (SARSA'nın temel özelliği)
    const newNextAction = isGoal(nextState.x, nextState.y) ? '' : chooseAction(nextState);
    
    // SARSA değerini güncelle (Bellman denklemi - on-policy)
    const currentSarsaValue = getSarsaValue(currentState, currentAction);
    const nextSarsaValue = isGoal(nextState.x, nextState.y) ? 0 : getSarsaValue(nextState, nextAction);
    const newSarsaValue = currentSarsaValue + alpha * (reward + gamma * nextSarsaValue - currentSarsaValue);
    
    updateSarsaValue(currentState, currentAction, newSarsaValue);
    
    setExplanationText(
      `📊 SARSA güncellendi: Q(${currentState.x},${currentState.y},${currentAction}) = ${newSarsaValue.toFixed(2)} | Ödül: ${reward}`
    );
    
    setStep(prev => prev + 1);
    await wait(speed);
    
    return { 
      finished: isGoal(nextState.x, nextState.y), 
      newNextAction: newNextAction 
    };
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
      agent: { ...prev.agent, x: 0, y: 0, currentAction: null, nextAction: null }
    }));
    
    setStep(0);
    setExplanationText(`📚 SARSA Episode ${episode + 1} başladı. Ajan başlangıç pozisyonunda (0,0).`);
    await wait(speed);
    
    // İlk eylemi seç (SARSA'da gerekli)
    const initialState: SarsaState = { x: 0, y: 0 };
    let currentAction = chooseAction(initialState);
    setExplanationText(`🎲 İlk eylem seçildi: ${getActionName(currentAction)} (on-policy)`);
    await wait(speed);
    
    let episodeFinished = false;
    let stepCount = 0;
    const maxSteps = 50; // Sonsuz döngüyü önlemek için
    
    while (!episodeFinished && stepCount < maxSteps) {
      // Bir sonraki eylemi seç (SARSA için gerekli)
      const currentState: SarsaState = { x: environment.agent.x, y: environment.agent.y };
      const nextAction = chooseAction(currentState);
      
      // SARSA adımını çalıştır
      const result = await runSarsaStep(currentAction, nextAction);
      episodeFinished = result.finished;
      currentAction = result.newNextAction; // Bir sonraki iterasyon için
      
      stepCount++;
    }
    
    if (episodeFinished) {
      setExplanationText(`🎉 SARSA Episode ${episode + 1} başarıyla tamamlandı! Ajan ${stepCount} adımda hedefe ulaştı.`);
    } else {
      setExplanationText(`⏰ SARSA Episode ${episode + 1} maksimum adım sayısına (${maxSteps}) ulaştı.`);
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
    setExplanationText('🎓 SARSA eğitimi tamamlandı! Öğrenilen on-policy değerleri ve politikayı inceleyebilirsiniz.');
  };
  
  const resetEnvironment = (): void => {
    setEnvironment(prev => ({
      ...prev,
      agent: { x: 0, y: 0, totalReward: 0, currentAction: null, nextAction: null }
    }));
    setSarsaTable(initializeSarsaTable());
    setEpisode(0);
    setStep(0);
    setEpsilon(0.3);
    setExplanationText('🔄 SARSA ortamı sıfırlandı. Tablo temizlendi. Yeni on-policy eğitime hazır.');
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
      // SARSA değerlerini background color olarak göster
      const sarsaEntry = sarsaTable.find(entry => entry.state.x === x && entry.state.y === y);
      const maxSarsa = sarsaEntry ? Math.max(...Object.values(sarsaEntry.actions)) : 0;
      const opacity = Math.min(Math.abs(maxSarsa) / 50, 0.8); // Normalize
      
      if (maxSarsa > 0) {
        // Yeşil - pozitif değer
        cellStyle = {...cellStyle, backgroundColor: `rgba(46, 204, 113, ${opacity})`};
      } else if (maxSarsa < 0) {
        // Kırmızı - negatif değer
        cellStyle = {...cellStyle, backgroundColor: `rgba(231, 76, 60, ${opacity})`};
      }
      
      // En iyi eylemi ok ile göster
      if (sarsaEntry) {
        const bestAction = getBestAction({ x, y });
        const actionArrow = {
          'up': '↑',
          'down': '↓', 
          'left': '←',
          'right': '→'
        }[bestAction] || '';
        
        return (
          <View key={`${x}-${y}`} style={cellStyle}>
            <Text style={styles.qValueText}>{maxSarsa.toFixed(1)}</Text>
            <Text style={styles.actionArrow}>{actionArrow}</Text>
          </View>
        );
      }
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
          maximumValue={1500}
          step={100}
          value={speed}
          onValueChange={(value) => setSpeed(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isTraining}
        />
      </View>
      
      {/* SARSA Parametreleri */}
      <View style={styles.paramsContainer}>
        <Text style={styles.sectionTitle}>SARSA Parametreleri</Text>
        
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
        
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{fontWeight: 'bold'}}>💡 SARSA vs Q-Learning:</Text> SARSA on-policy algoritmasıdır - gerçek seçilen eylemi kullanır. 
            Q-Learning off-policy'dir - maksimum Q değeri kullanır.
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
            <Text style={styles.statLabel}>🎯 Mevcut Eylem:</Text>
            <Text style={styles.statValue}>
              {environment.agent.currentAction ? getActionName(environment.agent.currentAction) : 'Yok'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>🔄 Epsilon:</Text>
            <Text style={styles.statValue}>{epsilon.toFixed(3)}</Text>
          </View>
        </View>
      </View>
      
      {/* Açıklama */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Grid Environment */}
      <View style={styles.environmentContainer}>
        <Text style={styles.sectionTitle}>🎮 SARSA (On-Policy TD) Ortamı</Text>
        
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
            <Text style={styles.legendItem}>🟢 Pozitif SARSA değer</Text>
            <Text style={styles.legendItem}>🔴 Negatif SARSA değer</Text>
          </View>
        </View>
      </View>
      
      {/* SARSA Table Özeti */}
      <View style={styles.tableDisplayContainer}>
        <Text style={styles.sectionTitle}>📊 SARSA Table Özeti (İlk 6 Durum)</Text>
        
        <View style={styles.tableGrid}>
          {sarsaTable.slice(0, 6).map((entry, index) => ( 
            <View key={index} style={styles.tableEntry}>
              <Text style={styles.stateInfo}>
                Durum ({entry.state.x},{entry.state.y})
              </Text>
              
              <View style={styles.actionsContainer}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↑:</Text> 
                  <Text style={[styles.actionValue, entry.actions.up > 0 ? styles.positiveValue : styles.negativeValue]}>
                    {entry.actions.up.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>↓:</Text> 
                  <Text style={[styles.actionValue, entry.actions.down > 0 ? styles.positiveValue : styles.negativeValue]}>
                    {entry.actions.down.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>←:</Text> 
                  <Text style={[styles.actionValue, entry.actions.left > 0 ? styles.positiveValue : styles.negativeValue]}>
                    {entry.actions.left.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>→:</Text> 
                  <Text style={[styles.actionValue, entry.actions.right > 0 ? styles.positiveValue : styles.negativeValue]}>
                    {entry.actions.right.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {/* Algoritma Karşılaştırması */}
      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonSectionTitle}>🔄 SARSA vs Q-Learning</Text>
        
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>🎯 SARSA (On-Policy)</Text>
          <View style={styles.comparisonList}>
            <Text style={styles.comparisonItem}>• Gerçek seçilen eylemi kullanır</Text>
            <Text style={styles.comparisonItem}>• Mevcut politikayı takip eder</Text>
            <Text style={styles.comparisonItem}>• Daha güvenli öğrenme</Text>
            <Text style={styles.comparisonItem}>• Q(s,a) ← Q(s,a) + α[r + γ·Q(s',a') - Q(s,a)]</Text>
          </View>
        </View>
        
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>⚡ Q-Learning (Off-Policy)</Text>
          <View style={styles.comparisonList}>
            <Text style={styles.comparisonItem}>• Maksimum Q değerini kullanır</Text>
            <Text style={styles.comparisonItem}>• Herhangi bir politikadan öğrenir</Text>
            <Text style={styles.comparisonItem}>• Daha agresif öğrenme</Text>
            <Text style={styles.comparisonItem}>• Q(s,a) ← Q(s,a) + α[r + γ·max(Q(s',a')) - Q(s,a)]</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <AlgorithmInfoCard algorithmType="sarsa" />
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
  tableDisplayContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableEntry: {
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

export default SarsaVisualization; 