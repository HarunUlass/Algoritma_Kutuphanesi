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
} from 'react-native';

// Constants
const DEFAULT_ANIMATION_SPEED = 500;
const DEFAULT_ARRAY_SIZE = 5;
const BAR_WIDTH = 30;
const BAR_MARGIN = 5;
const MAX_BAR_HEIGHT = 200;

// Props interface
interface DoublyListVisualizationProps {
  title: string;
  animationSpeed?: number;
  customArray?: number[];
}

// Random array generator function
const generateRandomArray = (length: number, maxValue: number): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * maxValue) + 10);
};

// Doubly Linked List Visualization Component
const DoublyLinkedListVisualization: React.FC<DoublyListVisualizationProps> = ({
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
  const [explanationText, setExplanationText] = useState<string>('Çift Yönlü Bağlı Liste Görselleştirmesi: İşlem seçin ve "Başlat" düğmesine tıklayın.');
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
  const tailColor = 'rgb(155, 89, 182)';      // Purple (for tail pointer)

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
    setExplanationText('Çift Yönlü Bağlı Liste Görselleştirmesi: İşlem seçin ve "Başlat" düğmesine tıklayın.');
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
        case 'insertMiddle':
          await performInsertMiddle();
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
        case 'reverseTraverse':
          await performReverseTraverse();
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
      inputRange: [0, 1, 2, 3, 4, 5],
      outputRange: [normalColor, comparingColor, swappingColor, sortedColor, headColor, tailColor],
    });
  };

  // Demo operation
  const performLinkedListDemo = async () => {
    setCurrentStep(0);
    setTotalSteps(7);
    setLogMessages([]);
    
    try {
      setExplanationText('🔄 Çift Yönlü Bağlı Liste Demo Başlatılıyor...');
      addLogMessage('Çift Yönlü Bağlı Liste Demo başlatıldı');
      await wait(speed);
      
      // Show the structure
      setCurrentStep(1);
      setExplanationText('➡️ Çift Yönlü Bağlı Liste Yapısı: Her düğüm kendisinden önceki ve sonraki düğümü gösterir (prev ve next pointerları)');
      addLogMessage('Çift yönlü yapı açıklanıyor');
      await wait(speed);
      
      // Highlight head node
      setCurrentStep(2);
      if (array.length > 0) {
        barColors.current[0].setValue(4); // Head pointer color
        setExplanationText('⬅️ HEAD: Listenin başlangıç düğümünü gösteren pointer');
        addLogMessage('HEAD pointer gösteriliyor');
        await wait(speed);
      }
      
      // Highlight tail node
      setCurrentStep(3);
      if (array.length > 0) {
        const lastIndex = array.length - 1;
        barColors.current[lastIndex].setValue(5); // Tail pointer color
        setExplanationText('➡️ TAIL: Listenin son düğümünü gösteren pointer');
        addLogMessage('TAIL pointer gösteriliyor');
        await wait(speed);
      }
      
      // Traverse the list forward
      setCurrentStep(4);
      if (array.length > 0) {
        barColors.current[0].setValue(1); // Reset head color to comparing
        
        for (let i = 0; i < array.length; i++) {
          barColors.current[i].setValue(1);
          setExplanationText(`🚶‍♂️ İleri Dolaşım: ${i + 1}. düğüm ziyaret edildi: ${array[i]}`);
          addLogMessage(`İleri dolaşım: Düğüm ${i+1} ziyaret edildi: ${array[i]}`);
          await wait(speed / 2);
          
          if (i < array.length - 1) {
            barColors.current[i].setValue(3); // visited
            barColors.current[i+1].setValue(1); // current
          } else {
            barColors.current[i].setValue(3); // visited
          }
        }
        await wait(speed / 2);
      }
      
      // Traverse the list backward
      setCurrentStep(5);
      if (array.length > 0) {
        // Reset colors
        barColors.current.forEach(color => color.setValue(0));
        
        const lastIndex = array.length - 1;
        barColors.current[lastIndex].setValue(1); // Start from tail
        
        for (let i = lastIndex; i >= 0; i--) {
          barColors.current[i].setValue(1);
          setExplanationText(`🚶‍♂️ Geri Dolaşım: ${i + 1}. düğüm ziyaret edildi: ${array[i]}`);
          addLogMessage(`Geri dolaşım: Düğüm ${i+1} ziyaret edildi: ${array[i]}`);
          await wait(speed / 2);
          
          if (i > 0) {
            barColors.current[i].setValue(3); // visited
            barColors.current[i-1].setValue(1); // current
          } else {
            barColors.current[i].setValue(3); // visited
          }
        }
        await wait(speed / 2);
      }
      
      // Complete demo
      setCurrentStep(6);
      barColors.current.forEach(color => color.setValue(3)); // Mark all as sorted
      setExplanationText('✅ Çift Yönlü Bağlı Liste Yapısı: Önceki ve sonraki bağlantılar sayesinde her iki yönde de hareket edebiliriz!');
      addLogMessage('Demo tamamlandı');
      await wait(speed);
      
      // Reset colors
      barColors.current.forEach(color => color.setValue(0));
      setCurrentStep(7);
      setExplanationText('📝 Çift Yönlü Bağlı Liste demosu tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Demo error:', error);
      setExplanationText('Demo sırasında bir hata oluştu.');
    }
  };

  // Prepend operation
  const performPrepend = async () => {
    if (!inputValue) {
      Alert.alert('Hata', 'Lütfen eklenecek bir değer girin.');
      setSorting(false);
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      Alert.alert('Hata', 'Geçerli bir sayı girin.');
      setSorting(false);
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(4);
    setLogMessages([]);
    
    try {
      // Step 1: Show initial list
      setExplanationText('🔄 Başa Ekleme İşlemi Başlatılıyor...');
      addLogMessage('Başa ekleme işlemi başladı');
      await wait(speed);
      
      // Step 2: Create new node
      setCurrentStep(1);
      setExplanationText(`⚙️ Yeni düğüm oluşturuluyor: ${value}`);
      addLogMessage(`Yeni düğüm oluşturuldu: ${value}`);
      await wait(speed);
      
      // Step 3: Set new node's next to head
      setCurrentStep(2);
      setExplanationText(`🔗 Yeni düğümün next pointer'ı mevcut head düğümüne ayarlanıyor`);
      addLogMessage('Yeni düğümün next pointerı ayarlandı');
      await wait(speed);
      
      // Step 4: Set head's prev to new node
      setCurrentStep(3);
      if (array.length > 0) {
        setExplanationText(`🔗 Mevcut head düğümünün prev pointer'ı yeni düğüme ayarlanıyor`);
        addLogMessage('Mevcut head düğümünün prev pointerı ayarlandı');
        await wait(speed);
      }
      
      // Step 5: Update head to new node
      setCurrentStep(4);
      setExplanationText(`✅ HEAD pointer yeni düğüme güncelleniyor ve işlem tamamlanıyor`);
      addLogMessage(`Düğüm başa eklendi: ${value}`);
      
      // Update array
      setArray([value, ...array]);
      setInputValue('');
      
      await wait(speed);
      setExplanationText('📝 Başa ekleme işlemi tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Prepend error:', error);
      setExplanationText('Başa ekleme sırasında bir hata oluştu.');
    }
  };
  
  // Append operation
  const performAppend = async () => {
    if (!inputValue) {
      Alert.alert('Hata', 'Lütfen eklenecek bir değer girin.');
      setSorting(false);
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      Alert.alert('Hata', 'Geçerli bir sayı girin.');
      setSorting(false);
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(4);
    setLogMessages([]);
    
    try {
      // Step 1: Show initial list
      setExplanationText('🔄 Sona Ekleme İşlemi Başlatılıyor...');
      addLogMessage('Sona ekleme işlemi başladı');
      await wait(speed);
      
      // Step 2: Create new node
      setCurrentStep(1);
      setExplanationText(`⚙️ Yeni düğüm oluşturuluyor: ${value}`);
      addLogMessage(`Yeni düğüm oluşturuldu: ${value}`);
      await wait(speed);
      
      if (array.length > 0) {
        // Step 3: Traverse to tail
        setCurrentStep(2);
        let currentIndex = 0;
        
        // Highlight nodes one by one until we reach the tail
        for (let i = 0; i < array.length; i++) {
          barColors.current[i].setValue(1);
          if (i > 0) barColors.current[i-1].setValue(0);
          currentIndex = i;
          
          setExplanationText(`🚶‍♂️ Son düğümü bulmak için liste dolaşılıyor: ${i+1}/${array.length}`);
          await wait(speed / 2);
        }
        
        // Step 4: Set tail's next to new node
        setCurrentStep(3);
        barColors.current[currentIndex].setValue(5); // Tail color
        setExplanationText(`🔗 Son düğümün next pointer'ı yeni düğüme ayarlanıyor`);
        addLogMessage('Son düğümün next pointerı ayarlandı');
        await wait(speed);
        
        // Step 5: Set new node's prev to tail
        setExplanationText(`🔗 Yeni düğümün prev pointer'ı eski tail düğümüne ayarlanıyor`);
        addLogMessage('Yeni düğümün prev pointerı ayarlandı');
        await wait(speed);
      } else {
        // If list is empty
        setCurrentStep(2);
        setExplanationText('⚠️ Liste boş, yeni düğüm head ve tail olarak ayarlanıyor');
        addLogMessage('Liste boş, yeni düğüm head ve tail olarak ayarlandı');
        await wait(speed);
      }
      
      // Step 6: Update tail to new node
      setCurrentStep(4);
      setExplanationText(`✅ TAIL pointer yeni düğüme güncelleniyor ve işlem tamamlanıyor`);
      addLogMessage(`Düğüm sona eklendi: ${value}`);
      
      // Update array
      setArray([...array, value]);
      setInputValue('');
      
      await wait(speed);
      setExplanationText('📝 Sona ekleme işlemi tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Append error:', error);
      setExplanationText('Sona ekleme sırasında bir hata oluştu.');
    }
  };
  
  // Insert in the middle operation
  const performInsertMiddle = async () => {
    if (!inputValue) {
      Alert.alert('Hata', 'Lütfen eklenecek bir değer girin.');
      setSorting(false);
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      Alert.alert('Hata', 'Geçerli bir sayı girin.');
      setSorting(false);
      return;
    }
    
    if (array.length < 2) {
      Alert.alert('Hata', 'Ortaya eklemek için en az 2 eleman gereklidir.');
      setSorting(false);
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(5);
    setLogMessages([]);
    
    try {
      // Step 1: Show initial list
      setExplanationText('🔄 Ortaya Ekleme İşlemi Başlatılıyor...');
      addLogMessage('Ortaya ekleme işlemi başladı');
      await wait(speed);
      
      // Step 2: Create new node
      setCurrentStep(1);
      setExplanationText(`⚙️ Yeni düğüm oluşturuluyor: ${value}`);
      addLogMessage(`Yeni düğüm oluşturuldu: ${value}`);
      await wait(speed);
      
      // Step 3: Find middle position
      setCurrentStep(2);
      const middleIndex = Math.floor(array.length / 2);
      
      // Highlight nodes one by one until we reach the middle
      for (let i = 0; i <= middleIndex; i++) {
        barColors.current[i].setValue(1);
        if (i > 0) barColors.current[i-1].setValue(0);
        
        setExplanationText(`🚶‍♂️ Orta noktayı bulmak için liste dolaşılıyor: ${i+1}/${middleIndex+1}`);
        await wait(speed / 2);
      }
      
      barColors.current[middleIndex].setValue(2); // Swap color for insertion point
      setExplanationText(`🎯 Ekleme yapılacak konum bulundu: ${middleIndex+1}. pozisyon`);
      addLogMessage(`Ekleme yapılacak konum: ${middleIndex+1}. pozisyon`);
      await wait(speed);
      
      // Step 4: Update pointers
      setCurrentStep(3);
      setExplanationText(`🔗 Yeni düğümün next pointer'ı ${middleIndex+1}. düğüme ayarlanıyor`);
      addLogMessage('Yeni düğümün next pointerı ayarlandı');
      await wait(speed);
      
      setCurrentStep(4);
      setExplanationText(`🔗 Yeni düğümün prev pointer'ı ${middleIndex}. düğüme ayarlanıyor`);
      addLogMessage('Yeni düğümün prev pointerı ayarlandı');
      await wait(speed);
      
      barColors.current[middleIndex].setValue(0); // Reset color
      
      // Step 5: Insert the new value
      setCurrentStep(5);
      setExplanationText(`✅ Düğümler arasındaki bağlantılar güncelleniyor ve işlem tamamlanıyor`);
      addLogMessage(`Düğüm ortaya eklendi: ${value}`);
      
      // Update array
      const newArray = [...array];
      newArray.splice(middleIndex + 1, 0, value);
      setArray(newArray);
      setInputValue('');
      
      await wait(speed);
      setExplanationText('📝 Ortaya ekleme işlemi tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Insert Middle error:', error);
      setExplanationText('Ortaya ekleme sırasında bir hata oluştu.');
    }
  };
  
  // Search operation
  const performSearch = async () => {
    if (!inputValue) {
      Alert.alert('Hata', 'Lütfen aranacak bir değer girin.');
      setSorting(false);
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      Alert.alert('Hata', 'Geçerli bir sayı girin.');
      setSorting(false);
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(3);
    setLogMessages([]);
    
    try {
      // Step 1: Show initial list
      setExplanationText('🔄 Arama İşlemi Başlatılıyor...');
      addLogMessage(`${value} değeri için arama başladı`);
      await wait(speed);
      
      // Step 2: Search for value
      setCurrentStep(1);
      setExplanationText(`🔍 Liste içinde ${value} değeri aranıyor...`);
      
      let found = false;
      let foundIndex = -1;
      
      // Highlight nodes one by one
      for (let i = 0; i < array.length; i++) {
        barColors.current[i].setValue(1);
        
        setExplanationText(`🔍 ${i+1}. düğüm kontrol ediliyor: ${array[i]}`);
        addLogMessage(`${i+1}. düğüm kontrol edildi: ${array[i]}`);
        await wait(speed / 2);
        
        if (array[i] === value) {
          barColors.current[i].setValue(3); // Found - sorted color
          foundIndex = i;
          found = true;
          break;
        } else {
          barColors.current[i].setValue(0); // Reset color
        }
      }
      
      // Step 3: Show result
      setCurrentStep(2);
      if (found) {
        setExplanationText(`✅ Aranan değer bulundu! Pozisyon: ${foundIndex + 1}`);
        addLogMessage(`${value} değeri ${foundIndex + 1}. pozisyonda bulundu`);
      } else {
        setExplanationText(`❌ Aranan değer listede bulunamadı: ${value}`);
        addLogMessage(`${value} değeri listede bulunamadı`);
      }
      
      await wait(speed);
      
      // Step 4: Complete search
      setCurrentStep(3);
      barColors.current.forEach(color => color.setValue(0)); // Reset colors
      setInputValue('');
      setExplanationText('📝 Arama işlemi tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Search error:', error);
      setExplanationText('Arama sırasında bir hata oluştu.');
    }
  };
  
  // Delete operation
  const performDelete = async () => {
    if (!inputValue) {
      Alert.alert('Hata', 'Lütfen silinecek bir değer girin.');
      setSorting(false);
      return;
    }
    
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      Alert.alert('Hata', 'Geçerli bir sayı girin.');
      setSorting(false);
      return;
    }
    
    setCurrentStep(0);
    setTotalSteps(5);
    setLogMessages([]);
    
    try {
      // Step 1: Show initial list
      setExplanationText('🔄 Silme İşlemi Başlatılıyor...');
      addLogMessage(`${value} değeri için silme işlemi başladı`);
      await wait(speed);
      
      // Step 2: Search for value
      setCurrentStep(1);
      setExplanationText(`🔍 Liste içinde ${value} değeri aranıyor...`);
      
      let found = false;
      let foundIndex = -1;
      
      // Highlight nodes one by one
      for (let i = 0; i < array.length; i++) {
        barColors.current[i].setValue(1);
        
        setExplanationText(`🔍 ${i+1}. düğüm kontrol ediliyor: ${array[i]}`);
        addLogMessage(`${i+1}. düğüm kontrol edildi: ${array[i]}`);
        await wait(speed / 2);
        
        if (array[i] === value) {
          barColors.current[i].setValue(2); // Found - swap color (red for delete)
          foundIndex = i;
          found = true;
          break;
        } else {
          barColors.current[i].setValue(0); // Reset color
        }
      }
      
      // If not found
      if (!found) {
        setCurrentStep(2);
        setExplanationText(`❌ Silinecek değer listede bulunamadı: ${value}`);
        addLogMessage(`${value} değeri listede bulunamadı`);
        await wait(speed);
        
        setCurrentStep(5);
        setInputValue('');
        setExplanationText('📝 Silme işlemi tamamlanamadı. Başka bir işlem seçebilirsiniz.');
        return;
      }
      
      // Step 3: Update pointers
      setCurrentStep(2);
      
      if (foundIndex === 0) {
        // Delete head
        setExplanationText(`⚙️ Silinen düğüm HEAD düğümü, HEAD pointer güncelleniyor...`);
        addLogMessage('HEAD düğümü siliniyor');
      } else if (foundIndex === array.length - 1) {
        // Delete tail
        setExplanationText(`⚙️ Silinen düğüm TAIL düğümü, TAIL pointer güncelleniyor...`);
        addLogMessage('TAIL düğümü siliniyor');
      } else {
        // Delete middle node
        setExplanationText(`⚙️ Orta düğüm siliniyor, komşu düğümlerin bağlantıları güncelleniyor...`);
        addLogMessage('Orta düğüm siliniyor');
      }
      
      await wait(speed);
      
      // Step 4: Update prev node's next
      setCurrentStep(3);
      if (foundIndex > 0) {
        barColors.current[foundIndex - 1].setValue(1);
        setExplanationText(`🔗 Önceki düğümün next pointer'ı güncelleniyor...`);
        addLogMessage('Önceki düğümün next pointerı güncellendi');
        await wait(speed);
        barColors.current[foundIndex - 1].setValue(0);
      }
      
      // Step 5: Update next node's prev
      setCurrentStep(4);
      if (foundIndex < array.length - 1) {
        barColors.current[foundIndex + 1].setValue(1);
        setExplanationText(`🔗 Sonraki düğümün prev pointer'ı güncelleniyor...`);
        addLogMessage('Sonraki düğümün prev pointerı güncellendi');
        await wait(speed);
        barColors.current[foundIndex + 1].setValue(0);
      }
      
      // Step 6: Remove node
      setCurrentStep(5);
      setExplanationText(`✅ Düğüm başarıyla silindi: ${value}`);
      addLogMessage(`${value} değeri listeden silindi`);
      
      // Update array
      const newArray = array.filter((_, index) => index !== foundIndex);
      setArray(newArray);
      setInputValue('');
      
      await wait(speed);
      setExplanationText('📝 Silme işlemi tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Delete error:', error);
      setExplanationText('Silme sırasında bir hata oluştu.');
    }
  };
  
  // Traverse operation (forward)
  const performTraverse = async () => {
    setCurrentStep(0);
    setTotalSteps(3);
    setLogMessages([]);
    
    try {
      setExplanationText('🔄 İleri Dolaşım Başlatılıyor...');
      addLogMessage('İleri dolaşım başladı');
      await wait(speed);
      
      // Step 1: Start from head
      setCurrentStep(1);
      if (array.length > 0) {
        barColors.current[0].setValue(4); // Head color
        setExplanationText('⬅️ HEAD düğümünden başlayarak ileri doğru dolaşılıyor');
        addLogMessage('HEAD düğümünden başlandı');
        await wait(speed);
        
        barColors.current[0].setValue(1); // Reset to comparing color
      } else {
        setExplanationText('⚠️ Liste boş, dolaşım yapılamıyor');
        addLogMessage('Liste boş');
        await wait(speed);
        setCurrentStep(3);
        return;
      }
      
      // Step 2: Traverse forward
      setCurrentStep(2);
      for (let i = 0; i < array.length; i++) {
        barColors.current[i].setValue(1); // Current node
        
        setExplanationText(`🚶‍♂️ ${i + 1}. düğüm ziyaret edildi: ${array[i]}`);
        addLogMessage(`Düğüm ${i+1} ziyaret edildi: ${array[i]}`);
        await wait(speed / 2);
        
        if (i < array.length - 1) {
          barColors.current[i].setValue(3); // Visited
          barColors.current[i+1].setValue(1); // Next
        } else {
          barColors.current[i].setValue(3); // Visited
        }
      }
      
      // Step 3: Complete traversal
      setCurrentStep(3);
      setExplanationText('✅ İleri dolaşım tamamlandı');
      addLogMessage('İleri dolaşım tamamlandı');
      
      await wait(speed);
      
      // Reset colors
      barColors.current.forEach(color => color.setValue(0));
      setExplanationText('📝 İleri dolaşım işlemi tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Traverse error:', error);
      setExplanationText('Dolaşım sırasında bir hata oluştu.');
    }
  };
  
  // Reverse Traverse operation (backward)
  const performReverseTraverse = async () => {
    setCurrentStep(0);
    setTotalSteps(3);
    setLogMessages([]);
    
    try {
      setExplanationText('🔄 Geri Dolaşım Başlatılıyor...');
      addLogMessage('Geri dolaşım başladı');
      await wait(speed);
      
      // Step 1: Start from tail
      setCurrentStep(1);
      if (array.length > 0) {
        const lastIndex = array.length - 1;
        barColors.current[lastIndex].setValue(5); // Tail color
        setExplanationText('➡️ TAIL düğümünden başlayarak geriye doğru dolaşılıyor');
        addLogMessage('TAIL düğümünden başlandı');
        await wait(speed);
        
        barColors.current[lastIndex].setValue(1); // Reset to comparing color
      } else {
        setExplanationText('⚠️ Liste boş, dolaşım yapılamıyor');
        addLogMessage('Liste boş');
        await wait(speed);
        setCurrentStep(3);
        return;
      }
      
      // Step 2: Traverse backward
      setCurrentStep(2);
      for (let i = array.length - 1; i >= 0; i--) {
        barColors.current[i].setValue(1); // Current node
        
        setExplanationText(`🚶‍♂️ ${i + 1}. düğüm ziyaret edildi: ${array[i]}`);
        addLogMessage(`Düğüm ${i+1} ziyaret edildi: ${array[i]}`);
        await wait(speed / 2);
        
        if (i > 0) {
          barColors.current[i].setValue(3); // Visited
          barColors.current[i-1].setValue(1); // Previous
        } else {
          barColors.current[i].setValue(3); // Visited
        }
      }
      
      // Step 3: Complete traversal
      setCurrentStep(3);
      setExplanationText('✅ Geri dolaşım tamamlandı');
      addLogMessage('Geri dolaşım tamamlandı');
      
      await wait(speed);
      
      // Reset colors
      barColors.current.forEach(color => color.setValue(0));
      setExplanationText('📝 Geri dolaşım işlemi tamamlandı. Başka bir işlem seçebilirsiniz.');
    } catch (error) {
      console.error('Reverse Traverse error:', error);
      setExplanationText('Geri dolaşım sırasında bir hata oluştu.');
    }
  };
  
  // Clear operation
  const performClear = async () => {
    setCurrentStep(0);
    setTotalSteps(2);
    setLogMessages([]);
    
    try {
      setCurrentStep(1);
      setExplanationText('🗑️ Tüm liste temizleniyor...');
      addLogMessage('Liste temizleme işlemi başladı');
      
      barColors.current.forEach(color => color.setValue(2));
      await wait(speed);
      
      setCurrentStep(2);
      setArray([]);
      setExplanationText('✅ Liste tamamen temizlendi! HEAD ve TAIL pointerları artık NULL gösteriyor.');
      addLogMessage('Liste temizleme tamamlandı: Tüm düğümler silindi');
    } catch (error) {
      console.error('Clear error:', error);
      setExplanationText('Temizleme sırasında bir hata oluştu.');
    }
  };

  // Render the component
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'Çift Yönlü Bağlı Liste Görselleştirmesi'}</Text>
      
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
              style={[styles.button, selectedOperation === 'insertMiddle' && styles.selectedButton]}
              onPress={() => setSelectedOperation('insertMiddle')}>
              <Text style={styles.buttonText}>Ortaya Ekle</Text>
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
              <Text style={styles.buttonText}>İleri Dolaş</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'reverseTraverse' && styles.selectedButton]}
              onPress={() => setSelectedOperation('reverseTraverse')}>
              <Text style={styles.buttonText}>Geri Dolaş</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, selectedOperation === 'clear' && styles.selectedButton]}
              onPress={() => setSelectedOperation('clear')}>
              <Text style={styles.buttonText}>Temizle</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Input field for operations that need a value */}
        {['prepend', 'append', 'insertMiddle', 'search', 'delete'].includes(selectedOperation) && (
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
              <View style={styles.prevPointer}>
                {index > 0 && <Text>←</Text>}
              </View>
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
              <View style={styles.arrow}>
                {index < array.length - 1 && <Text>→</Text>}
              </View>
              {index === array.length - 1 && (
                <View style={styles.tailPointer}>
                  <Text style={styles.tailPointerText}>TAIL</Text>
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
              <View style={styles.tailArrow}>
                <Text>↓</Text>
              </View>
              <Text style={styles.tailPointerText}>TAIL</Text>
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
  },
  operationSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  selectedButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#333',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
    marginRight: 8,
    paddingHorizontal: 24,
  },
  secondaryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
  },
  visualizationArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'center',
  },
  arrayContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 16,
    minHeight: 120,
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 8,
  },
  node: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  nodeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  arrow: {
    marginHorizontal: 4,
  },
  prevPointer: {
    width: 20,
    alignItems: 'center',
  },
  headPointer: {
    position: 'absolute',
    top: -40,
    left: 20,
    alignItems: 'center',
  },
  headPointerText: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  headArrow: {
    marginTop: 4,
  },
  tailPointer: {
    marginLeft: 4,
  },
  tailPointerText: {
    fontWeight: 'bold',
    color: '#9b59b6',
  },
  nullPointer: {
    marginLeft: 4,
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f1f1f1',
  },
  emptyListContainer: {
    alignItems: 'center',
  },
  emptyMessage: {
    marginTop: 8,
    color: '#777',
    fontStyle: 'italic',
  },
  tailArrow: {
    marginTop: 8,
  },
  explanationContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f1f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  logContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    elevation: 2,
  },
  logTitle: {
    fontSize: 18,
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
    color: '#555',
  },
});

export default DoublyLinkedListVisualization; 