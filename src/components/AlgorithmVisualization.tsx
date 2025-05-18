import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
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
    
    const arr = [...array];
    const n = arr.length;
    let stepCount = 0;
    const steps = n * (n - 1) / 2; // Worst case adım sayısı
    setTotalSteps(steps);
    
    setExplanationText('Bubble Sort algoritması, her geçişte komşu elemanları karşılaştırarak büyük değerleri dizinin sonuna doğru "kabarcık" gibi yükseltir.');
    
    for (let i = 0; i < n; i++) {
      let swapped = false;
      
      for (let j = 0; j < n - i - 1; j++) {
        // İki elemanı karşılaştır
        setCurrentStep(++stepCount);
        setExplanationText(`Adım ${stepCount}: ${arr[j]} ve ${arr[j + 1]} karşılaştırılıyor`);
        
        // Karşılaştırma rengini ayarla
        await Promise.all([
          animateColor(j, 1),
          animateColor(j + 1, 1),
        ]);
        
        if (arr[j] > arr[j + 1]) {
          // Takaslama rengini ayarla
          await Promise.all([
            animateColor(j, 2),
            animateColor(j + 1, 2),
          ]);
          
          setExplanationText(`${arr[j]} > ${arr[j + 1]}, değerleri takas ediliyor`);
          
          // Değerleri takas et
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          
          // Takas animasyonunu göster
          await animateSwap(j, j + 1);
          
          // Diziyi güncelle
          setArray([...arr]);
          swapped = true;
        }
        
        // Normal renklere dön
        await Promise.all([
          animateColor(j, 0),
          animateColor(j + 1, 0),
        ]);
      }
      
      // Geçiş tamamlandı, en sondaki eleman artık sıralanmış durumda
      await animateColor(n - i - 1, 3);
      
      // Herhangi bir takas yapılmadıysa dizi sıralanmış demektir
      if (!swapped) {
        break;
      }
    }
    
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
    
    setExplanationText('Bubble Sort tamamlandı! Dizi sıralandı.');
    setSorting(false);
  };
  
  // Binary Search algoritması için görselleştirme
  const visualizeBinarySearch = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    // Önce sıralı bir dizi oluştur
    const sortedArr = [...array].sort((a, b) => a - b);
    setArray(sortedArr);
    
    // Rastgele bir hedef değer seç (dizide var olan bir değer)
    const target = sortedArr[Math.floor(Math.random() * sortedArr.length)];
    setExplanationText(`Binary Search: ${target} değeri aranıyor. Binary Search sıralı bir dizide çalışır.`);
    
    let left = 0;
    let right = sortedArr.length - 1;
    let step = 0;
    let found = false;
    
    while (left <= right) {
      step++;
      setCurrentStep(step);
      
      // Tüm elemanları normal renge ayarla
      for (let i = 0; i < sortedArr.length; i++) {
        await animateColor(i, 0, 100);
      }
      
      // Arama aralığını vurgula
      for (let i = left; i <= right; i++) {
        await animateColor(i, 1, 100);
      }
      
      const mid = Math.floor((left + right) / 2);
      setExplanationText(`Adım ${step}: Orta nokta: ${sortedArr[mid]}, Hedef: ${target}`);
      
      // Orta noktayı vurgula
      await animateColor(mid, 2, 300);
      
      if (sortedArr[mid] === target) {
        // Bulundu
        await animateColor(mid, 3, 500);
        setExplanationText(`${target} değeri dizide bulundu! İndeks: ${mid}`);
        found = true;
        break;
      } else if (sortedArr[mid] < target) {
        // Sağ yarıda ara
        left = mid + 1;
        setExplanationText(`${sortedArr[mid]} < ${target}, sağ yarıda aramaya devam ediliyor.`);
      } else {
        // Sol yarıda ara
        right = mid - 1;
        setExplanationText(`${sortedArr[mid]} > ${target}, sol yarıda aramaya devam ediliyor.`);
      }
      
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    
    if (!found) {
      setExplanationText(`${target} değeri dizide bulunamadı.`);
    }
    
    setSorting(false);
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
    
    switch (algorithmType.toLowerCase()) {
      case 'bubble sort':
        visualizeBubbleSort();
        break;
      case 'binary search':
        visualizeBinarySearch();
        break;
      case 'merge sort':
        visualizeMergeSort();
        break;
      case 'quick sort':
        visualizeQuickSort();
        break;
      case 'linear search':
        visualizeLinearSearch();
        break;
      case 'selection sort':
        visualizeSelectionSort();
        break;
      case 'insertion sort':
        visualizeInsertionSort();
        break;
      default:
        setExplanationText(`${algorithmType} için görselleştirme henüz uygulanmadı.`);
        break;
    }
  };
  
  // Linear Search algoritması için görselleştirme
  const visualizeLinearSearch = async () => {
    if (sorting) return;
    setSorting(true);
    setCurrentStep(0);
    
    const arr = [...array];
    const n = arr.length;
    
    // Rastgele bir hedef değer seç (dizide var olan bir değer)
    const target = arr[Math.floor(Math.random() * arr.length)];
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
    
    const arr = [...array];
    const n = arr.length;
    let stepCount = 0;
    const steps = n * (n - 1) / 2; // Toplam karşılaştırma sayısı
    setTotalSteps(steps);
    
    setExplanationText('Selection Sort, her adımda dizideki en küçük elemanı bulup uygun konuma yerleştirir.');
    
    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;
      
      // Dizinin kalan kısmındaki en küçük elemanı bul
      for (let j = i + 1; j < n; j++) {
        stepCount++;
        setCurrentStep(stepCount);
        
        // Mevcut elemanla karşılaştırılacak
        setExplanationText(`Adım ${stepCount}: Minimum değeri bulma - ${arr[j]} ve ${arr[minIndex]} karşılaştırılıyor`);
        
        // Karşılaştırılan elemanları vurgula
        await Promise.all([
          animateColor(j, 1),
          animateColor(minIndex, minIndex === i ? 2 : 1) // Geçici minimum değeri kırmızı vurgula
        ]);
        
        if (arr[j] < arr[minIndex]) {
          // Daha küçük bir eleman bulundu
          await animateColor(minIndex, 0); // Eski minimumu normale döndür
          minIndex = j;
          setExplanationText(`Yeni minimum değer bulundu: ${arr[minIndex]}`);
          await animateColor(minIndex, 2); // Yeni minimumu kırmızı vurgula
        } else {
          // Mevcut eleman minimum değilse normale döndür
          await animateColor(j, 0);
        }
      }
      
      // Minimum elemanı doğru konuma taşı
      if (minIndex !== i) {
        setExplanationText(`${arr[minIndex]} değeri ${i}. konuma taşınıyor`);
        
        // Değerleri takas et
        const temp = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = temp;
        
        // Takas animasyonunu göster
        await animateSwap(i, minIndex);
        
        // Diziyi güncelle
        setArray([...arr]);
      }
      
      // Sıralanan elemanı yeşil olarak işaretle
      await animateColor(i, 3);
    }
    
    // Son eleman da sıralanmış kabul edilir
    await animateColor(n - 1, 3);
    
    setExplanationText('Selection Sort tamamlandı! Dizi sıralandı.');
    setSorting(false);
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
  
  return (
    <View style={styles.container}>
      <Text style={styles.visualizationTitle}>{title} Görselleştirmesi</Text>
      
      {/* Algoritma bilgi kartı */}
      <AlgorithmInfoCard algorithmType={algorithmType} />
      
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
});

export default AlgorithmVisualization; 