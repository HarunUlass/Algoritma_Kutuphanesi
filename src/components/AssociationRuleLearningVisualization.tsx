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

interface AssociationRuleLearningVisualizationProps {
  title: string;
  animationSpeed?: number;
}

interface Item {
  id: string;
  name: string;
  color: string;
}

interface Transaction {
  id: number;
  items: Item[];
}

interface ItemSet {
  items: Item[];
  support: number;
  selected?: boolean;
}

interface Rule {
  antecedent: Item[];
  consequent: Item[];
  support: number;
  confidence: number;
  lift: number;
}

const AssociationRuleLearningVisualization: React.FC<AssociationRuleLearningVisualizationProps> = ({
  title,
  animationSpeed = 1000
}) => {
  // Visualization parameters
  const [minSupport, setMinSupport] = useState<number>(0.3);
  const [minConfidence, setMinConfidence] = useState<number>(0.6);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [explanationText, setExplanationText] = useState<string>(
    'Birliktelik Kuralları Öğrenimi (Association Rule Learning) gösterilmektedir. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.'
  );
  const [logs, setLogs] = useState<string[]>([]);
  
  // Data for algorithm
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [frequentItemsets, setFrequentItemsets] = useState<ItemSet[]>([]);
  const [candidateItemsets, setCandidateItemsets] = useState<ItemSet[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);

  // Initialize data
  useEffect(() => {
    generateData();
  }, []);
  
  // Generate sample market basket data
  const generateData = () => {
    // Define items
    const sampleItems: Item[] = [
      { id: 'A', name: 'Ekmek', color: '#3498db' },
      { id: 'B', name: 'Süt', color: '#e74c3c' },
      { id: 'C', name: 'Peynir', color: '#2ecc71' },
      { id: 'D', name: 'Yumurta', color: '#f39c12' },
      { id: 'E', name: 'Çay', color: '#9b59b6' },
      { id: 'F', name: 'Kahve', color: '#1abc9c' },
      { id: 'G', name: 'Şeker', color: '#34495e' },
    ];
    
    setItems(sampleItems);
    
    // Generate sample transactions
    const sampleTransactions: Transaction[] = [
      { id: 1, items: [sampleItems[0], sampleItems[1], sampleItems[2]] }, // Ekmek, Süt, Peynir
      { id: 2, items: [sampleItems[0], sampleItems[1], sampleItems[3]] }, // Ekmek, Süt, Yumurta
      { id: 3, items: [sampleItems[1], sampleItems[2], sampleItems[3], sampleItems[4]] }, // Süt, Peynir, Yumurta, Çay
      { id: 4, items: [sampleItems[0], sampleItems[2]] }, // Ekmek, Peynir
      { id: 5, items: [sampleItems[1], sampleItems[2], sampleItems[4]] }, // Süt, Peynir, Çay
      { id: 6, items: [sampleItems[0], sampleItems[1], sampleItems[2], sampleItems[4]] }, // Ekmek, Süt, Peynir, Çay
      { id: 7, items: [sampleItems[3], sampleItems[5], sampleItems[6]] }, // Yumurta, Kahve, Şeker
      { id: 8, items: [sampleItems[4], sampleItems[5], sampleItems[6]] }, // Çay, Kahve, Şeker
      { id: 9, items: [sampleItems[1], sampleItems[3], sampleItems[5], sampleItems[6]] }, // Süt, Yumurta, Kahve, Şeker
      { id: 10, items: [sampleItems[0], sampleItems[3], sampleItems[6]] }, // Ekmek, Yumurta, Şeker
    ];
    
    setTransactions(sampleTransactions);
    
    // Reset algorithm state
    setFrequentItemsets([]);
    setCandidateItemsets([]);
    setRules([]);
    setCurrentStep(0);
    setLogs([]);
    
    setExplanationText('Birliktelik Kuralları Öğrenimi (Association Rule Learning) gösterilmektedir. "Algoritmayı Çalıştır" butonuna basarak adımları görebilirsiniz.');
  };
  
  // Calculate support for an itemset (percentage of transactions containing all items)
  const calculateSupport = (itemset: Item[], allTransactions: Transaction[]): number => {
    if (itemset.length === 0) return 0;
    
    const containingTransactions = allTransactions.filter(transaction => {
      return itemset.every(item => 
        transaction.items.some(transItem => transItem.id === item.id)
      );
    });
    
    return containingTransactions.length / allTransactions.length;
  };
  
  // Run Apriori algorithm
  const runAprioriAlgorithm = async () => {
    if (isRunning) return;
    
    try {
      setIsRunning(true);
      setCurrentStep(0);
      setLogs([]);
      setFrequentItemsets([]);
      setCandidateItemsets([]);
      setRules([]);
      
      // Step 1: Generate 1-itemsets (C1)
      const stepLog = "Adım 1: Tekli öğe kümeleri (C1) oluşturuluyor";
      setExplanationText(stepLog);
      setLogs(prev => [...prev, stepLog]);
      
      const c1: ItemSet[] = items.map(item => ({
        items: [item],
        support: calculateSupport([item], transactions)
      }));
      
      setCandidateItemsets(c1);
      await wait(speed);
      setCurrentStep(1);
      
      // Step 2: Find frequent 1-itemsets (L1)
      const stepLog2 = `Adım 2: Minimum destek değerinden (${minSupport}) yüksek olan tekli öğe kümeleri (L1) bulunuyor`;
      setExplanationText(stepLog2);
      setLogs(prev => [...prev, stepLog2]);
      
      const l1 = c1.filter(itemset => itemset.support >= minSupport);
      setFrequentItemsets(l1);
      await wait(speed);
      setCurrentStep(2);
      
      // Step 3 onwards: Generate candidate k-itemsets and find frequent k-itemsets
      let k = 2;
      let lk_1 = [...l1];
      
      while (lk_1.length > 0) {
        // Generate candidate k-itemsets (Ck)
        const stepLog3 = `Adım ${k+1}: ${k}-öğe aday kümeleri (C${k}) oluşturuluyor`;
        setExplanationText(stepLog3);
        setLogs(prev => [...prev, stepLog3]);
        
        const ck = generateCandidateItemsets(lk_1, k);
        setCandidateItemsets(ck);
        await wait(speed);
        setCurrentStep(k + 1);
        
        // Find frequent k-itemsets (Lk)
        const stepLog4 = `Adım ${k+2}: Minimum destek değerinden (${minSupport}) yüksek olan ${k}-öğe kümeleri (L${k}) bulunuyor`;
        setExplanationText(stepLog4);
        setLogs(prev => [...prev, stepLog4]);
        
        const lk = ck.filter(itemset => itemset.support >= minSupport);
        setFrequentItemsets(prev => [...prev, ...lk]);
        
        if (lk.length === 0) break;
        
        lk_1 = lk;
        k++;
        await wait(speed);
        setCurrentStep(k + 2);
      }
      
      // Generate association rules from frequent itemsets
      const stepLog5 = 'Adım ' + setCurrentStep(prevStep => prevStep + 1) + ': Sık öğe kümelerinden birliktelik kuralları oluşturuluyor';
      setExplanationText(stepLog5);
      setLogs(prev => [...prev, stepLog5]);
      
      const generatedRules = generateAssociationRules([...frequentItemsets]);
      setRules(generatedRules);
      
      await wait(speed);
      setCurrentStep(prevStep => prevStep + 1);
      
      // Final step
      setExplanationText(`Birliktelik Kuralları Öğrenimi tamamlandı! ${frequentItemsets.length} sık öğe kümesi ve ${generatedRules.length} kural bulundu.`);
      setLogs(prev => [...prev, 'Birliktelik Kuralları Öğrenimi algoritması başarıyla tamamlandı!']);
      
    } catch (error) {
      console.error('Apriori algoritması çalıştırılırken hata oluştu:', error);
      setExplanationText('Algoritma çalıştırılırken bir hata oluştu.');
      setLogs(prev => [...prev, 'HATA: Algoritma çalıştırılırken bir sorun oluştu.']);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Generate candidate k-itemsets from frequent (k-1)-itemsets
  const generateCandidateItemsets = (lk_1: ItemSet[], k: number): ItemSet[] => {
    const candidates: ItemSet[] = [];
    
    // Generate candidates by joining Lk-1 with itself
    for (let i = 0; i < lk_1.length; i++) {
      for (let j = i + 1; j < lk_1.length; j++) {
        // For k=2, just combine items
        if (k === 2) {
          const newItems = [...lk_1[i].items, ...lk_1[j].items];
          // Check for duplicates
          const uniqueItems = [...new Map(newItems.map(item => [item.id, item])).values()];
          
          if (uniqueItems.length === k) {
            const support = calculateSupport(uniqueItems, transactions);
            candidates.push({ items: uniqueItems, support });
          }
        } else {
          // For k>2, check if first k-2 items are the same
          const itemsI = lk_1[i].items;
          const itemsJ = lk_1[j].items;
          
          // Check if first k-2 items are the same
          let canJoin = true;
          for (let l = 0; l < k - 2; l++) {
            if (itemsI[l].id !== itemsJ[l].id) {
              canJoin = false;
              break;
            }
          }
          
          if (canJoin && itemsI[k-2].id !== itemsJ[k-2].id) {
            // Join items
            const newItems = [...itemsI, itemsJ[k-2]];
            const support = calculateSupport(newItems, transactions);
            candidates.push({ items: newItems, support });
          }
        }
      }
    }
    
    return candidates;
  };
  
  // Generate association rules from frequent itemsets
  const generateAssociationRules = (frequentSets: ItemSet[]): Rule[] => {
    const rules: Rule[] = [];
    
    // Consider only itemsets with 2 or more items
    const validItemsets = frequentSets.filter(itemset => itemset.items.length >= 2);
    
    for (const itemset of validItemsets) {
      const allItems = [...itemset.items];
      
      // Generate all non-empty subsets except the full set
      const subsets = generateSubsets(allItems);
      
      for (const subset of subsets) {
        if (subset.length === 0 || subset.length === allItems.length) continue;
        
        const antecedent = subset;
        const consequent = allItems.filter(
          item => !antecedent.some(antItem => antItem.id === item.id)
        );
        
        if (consequent.length === 0) continue;
        
        // Calculate confidence
        const supportAntecedent = calculateSupport(antecedent, transactions);
        const supportRule = itemset.support;
        const confidence = supportRule / supportAntecedent;
        
        // Calculate lift
        const supportConsequent = calculateSupport(consequent, transactions);
        const lift = confidence / supportConsequent;
        
        if (confidence >= minConfidence) {
          rules.push({
            antecedent,
            consequent,
            support: supportRule,
            confidence,
            lift
          });
        }
      }
    }
    
    // Sort rules by confidence (descending)
    return rules.sort((a, b) => b.confidence - a.confidence);
  };
  
  // Generate all non-empty subsets of items
  const generateSubsets = (items: Item[]): Item[][] => {
    const subsets: Item[][] = [];
    const n = items.length;
    
    // Generate 2^n-1 non-empty subsets
    for (let i = 1; i < (1 << n); i++) {
      const subset: Item[] = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          subset.push(items[j]);
        }
      }
      subsets.push(subset);
    }
    
    return subsets;
  };
  
  // Helper function to wait
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Format item names for display
  const formatItems = (items: Item[]): string => {
    return items.map(item => item.name).join(', ');
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
          onPress={runAprioriAlgorithm}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isRunning ? '⏳ Çalışıyor...' : '▶️ Algoritmayı Çalıştır'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Parameters sliders */}
      <View style={styles.paramRow}>
        <Text style={styles.paramLabel}>Minimum Destek: {minSupport.toFixed(2)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.1}
          maximumValue={0.9}
          step={0.05}
          value={minSupport}
          onValueChange={(value) => setMinSupport(value)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#000000"
          disabled={isRunning}
        />
      </View>
      
      <View style={styles.paramRow}>
        <Text style={styles.paramLabel}>Minimum Güven: {minConfidence.toFixed(2)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.1}
          maximumValue={0.9}
          step={0.05}
          value={minConfidence}
          onValueChange={(value) => setMinConfidence(value)}
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
      
      {/* Data Display */}
      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>İşlemler (Transactions)</Text>
        <View style={styles.transactionsContainer}>
          {transactions.map((transaction) => (
            <View key={`transaction-${transaction.id}`} style={styles.transaction}>
              <Text style={styles.transactionId}>İşlem {transaction.id}:</Text>
              <View style={styles.itemsRow}>
                {transaction.items.map((item) => (
                  <View
                    key={`transaction-${transaction.id}-${item.id}`}
                    style={[styles.itemBadge, { backgroundColor: item.color + '33' }]}
                  >
                    <Text style={[styles.itemText, { color: item.color }]}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {/* Frequent Itemsets */}
      {frequentItemsets.length > 0 && (
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Sık Öğe Kümeleri (Frequent Itemsets)</Text>
          <View style={styles.itemsetsContainer}>
            {frequentItemsets.map((itemset, index) => (
              <View key={`itemset-${index}`} style={styles.itemset}>
                <View style={styles.itemsRow}>
                  {itemset.items.map((item) => (
                    <View
                      key={`itemset-${index}-${item.id}`}
                      style={[styles.itemBadge, { backgroundColor: item.color + '33' }]}
                    >
                      <Text style={[styles.itemText, { color: item.color }]}>{item.name}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.supportText}>Destek: {itemset.support.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Association Rules */}
      {rules.length > 0 && (
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Birliktelik Kuralları (Association Rules)</Text>
          <View style={styles.rulesContainer}>
            {rules.map((rule, index) => (
              <View key={`rule-${index}`} style={styles.rule}>
                <View style={styles.ruleContent}>
                  <View style={styles.itemsRow}>
                    {rule.antecedent.map((item) => (
                      <View
                        key={`rule-${index}-ant-${item.id}`}
                        style={[styles.itemBadge, { backgroundColor: item.color + '33' }]}
                      >
                        <Text style={[styles.itemText, { color: item.color }]}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.ruleArrow}>→</Text>
                  <View style={styles.itemsRow}>
                    {rule.consequent.map((item) => (
                      <View
                        key={`rule-${index}-cons-${item.id}`}
                        style={[styles.itemBadge, { backgroundColor: item.color + '33' }]}
                      >
                        <Text style={[styles.itemText, { color: item.color }]}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.ruleMetrics}>
                  <Text style={styles.metricText}>Destek: {rule.support.toFixed(2)}</Text>
                  <Text style={styles.metricText}>Güven: {rule.confidence.toFixed(2)}</Text>
                  <Text style={styles.metricText}>Kaldıraç: {rule.lift.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
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
        <AlgorithmInfoCard algorithmType="association-rules" />
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
  dataSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  transactionsContainer: {
    gap: 12,
  },
  transaction: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  transactionId: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemsetsContainer: {
    gap: 12,
  },
  itemset: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  supportText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  rulesContainer: {
    gap: 12,
  },
  rule: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  ruleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  ruleMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  metricText: {
    fontSize: 12,
    color: '#666',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
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

export default AssociationRuleLearningVisualization; 