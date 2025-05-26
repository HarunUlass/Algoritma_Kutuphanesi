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
import { AlgorithmInfoCard } from './VisualizationHelpers';

// Farklı algoritmaların görselleştirmeleri için veri tipleri
interface ArrayVisualizationProps {
  algorithmType: string;
  title: string;
  animationSpeed?: number; // Milisaniye cinsinden animasyon hızı
  customArray?: number[]; // İsteğe bağlı özel dizi
}

// Sabitleri tanımla
const BAR_WIDTH = 30;
const BAR_MARGIN = 5;
const MAX_BAR_HEIGHT = 200;
const DEFAULT_ANIMATION_SPEED = 500; // ms

// Rastgele bir dizi oluşturmak için fonksiyon
const generateRandomArray = (length: number, maxValue: number): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * maxValue) + 10);
};

// Algoritma Görselleştirme bileşeni
const AlgorithmVisualization: React.FC<ArrayVisualizationProps> = ({
  algorithmType,
  title,
  animationSpeed = DEFAULT_ANIMATION_SPEED,
  customArray,
}) => {
  // Ekran genişliği ölçümü
  const windowWidth = Dimensions.get('window').width;
  
  // Durumları tanımla
  const [array, setArray] = useState<number[]>(customArray || generateRandomArray(8, 100));
  const [sorting, setSorting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [explanationText, setExplanationText] = useState<string>('Görselleştirmeyi başlatmak için "Başlat" düğmesine tıklayın.');
  const [searchTarget, setSearchTarget] = useState<string>('');
  
  // Animasyon değerlerini tut
  const barRefs = useRef<Animated.Value[]>([]);
  const barColors = useRef<Animated.Value[]>([]);
  
  // Animasyon renklerini ayarlamak için yardımcı fonksiyonlar
  const normalColor = 'rgb(108, 92, 231)'; // Mor
  const comparingColor = 'rgb(255, 165, 0)'; // Turuncu
  const swappingColor = 'rgb(255, 0, 0)'; // Kırmızı
  const sortedColor = 'rgb(46, 213, 115)'; // Yeşil
  
  // Her dizinin değişiminde animasyon değerlerini yenile
  useEffect(() => {
    // Önceki referansları temizle
    barRefs.current = [];
    barColors.current = [];
    
    try {
      // Her eleman için yeni animasyon değerleri oluştur
      array.forEach(() => {
        barRefs.current.push(new Animated.Value(0));
        barColors.current.push(new Animated.Value(0));
      });
      
      // Başlangıçta tüm barları normal renge ayarla
      barColors.current.forEach((color, index) => {
        if (color) color.setValue(0); // 0 = normal renk
      });
    } catch (error) {
      console.error('Animasyon değerlerini başlatırken hata:', error);
    }
  }, [array]);
  
  // Yeni bir rastgele dizi oluştur
  const resetArray = () => {
    if (sorting) return; // Sıralama işlemi sırasında yeni dizi oluşturma
    setArray(generateRandomArray(8, 100));
    setCurrentStep(0);
    setTotalSteps(0);
    setExplanationText('Görselleştirmeyi başlatmak için "Başlat" düğmesine tıklayın.');
  };
  
  // Renk değerlerini animasyonlu renklere dönüştür
  const getBarColor = (index: number) => {
    // barColors.current[index] değeri henüz yoksa veya tanımsızsa yeni bir değer oluştur
    if (!barColors.current || !barColors.current[index]) {
      return normalColor; // Varsayılan renk döndür
    }
    
    return barColors.current[index].interpolate({
      inputRange: [0, 1, 2, 3],
      outputRange: [normalColor, comparingColor, swappingColor, sortedColor],
    });
  };
  
  // İki barın yerinin değişmesini animasyonla göster
  const animateSwap = (index1: number, index2: number, delay: number = 0): Promise<void> => {
    const bar1Position = index1 * (BAR_WIDTH + BAR_MARGIN);
    const bar2Position = index2 * (BAR_WIDTH + BAR_MARGIN);
    const distance = bar2Position - bar1Position;
    
    return new Promise<void>((resolve) => {
      // Referanslar hazır değilse işlemi sonlandır
      if (!barRefs.current || !barColors.current || 
          !barRefs.current[index1] || !barRefs.current[index2] ||
          !barColors.current[index1] || !barColors.current[index2]) {
        console.warn(`animateSwap: Geçersiz indeksler (${index1}, ${index2}) veya referanslar hazır değil`);
        resolve();
        return;
      }
      
      // Karşılaştırma rengini ayarla
      Animated.timing(barColors.current[index1], {
        toValue: 1, // Turuncu - karşılaştırma
        duration: speed / 3,
        useNativeDriver: false,
      }).start();
      
      Animated.timing(barColors.current[index2], {
        toValue: 1, // Turuncu - karşılaştırma
        duration: speed / 3,
        useNativeDriver: false,
      }).start();
      
      setTimeout(() => {
        // Takas rengini ayarla
        Animated.timing(barColors.current[index1], {
          toValue: 2, // Kırmızı - takas
          duration: speed / 3,
          useNativeDriver: false,
        }).start();
        
        Animated.timing(barColors.current[index2], {
          toValue: 2, // Kırmızı - takas
          duration: speed / 3,
          useNativeDriver: false,
        }).start();
        
        // Bar 1'i sağa taşı
        Animated.timing(barRefs.current[index1], {
          toValue: distance,
          duration: speed,
          useNativeDriver: false,
        }).start();
        
        // Bar 2'yi sola taşı
        Animated.timing(barRefs.current[index2], {
          toValue: -distance,
          duration: speed,
          useNativeDriver: false,
        }).start();
        
        // Animasyon tamamlandıktan sonra referansları sıfırla
        setTimeout(() => {
          barRefs.current[index1].setValue(0);
          barRefs.current[index2].setValue(0);
          
          // Normal renklere geri dön
          Animated.timing(barColors.current[index1], {
            toValue: 0, // Normal renk
            duration: speed / 3,
            useNativeDriver: false,
          }).start();
          
          Animated.timing(barColors.current[index2], {
            toValue: 0, // Normal renk
            duration: speed / 3,
            useNativeDriver: false,
          }).start();
          
          resolve();
        }, speed);
      }, speed / 3);
    });
  };
  
  // Renkleri animasyonla değiştir
  const animateColor = (index: number, colorValue: number, duration: number = speed / 2): Promise<void> => {
    return new Promise<void>((resolve) => {
      // index geçerli bir aralıkta değilse ya da barColors henüz hazır değilse
      if (!barColors.current || !barColors.current[index]) {
        console.warn(`animateColor: Geçersiz index (${index}) veya barColors hazır değil`);
        resolve(); // İşlemi sonlandır
        return;
      }
      
      Animated.timing(barColors.current[index], {
        toValue: colorValue,
        duration,
        useNativeDriver: false,
      }).start(() => {
        resolve();
      });
    });
  };
  
  // Bubble Sort algoritması için görselleştirme
  const visualizeBubbleSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    try {
      const newArray = [...array];
      const n = newArray.length;
      let totalSwaps = 0;
      
      // Toplam adım sayısını hesapla
      const totalPotentialSteps = (n * (n - 1)) / 2;
      setTotalSteps(totalPotentialSteps);
      
      let currentStepCount = 0;
      let swapped = false;
      
      setExplanationText('Bubble Sort algoritması başlatılıyor. Her geçişte komşu elemanları karşılaştırarak büyük değerleri dizinin sonuna doğru "kabarcık" gibi yükseltir.');
      
      for (let i = 0; i < n - 1; i++) {
        swapped = false;
        
        for (let j = 0; j < n - i - 1; j++) {
          // Karşılaştırılan barları vurgula
          setExplanationText(`${newArray[j]} ve ${newArray[j + 1]} karşılaştırılıyor...`);
          await Promise.all([
            animateColor(j, 1),
            animateColor(j + 1, 1),
          ]);
          
          // Karşılaştırma için bekle
          await new Promise(resolve => setTimeout(resolve, speed / 2));
          
          if (newArray[j] > newArray[j + 1]) {
            // Takas edilecek barları vurgula
            setExplanationText(`${newArray[j]} > ${newArray[j + 1]}, yer değiştiriliyor...`);
            await Promise.all([
              animateColor(j, 2),
              animateColor(j + 1, 2),
            ]);
            
            // Takas için bekle
            await new Promise(resolve => setTimeout(resolve, speed / 3));
            
            // Elemanları takas et
            const temp = newArray[j];
            newArray[j] = newArray[j+1];
            newArray[j+1] = temp;
            
            // Takas animasyonunu göster
            await animateSwap(j, j + 1);
            
            // Diziyi güncelle
            setArray([...newArray]);
            swapped = true;
            totalSwaps++;
            
            // Takas sonrası kısa bekle
            await new Promise(resolve => setTimeout(resolve, speed / 4));
          }
          
          // Renkleri normale döndür
          await Promise.all([
            animateColor(j, 0),
            animateColor(j + 1, 0),
          ]);
          
          currentStepCount++;
          setCurrentStep(currentStepCount);
        }
        
        // Geçiş tamamlandı, son eleman sıralandı
        await animateColor(n - i - 1, 3);
        setExplanationText(`${i + 1}. geçiş tamamlandı. ${newArray[n - i - 1]} değeri doğru konumuna yerleşti.`);
        
        // Eğer takas yapılmadıysa, dizi sıralanmış demektir
        if (!swapped) {
          setExplanationText('Hiç takas yapılmadı, dizi zaten sıralanmış!');
          break;
        }
        
        // Geçişler arası kısa bekle
        await new Promise(resolve => setTimeout(resolve, speed / 3));
      }
      
      // Tüm elemanları sıralanmış olarak işaretle
      for (let i = 0; i < n; i++) {
        try {
          if (barColors.current && barColors.current[i] && 
              (barColors.current[i] as any).__getValue && 
              (barColors.current[i] as any).__getValue() !== 3) {
            await animateColor(i, 3, 100);
          }
        } catch (error) {
          // Hata oluşursa tüm elemanları sıralanmış olarak işaretlemeye devam et
          await animateColor(i, 3, 100);
        }
      }
      
      setExplanationText(`Bubble Sort tamamlandı! Toplam ${totalSwaps} takas yapıldı. Dizi başarıyla sıralandı.`);
    } catch (error) {
      console.error("Bubble Sort sırasında hata:", error);
      setExplanationText("Görselleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSorting(false);
    }
  };
  
  // Binary Search algoritması için görselleştirme
  const visualizeBinarySearch = async () => {
    if (sorting) return;
    
    // Hedef değeri kontrol et
    if (!searchTarget.trim()) {
      Alert.alert('Hata', 'Lütfen aranacak sayıyı girin.');
      return;
    }
    
    const target = parseInt(searchTarget.trim());
    if (isNaN(target)) {
      Alert.alert('Hata', 'Lütfen geçerli bir sayı girin.');
      return;
    }
    
    setSorting(true);
    setCurrentStep(0);
    
    try {
      // Önce sıralı bir dizi oluştur
      const sortedArr = [...array].sort((a, b) => a - b);
      setArray(sortedArr);
      
      setExplanationText(`🎯 Binary Search başlatılıyor! Hedef: ${target} | Dizi otomatik olarak sıralandı: [${sortedArr.join(', ')}]`);
      
      let left = 0;
      let right = sortedArr.length - 1;
      let step = 0;
      let found = false;
      let totalComparisons = 0;
      
      // Maksimum adım sayısını hesapla (log2(n))
      const maxSteps = Math.ceil(Math.log2(sortedArr.length));
      setTotalSteps(maxSteps);
      
      await new Promise(resolve => setTimeout(resolve, speed));
      
      while (left <= right) {
        step++;
        totalComparisons++;
        setCurrentStep(step);
        
        // Tüm elemanları normal renge ayarla
        for (let i = 0; i < sortedArr.length; i++) {
          await animateColor(i, 0, 100);
        }
        
        // Arama aralığını vurgula (turuncu)
        for (let i = left; i <= right; i++) {
          await animateColor(i, 1, 100);
        }
        
        const mid = Math.floor((left + right) / 2);
        setExplanationText(`🔍 Adım ${step}: Arama aralığı [${left}, ${right}] | Orta nokta: pozisyon ${mid + 1}, değer: ${sortedArr[mid]}`);
        
        await new Promise(resolve => setTimeout(resolve, speed / 2));
        
        // Orta noktayı vurgula (kırmızı)
        await animateColor(mid, 2, 300);
        setExplanationText(`⚖️ Karşılaştırma ${totalComparisons}: ${sortedArr[mid]} vs ${target}`);
        
        await new Promise(resolve => setTimeout(resolve, speed));
        
        if (sortedArr[mid] === target) {
          // Bulundu!
          await animateColor(mid, 3, 500);
          setExplanationText(`🎉 BULUNDU! ${target} değeri ${step} adımda bulundu! (pozisyon ${mid + 1})`);
          found = true;
          
          // Başarı animasyonu
          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            await animateColor(mid, 2);
            await new Promise(resolve => setTimeout(resolve, 300));
            await animateColor(mid, 3);
          }
          break;
        } else if (sortedArr[mid] < target) {
          // Sağ yarıda ara
          setExplanationText(`📈 ${sortedArr[mid]} < ${target}, hedef daha büyük → sağ yarıda aramaya devam`);
          
          // Sol yarıyı gri yap (elendi)
          for (let i = left; i <= mid; i++) {
            await animateColor(i, 0, 100);
          }
          
          left = mid + 1;
        } else {
          // Sol yarıda ara
          setExplanationText(`📉 ${sortedArr[mid]} > ${target}, hedef daha küçük → sol yarıda aramaya devam`);
          
          // Sağ yarıyı gri yap (elendi)
          for (let i = mid; i <= right; i++) {
            await animateColor(i, 0, 100);
          }
          
          right = mid - 1;
        }
        
        await new Promise(resolve => setTimeout(resolve, speed));
      }
      
      if (!found) {
        // Tüm diziyi gri yap
        for (let i = 0; i < sortedArr.length; i++) {
          await animateColor(i, 0, 100);
        }
        setExplanationText(`❌ ${target} değeri ${step} adımda bulunamadı! Dizi tamamen tarandı.`);
      }
      
      // Özet bilgi
      const efficiency = `${step}/${maxSteps} maksimum adım kullanıldı`;
      const finalMessage = found 
        ? `✅ Binary Search tamamlandı! Hedef ${step} adımda bulundu. Verimlilik: ${efficiency}`
        : `❌ Binary Search tamamlandı! Hedef ${step} adımda bulunamadığı kesinleşti. Verimlilik: ${efficiency}`;
      
      await new Promise(resolve => setTimeout(resolve, speed));
      setExplanationText(finalMessage);
      
    } catch (error) {
      console.error("Binary Search sırasında hata:", error);
      setExplanationText("Görselleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSorting(false);
    }
  };
  
  // Merge Sort algoritması için görselleştirme
  const visualizeMergeSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    const arr = [...array];
    const n = arr.length;
    let stepCount = 0;
    const steps = Math.ceil(n * Math.log2(n)); // Merge Sort adım sayısı tahmini
    setTotalSteps(steps);
    
    setExplanationText('Merge Sort, böl ve fethet (divide and conquer) yaklaşımını kullanarak diziyi sürekli ikiye böler ve birleştirir.');
    
    // Merge Sort animasyonu
    const animations: { indices: number[], type: string }[] = [];
    
    // Merge Sort fonksiyonu
    const mergeSort = (array: number[], start: number, end: number) => {
      if (end <= start) return;
      
      const middle = Math.floor((start + end) / 2);
      
      // Diziyi iki parçaya böl
      mergeSort(array, start, middle);
      mergeSort(array, middle + 1, end);
      
      // İki sıralı diziyi birleştir
      merge(array, start, middle, end);
    };
    
    // İki sıralı diziyi birleştirme fonksiyonu
    const merge = (array: number[], start: number, middle: number, end: number) => {
      // Geçici diziler oluştur
      const leftSize = middle - start + 1;
      const rightSize = end - middle;
      
      const leftArray = [];
      const rightArray = [];
      
      // Geçici dizileri doldur
      for (let i = 0; i < leftSize; i++) {
        leftArray[i] = array[start + i];
      }
      
      for (let i = 0; i < rightSize; i++) {
        rightArray[i] = array[middle + 1 + i];
      }
      
      // İki diziyi birleştir
      let i = 0, j = 0, k = start;
      
      while (i < leftSize && j < rightSize) {
        // Karşılaştırma animasyonu
        animations.push({ indices: [start + i, middle + 1 + j], type: 'compare' });
        
        if (leftArray[i] <= rightArray[j]) {
          // Sol diziden değeri al
          animations.push({ indices: [k, leftArray[i]], type: 'overwrite' });
          array[k] = leftArray[i];
          i++;
        } else {
          // Sağ diziden değeri al
          animations.push({ indices: [k, rightArray[j]], type: 'overwrite' });
          array[k] = rightArray[j];
          j++;
        }
        k++;
      }
      
      // Kalan elemanları kopyala
      while (i < leftSize) {
        animations.push({ indices: [k, leftArray[i]], type: 'overwrite' });
        array[k] = leftArray[i];
        i++;
        k++;
      }
      
      while (j < rightSize) {
        animations.push({ indices: [k, rightArray[j]], type: 'overwrite' });
        array[k] = rightArray[j];
        j++;
        k++;
      }
    };
    
    // Ana merge sort fonksiyonunu çağır ve animasyonları oluştur
    const tempArray = [...arr];
    mergeSort(tempArray, 0, tempArray.length - 1);
    
    // Animasyonları göster
    for (let i = 0; i < animations.length; i++) {
      const { indices, type } = animations[i];
      
      stepCount++;
      setCurrentStep(stepCount);
      
      if (type === 'compare') {
        const [idx1, idx2] = indices;
        
        // Karşılaştırılan elemanları vurgula
        setExplanationText(`Adım ${stepCount}: ${arr[idx1]} ve ${arr[idx2]} karşılaştırılıyor`);
        
        // İndeksler dizi sınırları içinde olmalı
        if (idx1 < arr.length && idx2 < arr.length) {
          await Promise.all([
            animateColor(idx1, 1),
            animateColor(idx2, 1),
          ]);
          
          // Normal renklere dön
          await Promise.all([
            animateColor(idx1, 0),
            animateColor(idx2, 0),
          ]);
        }
      } else if (type === 'overwrite') {
        const [idx, value] = indices;
        
        if (idx < arr.length) {
          // Değeri üzerine yaz
          setExplanationText(`Adım ${stepCount}: İndeks ${idx}'e ${value} değeri yerleştiriliyor`);
          
          // Takas rengini ayarla
          await animateColor(idx, 2);
          
          // Diziyi güncelle
          arr[idx] = value;
          setArray([...arr]);
          
          // Normal renge dön
          await animateColor(idx, 0);
        }
      }
    }
    
    // Tüm diziyi sıralanmış olarak işaretle
    for (let i = 0; i < n; i++) {
      await animateColor(i, 3, 100);
    }
    
    setExplanationText('Merge Sort tamamlandı! Dizi sıralandı.');
    setSorting(false);
  };
  
  // Quick Sort algoritması için görselleştirme
  const visualizeQuickSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    const arr = [...array];
    const n = arr.length;
    let stepCount = 0;
    const steps = Math.ceil(n * Math.log2(n)); // Quick Sort adım sayısı tahmini (ortalaması)
    setTotalSteps(steps);
    
    setExplanationText('Quick Sort, bir pivot eleman seçerek diziyi bu pivottan küçük ve büyük olarak ikiye böler ve her bir alt diziyi tekrar sıralar.');
    
    // Quick Sort fonksiyonu
    const quickSort = async (arr: number[], low: number, high: number) => {
      if (low < high) {
        // Partition indeksini bul
        const pi = await partition(arr, low, high);
        
        // Pivotun solundaki ve sağındaki alt dizileri sırala
        await quickSort(arr, low, pi - 1);
        await quickSort(arr, pi + 1, high);
      }
    };
    
    // Partition fonksiyonu
    const partition = async (arr: number[], low: number, high: number): Promise<number> => {
      // Pivot olarak en sağdaki elemanı seç
      const pivot = arr[high];
      
      // Pivot elemanı vurgula
      setExplanationText(`Pivot eleman seçildi: ${pivot}`);
      await animateColor(high, 2, 500);
      
      let i = low - 1; // Küçük elemanların sınırı
      
      for (let j = low; j < high; j++) {
        stepCount++;
        setCurrentStep(stepCount);
        
        // Karşılaştırılan elemanları vurgula
        setExplanationText(`Adım ${stepCount}: ${arr[j]} ve pivot ${pivot} karşılaştırılıyor`);
        await Promise.all([
          animateColor(j, 1),
          animateColor(high, 2), // Pivot zaten kırmızı ama yineleyelim
        ]);
        
        if (arr[j] <= pivot) {
          // Mevcut elemanı pivot'tan küçük veya eşit ise, i sınırını ilerlet ve takas et
          i++;
          
          if (i !== j) {
            setExplanationText(`${arr[j]} <= ${pivot}, değerleri takas ediliyor`);
            
            // Takas işlemi
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
            
            // Takas animasyonu
            await animateSwap(i, j);
            setArray([...arr]);
          }
        }
        
        // Normal renklere dön, ancak pivot kırmızı kalacak
        await animateColor(j, 0);
      }
      
      // Pivot elemanı (yüksek) i+1 konumundaki elemanla değiştir
      if (i + 1 !== high) {
        const temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        
        setExplanationText(`Pivot eleman ${pivot} doğru konumuna yerleştiriliyor`);
        
        // Takas animasyonu
        await animateSwap(i + 1, high);
        setArray([...arr]);
      }
      
      // Pivot'u sıralanmış olarak işaretle
      await animateColor(i + 1, 3);
      
      return i + 1;
    };
    
    // Quick Sort'u başlat
    await quickSort(arr, 0, arr.length - 1);
    
    // Tüm diziyi sıralanmış olarak işaretle
    for (let i = 0; i < n; i++) {
      try {
        if (barColors.current && barColors.current[i] && 
            (barColors.current[i] as any).__getValue && 
            (barColors.current[i] as any).__getValue() !== 3) {
          await animateColor(i, 3, 100);
        }
      } catch (error) {
        // Hata oluşursa tüm elemanları sıralanmış olarak işaretlemeye devam et
        await animateColor(i, 3, 100);
      }
    }
    
    setExplanationText('Quick Sort tamamlandı! Dizi sıralandı.');
    setSorting(false);
  };
  
  // Algoritma tipine göre doğru görselleştirmeyi çağır
  const startVisualization = () => {
    if (sorting) return;
    
    // Tüm renkleri sıfırla
    if (barColors.current) {
      barColors.current.forEach((color, index) => {
        if (color) {
          color.setValue(0);
        }
      });
    }
    
    switch (algorithmType.toLowerCase()) {
      case 'bubble sort':
      case 'kabarcık sıralama':
      case 'kabarcık sıralaması':
        visualizeBubbleSort();
        break;
      case 'binary search':
      case 'ikili arama':
      case 'binary arama':
        visualizeBinarySearch();
        break;
      case 'merge sort':
      case 'birleştirme sıralaması':
      case 'merge sıralama':
        visualizeMergeSort();
        break;
      case 'quick sort':
      case 'hızlı sıralama':
      case 'quicksort':
        visualizeQuickSort();
        break;
      case 'linear search':
      case 'doğrusal arama':
      case 'sıralı arama':
        visualizeLinearSearch();
        break;
      case 'selection sort':
      case 'seçim sıralaması':
      case 'seçmeli sıralama':
        visualizeSelectionSort();
        break;
      case 'insertion sort':
      case 'ekleme sıralaması':
      case 'yerleştirme sıralaması':
        visualizeInsertionSort();
        break;
      case 'heap sort':
      case 'yığın sıralaması':
        visualizeHeapSort();
        break;
      case 'counting sort':
      case 'sayma sıralaması':
        visualizeCountingSort();
        break;
      case 'radix sort':
      case 'taban sıralaması':
        visualizeRadixSort();
        break;
      case 'shell sort':
      case 'kabuk sıralaması':
        visualizeShellSort();
        break;
      default:
        setExplanationText(`${algorithmType} algoritması için görselleştirme henüz uygulanmadı. Mevcut algoritmalar: Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort, Linear Search, Binary Search`);
        break;
    }
  };
  
  // Linear Search algoritması için görselleştirme
  const visualizeLinearSearch = async () => {
    if (sorting) return;
    
    // Hedef değeri kontrol et
    if (!searchTarget.trim()) {
      Alert.alert('Hata', 'Lütfen aranacak sayıyı girin.');
      return;
    }
    
    const target = parseInt(searchTarget.trim());
    if (isNaN(target)) {
      Alert.alert('Hata', 'Lütfen geçerli bir sayı girin.');
      return;
    }
    
    setSorting(true);
    setCurrentStep(0);
    
    const arr = [...array];
    const n = arr.length;
    
    setExplanationText(`Linear Search: ${target} değeri aranıyor.`);
    
    // Adım sayısını belirle
    setTotalSteps(n);
    
    let found = false;
    
    // Diziyi soldan sağa tarama
    for (let i = 0; i < n; i++) {
      // Mevcut elemanı vurgula
      setCurrentStep(i + 1);
      setExplanationText(`Adım ${i + 1}: ${arr[i]} elemanı kontrol ediliyor...`);
      
      // Elemanı vurgula
      await animateColor(i, 1, 300);
      
      if (arr[i] === target) {
        // Eleman bulundu
        setExplanationText(`${target} değeri ${i}. indekste bulundu!`);
        await animateColor(i, 3, 500); // Bulunan eleman yeşil renkte vurgulanır
        found = true;
        break;
      }
      
      // Eleman bulunamadı, bir sonraki elemana geç
      await animateColor(i, 0, 200);
    }
    
    if (!found) {
      setExplanationText(`${target} değeri dizide bulunamadı.`);
    }
    
    setSorting(false);
  };
  
  // Selection Sort algoritması için görselleştirme
  const visualizeSelectionSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    try {
      const newArray = [...array];
      const n = newArray.length;
      let totalSwaps = 0;
      let totalComparisons = 0;
      
      // Toplam adım sayısını hesapla
      setTotalSteps(n - 1);
      
      setExplanationText('Selection Sort algoritması başlatılıyor. Her adımda kalan elemanlar arasından en küçüğünü bulup doğru pozisyona yerleştirir.');
      
      for (let i = 0; i < n - 1; i++) {
        let minIndex = i;
        setCurrentStep(i + 1);
        setExplanationText(`${i + 1}. geçiş: ${i + 1}. pozisyon için en küçük eleman aranıyor...`);
        
        // Mevcut minimum elemanı vurgula
        await animateColor(minIndex, 1);
        await new Promise(resolve => setTimeout(resolve, speed / 3));
        
        for (let j = i + 1; j < n; j++) {
          totalComparisons++;
          
          // Karşılaştırılan elemanı vurgula
          await animateColor(j, 2);
          setExplanationText(`Minimum ${newArray[minIndex]} ile ${newArray[j]} karşılaştırılıyor... (${totalComparisons}. karşılaştırma)`);
          
          await new Promise(resolve => setTimeout(resolve, speed / 2));
          
          if (newArray[j] < newArray[minIndex]) {
            // Önceki minimum elemanı normal renge döndür
            await animateColor(minIndex, 0);
            minIndex = j;
            // Yeni minimum elemanı vurgula
            await animateColor(minIndex, 1);
            setExplanationText(`Yeni minimum bulundu: ${newArray[minIndex]} (pozisyon ${j + 1})`);
            await new Promise(resolve => setTimeout(resolve, speed / 3));
          }
          
          // Karşılaştırılan elemanı normal renge döndür
          await animateColor(j, 0);
        }
        
        // Minimum elemanı doğru pozisyona taşı
        if (minIndex !== i) {
          totalSwaps++;
          
          // Takas animasyonu
          await Promise.all([
            animateColor(i, 2),
            animateColor(minIndex, 2),
          ]);
          
          setExplanationText(`${newArray[i]} ile ${newArray[minIndex]} takas ediliyor... (${totalSwaps}. takas)`);
          
          await new Promise(resolve => setTimeout(resolve, speed / 3));
          
          // Değerleri takas et
          const temp = newArray[i];
          newArray[i] = newArray[minIndex];
          newArray[minIndex] = temp;
          
          // Takas animasyonunu göster
          await animateSwap(i, minIndex);
          
          // Diziyi güncelle
          setArray([...newArray]);
          
          await new Promise(resolve => setTimeout(resolve, speed / 4));
        } else {
          setExplanationText(`${newArray[i]} zaten doğru pozisyonda, takas gerekmiyor.`);
          await new Promise(resolve => setTimeout(resolve, speed / 3));
        }
        
        // Sıralanmış elemanı işaretle
        await animateColor(i, 3);
        setExplanationText(`${i + 1}. geçiş tamamlandı. ${newArray[i]} doğru konumuna yerleşti.`);
        
        // Geçişler arası kısa bekle
        await new Promise(resolve => setTimeout(resolve, speed / 3));
      }
      
      // Son elemanı da sıralanmış olarak işaretle
      await animateColor(n - 1, 3);
      
      setExplanationText(`Selection Sort tamamlandı! Toplam ${totalSwaps} takas ve ${totalComparisons} karşılaştırma yapıldı. Dizi başarıyla sıralandı.`);
    } catch (error) {
      console.error("Selection Sort sırasında hata:", error);
      setExplanationText("Görselleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSorting(false);
    }
  };
  
  // Insertion Sort algoritması için görselleştirme
  const visualizeInsertionSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    const arr = [...array];
    const n = arr.length;
    let stepCount = 0;
    const steps = n * (n - 1) / 2; // Worst case adım sayısı tahmini
    setTotalSteps(steps);
    
    setExplanationText('Insertion Sort, sıralanmış alt dizi oluşturarak her yeni elemanı doğru konuma yerleştirir.');
    
    // İlk eleman başlangıçta sıralanmış kabul edilir
    await animateColor(0, 3);
    
    for (let i = 1; i < n; i++) {
      // Şu anki elemanı vurgula
      await animateColor(i, 2);
      setExplanationText(`${arr[i]} elemanı sıralanmış alt diziye yerleştirilecek.`);
      await new Promise(resolve => setTimeout(resolve, speed));
      
      // Mevcut elemanı key olarak al
      const key = arr[i];
      let j = i - 1;
      
      // key'den büyük olan elemanları bir pozisyon sağa kaydır
      while (j >= 0 && arr[j] > key) {
        stepCount++;
        setCurrentStep(stepCount);
        
        // Karşılaştırma yapılıyor
        setExplanationText(`Adım ${stepCount}: ${arr[j]} > ${key}, ${arr[j]} elemanı sağa kaydırılıyor`);
        
        // Elemanı vurgula
        await animateColor(j, 1);
        
        // Elemanı bir sağa kaydır
        arr[j + 1] = arr[j];
        
        // Kaydırma animasyonunu göster (sağa kaydırma)
        await animateSwap(j, j + 1);
        
        // Diziyi güncelle
        setArray([...arr]);
        
        j--;
      }
      
      // Doğru konuma yerleştir
      arr[j + 1] = key;
      
      // Sıraya giren elemanları işaretle
      for (let k = 0; k <= i; k++) {
        await animateColor(k, 3);
      }
    }
    
    setExplanationText('Insertion Sort tamamlandı! Dizi sıralandı.');
    setSorting(false);
  };

  // Heap Sort algoritması için görselleştirme
  const visualizeHeapSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    try {
      const arr = [...array];
      const n = arr.length;
      let stepCount = 0;
      setTotalSteps(n * Math.log2(n));
      
      setExplanationText('Heap Sort algoritması başlatılıyor. Önce max heap oluşturulacak, sonra elemanlar tek tek çıkarılacak.');
      
      // Max heap oluştur
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(arr, n, i, stepCount);
        stepCount++;
        setCurrentStep(stepCount);
      }
      
      setExplanationText('Max heap oluşturuldu. Şimdi elemanlar tek tek çıkarılacak.');
      
      // Elemanları tek tek çıkar
      for (let i = n - 1; i > 0; i--) {
        // Kök ile son elemanı takas et
        await Promise.all([
          animateColor(0, 2),
          animateColor(i, 2),
        ]);
        
        setExplanationText(`En büyük eleman ${arr[0]} son pozisyona taşınıyor...`);
        
        const temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
        
        await animateSwap(0, i);
        setArray([...arr]);
        
        // Sıralanmış elemanı işaretle
        await animateColor(i, 3);
        
        // Kalan heap'i düzenle
        await heapify(arr, i, 0, stepCount);
        stepCount++;
        setCurrentStep(stepCount);
      }
      
      // İlk elemanı da sıralanmış olarak işaretle
      await animateColor(0, 3);
      
      setExplanationText('Heap Sort tamamlandı! Dizi başarıyla sıralandı.');
    } catch (error) {
      console.error("Heap Sort sırasında hata:", error);
      setExplanationText("Görselleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSorting(false);
    }
  };
  
  // Heapify yardımcı fonksiyonu
  const heapify = async (arr: number[], n: number, i: number, stepCount: number) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    // Sol çocuk kökten büyükse
    if (left < n && arr[left] > arr[largest]) {
      largest = left;
    }
    
    // Sağ çocuk şu anki en büyükten büyükse
    if (right < n && arr[right] > arr[largest]) {
      largest = right;
    }
    
    // En büyük kök değilse
    if (largest !== i) {
      await Promise.all([
        animateColor(i, 1),
        animateColor(largest, 1),
      ]);
      
      const temp = arr[i];
      arr[i] = arr[largest];
      arr[largest] = temp;
      
      await animateSwap(i, largest);
      
      // Etkilenen alt ağacı da düzenle
      await heapify(arr, n, largest, stepCount);
    }
  };

  // Counting Sort algoritması için görselleştirme
  const visualizeCountingSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    try {
      const arr = [...array];
      const n = arr.length;
      const max = Math.max(...arr);
      const min = Math.min(...arr);
      const range = max - min + 1;
      
      setTotalSteps(n + range);
      setExplanationText(`Counting Sort başlatılıyor. Değer aralığı: ${min}-${max}`);
      
      // Sayma dizisini oluştur
      const count = new Array(range).fill(0);
      
      // Her elemanın sayısını say
      for (let i = 0; i < n; i++) {
        await animateColor(i, 1);
        count[arr[i] - min]++;
        setExplanationText(`${arr[i]} değeri sayılıyor... (${count[arr[i] - min]}. kez)`);
        setCurrentStep(i + 1);
        await new Promise(resolve => setTimeout(resolve, speed / 2));
        await animateColor(i, 0);
      }
      
      setExplanationText('Sayma tamamlandı. Şimdi sıralı dizi oluşturuluyor...');
      
      // Sıralı diziyi oluştur
      const sortedArr = [];
      let step = n;
      
      for (let i = 0; i < range; i++) {
        while (count[i] > 0) {
          sortedArr.push(i + min);
          count[i]--;
          step++;
          setCurrentStep(step);
        }
      }
      
      // Diziyi güncelle ve animasyon göster
      for (let i = 0; i < n; i++) {
        arr[i] = sortedArr[i];
        await animateColor(i, 3);
        setArray([...arr]);
        await new Promise(resolve => setTimeout(resolve, speed / 3));
      }
      
      setExplanationText('Counting Sort tamamlandı! Dizi O(n+k) zamanda sıralandı.');
    } catch (error) {
      console.error("Counting Sort sırasında hata:", error);
      setExplanationText("Görselleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSorting(false);
    }
  };

  // Radix Sort algoritması için görselleştirme
  const visualizeRadixSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    try {
      const arr = [...array];
      const n = arr.length;
      const max = Math.max(...arr);
      
      // Maksimum basamak sayısını bul
      const maxDigits = max.toString().length;
      setTotalSteps(maxDigits * n);
      
      setExplanationText(`Radix Sort başlatılıyor. Maksimum ${maxDigits} basamak işlenecek.`);
      
      // Her basamak için counting sort uygula
      for (let digit = 0; digit < maxDigits; digit++) {
        setExplanationText(`${digit + 1}. basamak (${Math.pow(10, digit)}ler) işleniyor...`);
        
        await countingSortByDigit(arr, digit);
        
        // Ara sonucu göster
        for (let i = 0; i < n; i++) {
          await animateColor(i, 1);
          await new Promise(resolve => setTimeout(resolve, speed / 4));
          await animateColor(i, 0);
        }
      }
      
      // Tüm elemanları sıralanmış olarak işaretle
      for (let i = 0; i < n; i++) {
        await animateColor(i, 3);
      }
      
      setExplanationText('Radix Sort tamamlandı! Dizi basamak basamak sıralandı.');
    } catch (error) {
      console.error("Radix Sort sırasında hata:", error);
      setExplanationText("Görselleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSorting(false);
    }
  };
  
  // Belirli bir basamağa göre counting sort
  const countingSortByDigit = async (arr: number[], digit: number) => {
    const n = arr.length;
    const output = new Array(n);
    const count = new Array(10).fill(0);
    
    // Basamak değerlerini say
    for (let i = 0; i < n; i++) {
      const digitValue = Math.floor(arr[i] / Math.pow(10, digit)) % 10;
      count[digitValue]++;
    }
    
    // Kümülatif sayıları hesapla
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }
    
    // Çıktı dizisini oluştur
    for (let i = n - 1; i >= 0; i--) {
      const digitValue = Math.floor(arr[i] / Math.pow(10, digit)) % 10;
      output[count[digitValue] - 1] = arr[i];
      count[digitValue]--;
    }
    
    // Orijinal diziye kopyala
    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
    }
    
    setArray([...arr]);
  };

  // Shell Sort algoritması için görselleştirme
  const visualizeShellSort = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    try {
      const arr = [...array];
      const n = arr.length;
      let stepCount = 0;
      
      setTotalSteps(n * Math.log2(n));
      setExplanationText('Shell Sort başlatılıyor. Azalan aralıklarla insertion sort uygulanacak.');
      
      // Aralığı n/2'den başlat ve her seferinde yarıya böl
      for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        setExplanationText(`Aralık: ${gap} - Bu aralıkla insertion sort uygulanıyor...`);
        
        // Gap kadar aralıklı insertion sort
        for (let i = gap; i < n; i++) {
          const temp = arr[i];
          let j = i;
          
          await animateColor(i, 2);
          setExplanationText(`${temp} elemanı ${gap} aralıklı sıralamada yerleştiriliyor...`);
          
          while (j >= gap && arr[j - gap] > temp) {
            stepCount++;
            setCurrentStep(stepCount);
            
            await Promise.all([
              animateColor(j, 1),
              animateColor(j - gap, 1),
            ]);
            
            arr[j] = arr[j - gap];
            await animateSwap(j - gap, j);
            setArray([...arr]);
            
            j -= gap;
            
            await Promise.all([
              animateColor(j + gap, 0),
              animateColor(j, 0),
            ]);
          }
          
          arr[j] = temp;
          await animateColor(i, 0);
          setArray([...arr]);
        }
        
        setExplanationText(`Aralık ${gap} tamamlandı.`);
        await new Promise(resolve => setTimeout(resolve, speed));
      }
      
      // Tüm elemanları sıralanmış olarak işaretle
      for (let i = 0; i < n; i++) {
        await animateColor(i, 3);
      }
      
      setExplanationText('Shell Sort tamamlandı! Dizi azalan aralıklarla sıralandı.');
    } catch (error) {
      console.error("Shell Sort sırasında hata:", error);
      setExplanationText("Görselleştirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSorting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.visualizationTitle}>{title} Görselleştirmesi</Text>
      
      {/* Algoritma bilgi kartı */}
      <AlgorithmInfoCard algorithmType={algorithmType} />
      
      {/* Arama algoritmaları için input alanı */}
      {(algorithmType.toLowerCase().includes('search') || algorithmType.toLowerCase().includes('arama')) && (
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchInputLabel}>Aranacak Sayı:</Text>
          <TextInput
            style={styles.searchInput}
            value={searchTarget}
            onChangeText={setSearchTarget}
            placeholder="Örn: 42"
            keyboardType="numeric"
            editable={!sorting}
          />
        </View>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, sorting && styles.disabledButton]}
          onPress={startVisualization}
          disabled={sorting}
        >
          <Text style={styles.buttonText}>Başlat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, sorting && styles.disabledButton]}
          onPress={resetArray}
          disabled={sorting}
        >
          <Text style={styles.buttonText}>Yeni Dizi</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.speedControl}>
        <Text style={styles.speedText}>Hız: </Text>
        <TouchableOpacity
          style={[styles.speedButton, speed === 1000 && styles.activeSpeedButton]}
          onPress={() => setSpeed(1000)}
          disabled={sorting}
        >
          <Text style={styles.speedButtonText}>Yavaş</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.speedButton, speed === 500 && styles.activeSpeedButton]}
          onPress={() => setSpeed(500)}
          disabled={sorting}
        >
          <Text style={styles.speedButtonText}>Orta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.speedButton, speed === 250 && styles.activeSpeedButton]}
          onPress={() => setSpeed(250)}
          disabled={sorting}
        >
          <Text style={styles.speedButtonText}>Hızlı</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal style={styles.visualizationContainer}>
        <View style={styles.barContainer}>
          {array.map((value, index) => (
            <Animated.View
              key={`bar-${index}`}
              style={[
                styles.bar,
                {
                  height: (value / 100) * MAX_BAR_HEIGHT,
                  backgroundColor: getBarColor(index),
                  transform: [{ translateX: barRefs.current && barRefs.current[index] ? barRefs.current[index] : new Animated.Value(0) }],
                },
              ]}
            >
              <Text style={styles.barText}>{value}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.explanationContainer}>
        <Text style={styles.explanationText}>{explanationText}</Text>
        {totalSteps > 0 && (
          <Text style={styles.stepCounter}>
            Adım: {currentStep} / {totalSteps}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  visualizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 10,
  },
  button: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a29bfe',
    opacity: 0.7,
  },
  visualizationContainer: {
    height: MAX_BAR_HEIGHT + 50,
    marginBottom: 15,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT + 30,
    paddingBottom: 10,
  },
  bar: {
    width: BAR_WIDTH,
    marginHorizontal: BAR_MARGIN,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
  },
  barText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  explanationContainer: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    minHeight: 60,
  },
  explanationText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  stepCounter: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  speedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  speedText: {
    fontSize: 14,
    color: '#2c3e50',
    marginRight: 10,
  },
  speedButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#f1f2f6',
    marginHorizontal: 5,
  },
  activeSpeedButton: {
    backgroundColor: '#6c5ce7',
  },
  speedButtonText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  searchInputLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginRight: 10,
    fontWeight: '500',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'white',
    minWidth: 80,
    textAlign: 'center',
  },
});

export default AlgorithmVisualization;