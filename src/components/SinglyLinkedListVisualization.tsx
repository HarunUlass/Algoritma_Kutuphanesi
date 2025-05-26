import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Button,
} from 'react-native';

// Constants
const DEFAULT_ANIMATION_SPEED = 500;
const DEFAULT_ARRAY_SIZE = 5;
const BAR_WIDTH = 30;
const BAR_MARGIN = 5;
const MAX_BAR_HEIGHT = 200;

// Props interface
interface SinglyListVisualizationProps {
  title: string;
  animationSpeed?: number;
  customArray?: number[];
}

// Random array generator function
const generateRandomArray = (length: number, maxValue: number): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * maxValue) + 10);
};

// Singly Linked List Visualization Component
const SinglyLinkedListVisualization: React.FC<SinglyListVisualizationProps> = ({
  title,
  animationSpeed = DEFAULT_ANIMATION_SPEED,
  customArray,
}) => {
  // States
  const [array, setArray] = useState<number[]>(() => {
    return customArray || generateRandomArray(DEFAULT_ARRAY_SIZE, 100);
  });
  const [sorting, setSorting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [explanationText, setExplanationText] = useState<string>('Tek Yönlü Bağlı Liste Görselleştirmesi: İşlem seçin ve "Başlat" düğmesine tıklayın.');
  const [selectedOperation, setSelectedOperation] = useState<string>('demo');
  const [inputValue, setInputValue] = useState<string>('');
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Animation values
  const barRefs = useRef<Animated.Value[]>([]);
  const barColors = useRef<Animated.Value[]>([]);

  // Colors for visualization
  const normalColor = 'rgb(108, 92, 231)';   // Purple
  const comparingColor = 'rgb(255, 165, 0)';  // Orange
  const swappingColor = 'rgb(255, 0, 0)';     // Red
  const sortedColor = 'rgb(46, 213, 115)';    // Green
  const headColor = 'rgb(52, 152, 219)';      // Blue (for head pointer)

  // Initialize animation values when array changes
  useEffect(() => {
    resetAnimationValues();
  }, [array]);

  // Reset animation values
  const resetAnimationValues = () => {
    barRefs.current = [];
    barColors.current = [];
    
    try {
      array.forEach(() => {
        barRefs.current.push(new Animated.Value(0));
        barColors.current.push(new Animated.Value(0));
      });
      
      barColors.current.forEach((color) => {
        if (color) color.setValue(0);
      });
    } catch (error) {
      console.error('Error initializing animation values:', error);
    }
  };

  // Reset array
  const resetArray = () => {
    if (sorting) return;
    setArray(generateRandomArray(DEFAULT_ARRAY_SIZE, 100));
    setCurrentStep(0);
    setTotalSteps(0);
    setLogMessages([]);
    setExplanationText('Tek Yönlü Bağlı Liste Görselleştirmesi: İşlem seçin ve "Başlat" düğmesine tıklayın.');
  };

  // Add log message
  const addLogMessage = (message: string) => {
    setLogMessages(prevMessages => [...prevMessages, message]);
  };

  // Wait helper function
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Start visualization
  const startVisualization = async () => {
    if (sorting) return;
    
    try {
      setSorting(true);
      
      switch (selectedOperation) {
        case 'demo':
          await performLinkedListDemo();
          break;
        case 'prepend':
          await performPrepend();
          break;
        case 'append':
          await performAppend();
          break;
        case 'search':
          await performSearch();
          break;
        case 'delete':
          await performDelete();
          break;
        case 'traverse':
          await performTraverse();
          break;
        case 'clear':
          await performClear();
          break;
        default:
          setExplanationText('Lütfen bir işlem seçin.');
      }
    } catch (error) {
      console.error('Visualization error:', error);
      setExplanationText('Görselleştirme sırasında bir hata oluştu.');
    } finally {
      setSorting(false);
    }
  };

  // Get bar color
  const getBarColor = (index: number) => {
    if (!barColors.current || !barColors.current[index]) {
      return normalColor;
    }
    
    return barColors.current[index].interpolate({
      inputRange: [0, 1, 2, 3, 4],
      outputRange: [normalColor, comparingColor, swappingColor, sortedColor, headColor],
    });
  };

  // Demo operation
  const performLinkedListDemo = async () => {
    setCurrentStep(0);
    setTotalSteps(5);
    setLogMessages([]);
    
    try {
      setExplanationText('🔄 Tek Yönlü Bağlı Liste Demo Başlatılıyor...');
      addLogMessage('Tek Yönlü Bağlı Liste Demo başlatıldı');
      await wait(speed);
      
      // Show the structure
      setCurrentStep(1);
      setExplanationText('➡️ Tek Yönlü Bağlı Liste Yapısı: Her düğüm kendisinden sonraki düğümü gösterir (next pointer).');
      addLogMessage('Tek yönlü yapı açıklanıyor');
      await wait(speed);
      
      // Highlight head node
      setCurrentStep(2);
      if (array.length > 0) {
        barColors.current[0].setValue(4); // Head pointer color
        setExplanationText('⬅️ HEAD: Listenin başlangıç düğümünü gösteren pointer');
        addLogMessage('HEAD pointer gösteriliyor');
        await wait(speed);
      }
      
      // Traverse the list
      setCurrentStep(3);
      if (array.length > 0) {
        barColors.current[0].setValue(0); // Reset head color
      }
      
      for (let i = 0; i < array.length; i++) {
        barColors.current[i].setValue(1);
        setExplanationText(`🚶‍♂️ ${i + 1}. düğüm ziyaret edildi: ${array[i]}`);
        addLogMessage(`Düğüm ${i+1} ziyaret edildi: ${array[i]}`);
        await wait(speed / 2);
        
        if (i < array.length - 1) {
          barColors.current[i].setValue(3); // visited
          barColors.current[i+1].setValue(1); // current
        } else {
          barColors.current[i].setValue(3); // visited
        }
        await wait(speed / 2);
      }
      
      // Add a new node
      setCurrentStep(4);
      const newValue = Math.floor(Math.random() * 100) + 1;
      setExplanationText(`➕ Yeni bir düğüm (${newValue}) ekleniyor sona...`);
      addLogMessage(`Yeni düğüm ekleniyor: ${newValue}`);
      await wait(speed);
      
      setArray([...array, newValue]);
      
      // Reset colors
      await wait(speed / 2);
      barColors.current.forEach(color => color.setValue(0));
      
      // Complete demo
      setCurrentStep(5);
      setExplanationText('✅ Tek Yönlü Bağlı Liste Demo tamamlandı!');
      addLogMessage('Demo tamamlandı');
      await wait(speed);
    } catch (error) {
      console.error('Demo error:', error);
      setExplanationText('Demo sırasında bir hata oluştu.');
    }
  };

  // Prepend operation
  const performPrepend = async () => {
    if (!inputValue.trim()) {
      setExplanationText('⚠️ Lütfen eklenecek değeri girin!');
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      setExplanationText('⚠️ Lütfen geçerli bir sayı girin!');
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(3);
    setLogMessages([]);
    
    try {
      setCurrentStep(1);
      setExplanationText(`➕ Başa ${value} değeri ekleniyor...`);
      addLogMessage(`Başa ekleme işlemi: ${value}`);
      await wait(speed);
      
      setCurrentStep(2);
      setExplanationText(`🔄 Yeni düğüm HEAD olacak ve eski HEAD'i gösterecek...`);
      addLogMessage(`Yeni düğüm HEAD olarak ayarlanıyor`);
      await wait(speed);
      
      setCurrentStep(3);
      setArray([value, ...array]);
      setExplanationText(`✅ ${value} başa eklendi!`);
      addLogMessage(`Başa ekleme tamamlandı: ${value} eklendi`);
      setInputValue('');
    } catch (error) {
      console.error('Prepend error:', error);
      setExplanationText('Ekleme sırasında bir hata oluştu.');
    }
  };

  // Append operation
  const performAppend = async () => {
    if (!inputValue.trim()) {
      setExplanationText('⚠️ Lütfen eklenecek değeri girin!');
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      setExplanationText('⚠️ Lütfen geçerli bir sayı girin!');
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(3);
    setLogMessages([]);
    
    try {
      setCurrentStep(1);
      setExplanationText(`➕ Sona ${value} değeri ekleniyor...`);
      addLogMessage(`Sona ekleme işlemi: ${value}`);
      await wait(speed);
      
      if (array.length > 0) {
        setCurrentStep(2);
        setExplanationText(`🔄 Son düğümün next pointer'ı yeni düğümü gösterecek...`);
        addLogMessage(`Son düğüm yeni düğüme bağlanıyor`);
        barColors.current[array.length - 1].setValue(1);
        await wait(speed);
      }
      
      setCurrentStep(3);
      setArray([...array, value]);
      setExplanationText(`✅ ${value} sona eklendi!`);
      addLogMessage(`Sona ekleme tamamlandı: ${value} eklendi`);
      setInputValue('');
    } catch (error) {
      console.error('Append error:', error);
      setExplanationText('Ekleme sırasında bir hata oluştu.');
    }
  };

  // Search operation
  const performSearch = async () => {
    if (!inputValue.trim()) {
      setExplanationText('⚠️ Lütfen aranacak değeri girin!');
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      setExplanationText('⚠️ Lütfen geçerli bir sayı girin!');
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(array.length);
    setLogMessages([]);
    
    try {
      setExplanationText(`🔍 ${value} değeri aranıyor...`);
      addLogMessage(`Arama işlemi: ${value}`);
      
      let found = false;
      
      // Set head pointer
      if (array.length > 0) {
        barColors.current[0].setValue(4);
        await wait(speed / 2);
      }
      
      for (let i = 0; i < array.length; i++) {
        setCurrentStep(i + 1);
        barColors.current[i].setValue(1);
        setExplanationText(`🔍 ${i + 1}. düğüm kontrol ediliyor: ${array[i]} === ${value}?`);
        await wait(speed / 2);
        
        if (array[i] === value) {
          barColors.current[i].setValue(3);
          setExplanationText(`✅ ${value} değeri ${i + 1}. düğümde bulundu!`);
          addLogMessage(`BULUNDU: ${value} değeri ${i+1}. düğümde`);
          found = true;
          break;
        }
        
        barColors.current[i].setValue(0);
      }
      
      if (!found) {
        setExplanationText(`❌ ${value} değeri listede bulunamadı.`);
        addLogMessage(`Bulunamadı: ${value} değeri listede yok`);
      }
      
      setInputValue('');
    } catch (error) {
      console.error('Search error:', error);
      setExplanationText('Arama sırasında bir hata oluştu.');
    }
  };

  // Delete operation
  const performDelete = async () => {
    if (!inputValue.trim()) {
      setExplanationText('⚠️ Lütfen silinecek değeri girin!');
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      setExplanationText('⚠️ Lütfen geçerli bir sayı girin!');
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(array.length);
    setLogMessages([]);
    
    try {
      setExplanationText(`🗑️ ${value} değeri aranıp siliniyor...`);
      addLogMessage(`Silme işlemi: ${value}`);
      
      let found = false;
      
      // Set head pointer
      if (array.length > 0) {
        barColors.current[0].setValue(4);
        await wait(speed / 2);
      }
      
      for (let i = 0; i < array.length; i++) {
        setCurrentStep(i + 1);
        barColors.current[i].setValue(1);
        setExplanationText(`🔍 ${i + 1}. düğüm kontrol ediliyor: ${array[i]} === ${value}?`);
        await wait(speed / 2);
        
        if (array[i] === value) {
          barColors.current[i].setValue(2);
          setExplanationText(`🗑️ ${value} bulundu! Düğüm siliniyor...`);
          addLogMessage(`BULUNDU: ${value} değeri ${i+1}. düğümde siliniyor`);
          await wait(speed);
          
          if (i > 0) {
            setExplanationText(`🔄 ${i}. düğümün next pointer'ı ${i+2}. düğümü gösterecek şekilde güncelleniyor...`);
            barColors.current[i-1].setValue(1);
            await wait(speed);
          } else {
            setExplanationText(`🔄 HEAD pointer'ı ikinci düğümü gösterecek şekilde güncelleniyor...`);
          }
          
          const newArray = array.filter((_, index) => index !== i);
          setArray(newArray);
          setExplanationText(`✅ ${value} değeri silindi!`);
          found = true;
          break;
        }
        
        if (i > 0) {
          barColors.current[i-1].setValue(0);
        }
      }
      
      if (!found) {
        setExplanationText(`❌ ${value} değeri listede bulunamadı.`);
        addLogMessage(`Bulunamadı: ${value} değeri listede yok`);
      }
      
      setInputValue('');
    } catch (error) {
      console.error('Delete error:', error);
      setExplanationText('Silme sırasında bir hata oluştu.');
    }
  };

  // Traverse operation
  const performTraverse = async () => {
    if (array.length === 0) {
      setExplanationText('⚠️ Liste boş! Dolaşılacak eleman yok.');
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(array.length);
    setLogMessages([]);
    
    try {
      setExplanationText('🔄 Tek yönlü liste dolaşılıyor...');
      addLogMessage('Liste dolaşma işlemi başladı');
      
      // Set head pointer
      barColors.current[0].setValue(4);
      setExplanationText('⬅️ HEAD pointer listenin ilk elemanını gösterir');
      await wait(speed);
      
      // Traverse the list
      for (let i = 0; i < array.length; i++) {
        setCurrentStep(i + 1);
        barColors.current[i].setValue(1);
        setExplanationText(`🚶‍♂️ ${i + 1}. düğüm ziyaret edildi: ${array[i]}`);
        addLogMessage(`Düğüm ${i+1} ziyaret edildi: ${array[i]}`);
        await wait(speed / 2);
        
        if (i < array.length - 1) {
          setExplanationText(`➡️ Next pointer ${i+2}. düğümü gösteriyor: ${array[i+1]}`);
          barColors.current[i].setValue(3); // visited
          barColors.current[i+1].setValue(1); // current
        } else {
          setExplanationText(`➡️ Son düğümün next pointer'ı NULL'u gösteriyor (listenin sonu)`);
          barColors.current[i].setValue(3); // visited
        }
        await wait(speed / 2);
      }
      
      setExplanationText('✅ Tek yönlü liste dolaşma tamamlandı!');
      addLogMessage('Liste dolaşma tamamlandı');
    } catch (error) {
      console.error('Traverse error:', error);
      setExplanationText('Dolaşma sırasında bir hata oluştu.');
    }
  };

  // Clear operation
  const performClear = async () => {
    if (array.length === 0) {
      setExplanationText('⚠️ Liste zaten boş!');
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(1);
    setLogMessages([]);
    
    try {
      setExplanationText('🗑️ Tüm liste temizleniyor...');
      addLogMessage('Liste temizleme işlemi başladı');
      
      barColors.current.forEach(color => color.setValue(2));
      await wait(speed);
      
      setArray([]);
      setExplanationText('✅ Liste tamamen temizlendi! HEAD pointer artık NULL gösteriyor.');
      addLogMessage('Liste temizleme tamamlandı: Tüm düğümler silindi');
    } catch (error) {
      console.error('Clear error:', error);
      setExplanationText('Temizleme sırasında bir hata oluştu.');
    }
  };

  // Render the component
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'Tek Yönlü Bağlı Liste Görselleştirmesi'}</Text>
      
      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.operationSelector}>
          <Text style={styles.sectionTitle}>İşlem Seçin:</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'demo' && styles.selectedButton]}
              onPress={() => setSelectedOperation('demo')}>
              <Text style={styles.buttonText}>Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'prepend' && styles.selectedButton]}
              onPress={() => setSelectedOperation('prepend')}>
              <Text style={styles.buttonText}>Başa Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'append' && styles.selectedButton]}
              onPress={() => setSelectedOperation('append')}>
              <Text style={styles.buttonText}>Sona Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'search' && styles.selectedButton]}
              onPress={() => setSelectedOperation('search')}>
              <Text style={styles.buttonText}>Ara</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'delete' && styles.selectedButton]}
              onPress={() => setSelectedOperation('delete')}>
              <Text style={styles.buttonText}>Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'traverse' && styles.selectedButton]}
              onPress={() => setSelectedOperation('traverse')}>
              <Text style={styles.buttonText}>Dolaş</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'clear' && styles.selectedButton]}
              onPress={() => setSelectedOperation('clear')}>
              <Text style={styles.buttonText}>Temizle</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Input field for operations that need a value */}
        {['prepend', 'append', 'search', 'delete'].includes(selectedOperation) && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Değer:</Text>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder="Sayı girin..."
            />
          </View>
        )}
        
        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={startVisualization}
            disabled={sorting}>
            <Text style={styles.buttonText}>Başlat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={resetArray}
            disabled={sorting}>
            <Text style={styles.buttonText}>Yeni Liste</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Visualization Area */}
      <View style={styles.visualizationArea}>
        <View style={styles.arrayContainer}>
          {array.length > 0 && (
            <View style={styles.headPointer}>
              <Text style={styles.headPointerText}>HEAD</Text>
              <View style={styles.headArrow}>
                <Text>↓</Text>
              </View>
            </View>
          )}
          
          {array.map((value, index) => (
            <View key={index} style={styles.nodeContainer}>
              <Animated.View
                style={[
                  styles.node,
                  {
                    transform: [{translateX: barRefs.current[index] || 0}],
                    backgroundColor: getBarColor(index),
                  },
                ]}>
                <Text style={styles.nodeText}>{value}</Text>
              </Animated.View>
              {index < array.length - 1 && (
                <View style={styles.arrow}>
                  <Text>→</Text>
                </View>
              )}
              {index === array.length - 1 && (
                <View style={styles.nullPointer}>
                  <Text>NULL</Text>
                </View>
              )}
            </View>
          ))}
          {array.length === 0 && (
            <View style={styles.emptyListContainer}>
              <Text style={styles.headPointerText}>HEAD</Text>
              <View style={styles.headArrow}>
                <Text>↓</Text>
              </View>
              <Text style={styles.emptyMessage}>NULL (Boş Liste)</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Explanation Text */}
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationText}>{explanationText}</Text>
      </View>
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Adım: {currentStep}/{totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${totalSteps ? (currentStep / totalSteps) * 100 : 0}%` },
            ]}
          />
        </View>
      </View>
      
      {/* Log Messages */}
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>İşlem Günlüğü:</Text>
        <ScrollView style={styles.logScroll}>
          {logMessages.map((message, index) => (
            <Text key={index} style={styles.logMessage}>
              • {message}
            </Text>
          ))}
          {logMessages.length === 0 && (
            <Text style={styles.emptyMessage}>Henüz işlem yapılmadı.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  controlPanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  operationSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#9c88ff',
  },
  primaryButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
  },
  secondaryButton: {
    backgroundColor: '#a29bfe',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginRight: 8,
    minWidth: 60,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  visualizationArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'center',
  },
  arrayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headPointer: {
    alignItems: 'center',
    marginRight: 8,
  },
  headPointerText: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  headArrow: {
    marginTop: 4,
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  node: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgb(108, 92, 231)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  nodeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  arrow: {
    marginHorizontal: 4,
  },
  nullPointer: {
    marginHorizontal: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  emptyListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 16,
  },
  explanationContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    minHeight: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  explanationText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    marginBottom: 4,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    borderRadius: 4,
  },
  logContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
    maxHeight: 150,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  logScroll: {
    flex: 1,
  },
  logMessage: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});

export default SinglyLinkedListVisualization; 