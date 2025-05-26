# Algoritma Görselleştirmesi Bileşenleri

Bu dizin, algoritma görselleştirme bileşenlerini içerir.

## Bileşenler

### AlgorithmVisualization

Ana algoritma görselleştirme bileşenidir. Aşağıdaki algoritmaları destekler:

- Sıralama Algoritmaları:
  - Bubble Sort
  - Selection Sort
  - Insertion Sort
  - Merge Sort
  - Quick Sort
  - Heap Sort
  - Counting Sort
  - Radix Sort
  - Shell Sort

- Arama Algoritmaları:
  - Linear Search
  - Binary Search

- Veri Yapıları:
  - Tek Yönlü Bağlı Liste (Singly Linked List)
  - Çift Yönlü Bağlı Liste (Doubly Linked List)

### CircularLinkedListVisualization

Dairesel bağlı liste (Circular Linked List) görselleştirmesi için ayrı bir bileşendir. Bu bileşen, dairesel bağlı liste veri yapısının temel özelliklerini ve operasyonlarını görselleştirir.

## Kullanım

```jsx
import React from 'react';
import { AlgorithmVisualization, CircularLinkedListVisualization } from './components';

const App = () => {
  return (
    <div>
      {/* Sıralama algoritması görselleştirmesi */}
      <AlgorithmVisualization 
        algorithmType="Bubble Sort" 
        title="Kabarcık Sıralaması" 
        animationSpeed={500} 
      />
      
      {/* Arama algoritması görselleştirmesi */}
      <AlgorithmVisualization 
        algorithmType="Binary Search" 
        title="İkili Arama" 
        animationSpeed={500} 
      />
      
      {/* Tek Yönlü Bağlı Liste görselleştirmesi */}
      <AlgorithmVisualization 
        algorithmType="Singly Linked List" 
        title="Tek Yönlü Bağlı Liste" 
        animationSpeed={500} 
      />
      
      {/* Çift Yönlü Bağlı Liste görselleştirmesi */}
      <AlgorithmVisualization 
        algorithmType="Doubly Linked List" 
        title="Çift Yönlü Bağlı Liste" 
        animationSpeed={500} 
      />
      
      {/* Dairesel Bağlı Liste görselleştirmesi */}
      <CircularLinkedListVisualization 
        title="Dairesel Bağlı Liste" 
        animationSpeed={500} 
      />
    </div>
  );
};

export default App;
```

## Props

### AlgorithmVisualization Props

| Prop | Tip | Açıklama |
|------|-----|----------|
| algorithmType | string | Görselleştirilecek algoritmanın tipi |
| title | string | Görselleştirme başlığı |
| animationSpeed | number | Animasyon hızı (milisaniye) |
| customArray | number[] | İsteğe bağlı özel dizi |

### CircularLinkedListVisualization Props

| Prop | Tip | Açıklama |
|------|-----|----------|
| title | string | Görselleştirme başlığı |
| animationSpeed | number | Animasyon hızı (milisaniye) |
| customArray | number[] | İsteğe bağlı özel dizi | 