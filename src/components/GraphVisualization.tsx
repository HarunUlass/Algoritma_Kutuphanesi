import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { AlgorithmInfoCard } from './VisualizationHelpers';

// Graf görselleştirmesi için veri tipleri
interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
  color?: string;
  distance?: number; // Dijkstra için mesafe
}

interface Edge {
  source: number;
  target: number;
  weight: number;
  color?: string;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

interface GraphVisualizationProps {
  algorithmType: string;
  title: string;
  customGraph?: Graph;
  animationSpeed?: number;
}

// Sabitler
const DEFAULT_ANIMATION_SPEED = 1000; // ms
const NODE_RADIUS = 20;
const EDGE_WIDTH = 2;

// Örnek graf oluştur
const createExampleGraph = (): Graph => {
  const width = Dimensions.get('window').width - 60;
  const height = 300;
  
  // Düğümleri dengeli bir şekilde yerleştirme
  const nodes: Node[] = [
    { id: 0, x: width * 0.2, y: height * 0.3, label: 'A', distance: Infinity },
    { id: 1, x: width * 0.5, y: height * 0.2, label: 'B', distance: Infinity },
    { id: 2, x: width * 0.8, y: height * 0.3, label: 'C', distance: Infinity },
    { id: 3, x: width * 0.1, y: height * 0.6, label: 'D', distance: Infinity },
    { id: 4, x: width * 0.4, y: height * 0.7, label: 'E', distance: Infinity },
    { id: 5, x: width * 0.7, y: height * 0.6, label: 'F', distance: Infinity },
  ];
  
  // Kenarlar (ağırlıklı)
  const edges: Edge[] = [
    { source: 0, target: 1, weight: 4 },
    { source: 0, target: 3, weight: 2 },
    { source: 1, target: 2, weight: 3 },
    { source: 1, target: 4, weight: 3 },
    { source: 2, target: 5, weight: 2 },
    { source: 3, target: 4, weight: 6 },
    { source: 4, target: 5, weight: 1 },
  ];
  
  return { nodes, edges };
};

// Ana graf görselleştirme bileşeni
const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  algorithmType,
  title,
  customGraph,
  animationSpeed = DEFAULT_ANIMATION_SPEED,
}) => {
  const [graph, setGraph] = useState<Graph>(customGraph || createExampleGraph());
  const [processing, setProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(animationSpeed);
  const [explanationText, setExplanationText] = useState<string>('Görselleştirmeyi başlatmak için "Başlat" düğmesine tıklayın.');
  const [sourceNode, setSourceNode] = useState<number>(0); // Başlangıç düğümü seçimi

  // Renkler
  const normalNodeColor = '#6c5ce7';
  const startNodeColor = '#27ae60';
  const visitedNodeColor = '#3498db';
  const currentNodeColor = '#e74c3c';
  const shortestPathColor = '#f1c40f';
  
  const normalEdgeColor = '#95a5a6';
  const activeEdgeColor = '#e74c3c';
  const shortestPathEdgeColor = '#f1c40f';
  
  // Yeni bir graf oluştur
  const resetGraph = () => {
    if (processing) return;
    setGraph(createExampleGraph());
    setCurrentStep(0);
    setTotalSteps(0);
    setExplanationText('Görselleştirmeyi başlatmak için "Başlat" düğmesine tıklayın.');
  };
  
  // Bekleme yardımcı fonksiyonu
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Dijkstra algoritması animasyonu
  const visualizeDijkstra = async () => {
    if (processing) return;
    setProcessing(true);
    setCurrentStep(0);
    
    // Grafı kopyala
    const newGraph = JSON.parse(JSON.stringify(graph)) as Graph;
    
    // Düğümleri sıfırla
    newGraph.nodes.forEach(node => {
      node.distance = Infinity;
      node.color = normalNodeColor;
    });
    
    // Kenarları sıfırla
    newGraph.edges.forEach(edge => {
      edge.color = normalEdgeColor;
    });
    
    // Başlangıç düğümünü ayarla
    newGraph.nodes[sourceNode].distance = 0;
    newGraph.nodes[sourceNode].color = startNodeColor;
    
    setGraph(newGraph);
    setExplanationText(`Dijkstra algoritması başlangıç düğümü: ${newGraph.nodes[sourceNode].label}`);
    await wait(speed);
    
    // Toplam adım sayısı (temsili)
    const steps = newGraph.nodes.length * 2;
    setTotalSteps(steps);
    
    // Dijkstra algoritması
    const distances: number[] = newGraph.nodes.map(node => node.distance || Infinity);
    const visited: boolean[] = Array(newGraph.nodes.length).fill(false);
    let stepCount = 0;
    
    for (let i = 0; i < newGraph.nodes.length; i++) {
      // En kısa mesafeli ziyaret edilmemiş düğümü bul
      let minDistance = Infinity;
      let minIndex = -1;
      
      for (let j = 0; j < distances.length; j++) {
        if (!visited[j] && distances[j] < minDistance) {
          minDistance = distances[j];
          minIndex = j;
        }
      }
      
      if (minIndex === -1) break; // Tüm erişilebilir düğümler ziyaret edildi
      
      stepCount++;
      setCurrentStep(stepCount);
      
      // Güncel düğümü vurgula
      const currentNode = newGraph.nodes[minIndex];
      currentNode.color = currentNodeColor;
      setGraph({...newGraph});
      
      setExplanationText(`Adım ${stepCount}: Düğüm ${currentNode.label} işleniyor, mesafe: ${currentNode.distance}`);
      await wait(speed);
      
      // Düğümü ziyaret edildi olarak işaretle
      visited[minIndex] = true;
      currentNode.color = visitedNodeColor;
      
      // Komşu düğümleri kontrol et
      const edges = newGraph.edges.filter(edge => edge.source === minIndex || edge.target === minIndex);
      
      for (const edge of edges) {
        const neighborIndex = edge.source === minIndex ? edge.target : edge.source;
        
        if (visited[neighborIndex]) continue;
        
        const neighborNode = newGraph.nodes[neighborIndex];
        
        // Kenarı vurgula
        edge.color = activeEdgeColor;
        setGraph({...newGraph});
        
        setExplanationText(`Düğüm ${currentNode.label}'den Düğüm ${neighborNode.label}'ye olan yol kontrol ediliyor`);
        await wait(speed / 2);
        
        // Mesafeyi güncelle
        const altDistance = distances[minIndex] + edge.weight;
        
        if (altDistance < distances[neighborIndex]) {
          distances[neighborIndex] = altDistance;
          neighborNode.distance = altDistance;
          
          setExplanationText(`Düğüm ${neighborNode.label}'ye olan mesafe güncellendi: ${altDistance}`);
        } else {
          setExplanationText(`Düğüm ${neighborNode.label}'ye daha kısa yol bulunamadı`);
        }
        
        // Kenarı normale döndür
        edge.color = normalEdgeColor;
        setGraph({...newGraph});
        await wait(speed / 2);
      }
    }
    
    // En kısa yolları göster (başlangıç düğümünden her düğüme)
    setExplanationText(`Dijkstra tamamlandı! Başlangıç düğümü ${newGraph.nodes[sourceNode].label}'den diğer düğümlere olan en kısa yollar:`);
    
    // Her düğüm için bir metin oluştur
    const pathText = newGraph.nodes
      .filter(node => node.id !== sourceNode)
      .map(node => `${newGraph.nodes[sourceNode].label}→${node.label}: ${node.distance === Infinity ? 'Erişilemez' : node.distance}`)
      .join(', ');
    
    setExplanationText(`Dijkstra tamamlandı! En kısa yollar: ${pathText}`);
    setProcessing(false);
  };
  
  // Algoritma tipine göre doğru görselleştirmeyi çağır
  const startVisualization = () => {
    if (processing) return;
    
    switch (algorithmType.toLowerCase()) {
      case 'dijkstra':
        visualizeDijkstra();
        break;
      case 'breadth first search':
      case 'bfs':
        visualizeBFS();
        break;
      case 'depth first search':
      case 'dfs':
        visualizeDFS();
        break;
      default:
        setExplanationText(`${algorithmType} için görselleştirme henüz uygulanmadı.`);
        break;
    }
  };
  
  // Breadth-First Search (BFS) algoritması görselleştirmesi
  const visualizeBFS = async () => {
    if (processing) return;
    setProcessing(true);
    setCurrentStep(0);
    
    // Grafı kopyala
    const newGraph = JSON.parse(JSON.stringify(graph)) as Graph;
    
    // Düğümleri ve kenarları sıfırla
    newGraph.nodes.forEach(node => {
      node.color = normalNodeColor;
      delete node.distance;
    });
    
    newGraph.edges.forEach(edge => {
      edge.color = normalEdgeColor;
    });
    
    setGraph(newGraph);
    
    // Başlangıç düğümünü ayarla
    const startNode = newGraph.nodes[sourceNode];
    startNode.color = startNodeColor;
    setGraph({...newGraph});
    
    setExplanationText(`BFS algoritması başlangıç düğümü: ${startNode.label}`);
    await wait(speed);
    
    // BFS algoritması
    let stepCount = 0;
    setTotalSteps(newGraph.nodes.length);
    
    // Ziyaret edilmiş düğümleri takip et
    const visited: boolean[] = Array(newGraph.nodes.length).fill(false);
    visited[sourceNode] = true;
    
    // BFS için sıra (kuyruk) oluştur
    const queue: number[] = [sourceNode];
    
    while (queue.length > 0) {
      stepCount++;
      setCurrentStep(stepCount);
      
      // Sıradaki düğümü al
      const currentNodeIndex = queue.shift()!;
      const currentNode = newGraph.nodes[currentNodeIndex];
      
      // Mevcut düğümü işle
      currentNode.color = currentNodeColor;
      setGraph({...newGraph});
      
      setExplanationText(`Adım ${stepCount}: Düğüm ${currentNode.label} işleniyor`);
      await wait(speed);
      
      // Mevcut düğümün komşularını bul
      const edges = newGraph.edges.filter(edge => 
        edge.source === currentNodeIndex || edge.target === currentNodeIndex
      );
      
      // Komşuları ziyaret et
      for (const edge of edges) {
        const neighborIndex = edge.source === currentNodeIndex ? edge.target : edge.source;
        
        if (!visited[neighborIndex]) {
          // Kenarı vurgula
          edge.color = activeEdgeColor;
          setGraph({...newGraph});
          
          const neighborNode = newGraph.nodes[neighborIndex];
          setExplanationText(`Düğüm ${currentNode.label}'den komşu düğüm ${neighborNode.label} keşfediliyor`);
          await wait(speed / 2);
          
          // Komşuyu ziyaret edildi olarak işaretle
          visited[neighborIndex] = true;
          
          // Komşuyu sıraya ekle
          queue.push(neighborIndex);
          
          // Komşu düğümü ziyaret edilecek olarak işaretle
          neighborNode.color = visitedNodeColor;
          setGraph({...newGraph});
          
          setExplanationText(`Düğüm ${neighborNode.label} sıraya eklendi`);
          await wait(speed / 2);
        }
      }
      
      // İşlenen düğümü işlenmiş olarak işaretle
      currentNode.color = visitedNodeColor;
      setGraph({...newGraph});
      await wait(speed / 4);
    }
    
    setExplanationText(`BFS tamamlandı! Tüm erişilebilir düğümler ziyaret edildi.`);
    setProcessing(false);
  };
  
  // Depth-First Search (DFS) algoritması görselleştirmesi
  const visualizeDFS = async () => {
    if (processing) return;
    setProcessing(true);
    setCurrentStep(0);
    
    // Grafı kopyala
    const newGraph = JSON.parse(JSON.stringify(graph)) as Graph;
    
    // Düğümleri ve kenarları sıfırla
    newGraph.nodes.forEach(node => {
      node.color = normalNodeColor;
      delete node.distance;
    });
    
    newGraph.edges.forEach(edge => {
      edge.color = normalEdgeColor;
    });
    
    setGraph(newGraph);
    
    // Başlangıç düğümünü ayarla
    const startNode = newGraph.nodes[sourceNode];
    startNode.color = startNodeColor;
    setGraph({...newGraph});
    
    setExplanationText(`DFS algoritması başlangıç düğümü: ${startNode.label}`);
    await wait(speed);
    
    // DFS algoritması
    let stepCount = 0;
    setTotalSteps(newGraph.nodes.length);
    
    // Ziyaret edilmiş düğümleri takip et
    const visited: boolean[] = Array(newGraph.nodes.length).fill(false);
    
    // DFS yardımcı fonksiyonu (recursif)
    const dfs = async (nodeIndex: number): Promise<void> => {
      if (visited[nodeIndex]) return;
      
      stepCount++;
      setCurrentStep(stepCount);
      
      const currentNode = newGraph.nodes[nodeIndex];
      
      // Mevcut düğümü ziyaret edildi olarak işaretle
      visited[nodeIndex] = true;
      
      // Mevcut düğümü işaret et
      currentNode.color = currentNodeColor;
      setGraph({...newGraph});
      
      setExplanationText(`Adım ${stepCount}: Düğüm ${currentNode.label} ziyaret ediliyor`);
      await wait(speed);
      
      // Mevcut düğümün komşularını bul
      const edges = newGraph.edges.filter(edge => 
        edge.source === nodeIndex || edge.target === nodeIndex
      );
      
      // Her bir komşuyu ziyaret et (keşfet)
      for (const edge of edges) {
        const neighborIndex = edge.source === nodeIndex ? edge.target : edge.source;
        
        if (!visited[neighborIndex]) {
          // Kenarı vurgula
          edge.color = activeEdgeColor;
          setGraph({...newGraph});
          
          const neighborNode = newGraph.nodes[neighborIndex];
          setExplanationText(`Düğüm ${currentNode.label}'den komşu düğüm ${neighborNode.label} keşfediliyor`);
          await wait(speed / 2);
          
          // Komşuyu recursif olarak ziyaret et
          await dfs(neighborIndex);
        }
      }
      
      // İşlenen düğümü işlenmiş olarak işaretle (geri dönüş)
      currentNode.color = visitedNodeColor;
      setGraph({...newGraph});
      setExplanationText(`Düğüm ${currentNode.label}'den geri dönülüyor`);
      await wait(speed / 2);
    };
    
    // Başlangıç düğümünden DFS başlat
    await dfs(sourceNode);
    
    setExplanationText(`DFS tamamlandı! Tüm erişilebilir düğümler ziyaret edildi.`);
    setProcessing(false);
  };
  
  // Başlangıç düğümünü değiştir
  const changeSourceNode = (nodeIndex: number) => {
    if (processing) return;
    setSourceNode(nodeIndex);
    setExplanationText(`Başlangıç düğümü ${graph.nodes[nodeIndex].label} olarak ayarlandı.`);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.visualizationTitle}>{title} Görselleştirmesi</Text>
      
      {/* Algoritma bilgi kartı */}
      <AlgorithmInfoCard algorithmType={algorithmType} />
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, processing && styles.disabledButton]}
          onPress={startVisualization}
          disabled={processing}
        >
          <Text style={styles.buttonText}>Başlat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, processing && styles.disabledButton]}
          onPress={resetGraph}
          disabled={processing}
        >
          <Text style={styles.buttonText}>Yeni Graf</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sourceNodeControl}>
        <Text style={styles.sourceNodeText}>Başlangıç Düğümü: </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.nodeButtonContainer}>
            {graph.nodes.map((node, index) => (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.nodeButton,
                  sourceNode === index && styles.activeNodeButton,
                  processing && styles.disabledButton
                ]}
                onPress={() => changeSourceNode(index)}
                disabled={processing}
              >
                <Text style={styles.nodeButtonText}>{node.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.graphContainer}>
        <Svg width="100%" height="300">
          {/* Kenarları çiz */}
          {graph.edges.map((edge, index) => {
            const sourceNode = graph.nodes.find(n => n.id === edge.source);
            const targetNode = graph.nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            return (
              <React.Fragment key={`edge-${index}`}>
                <Line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.color || normalEdgeColor}
                  strokeWidth={EDGE_WIDTH}
                />
                {/* Kenar ağırlığını göster */}
                <SvgText
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2 - 10}
                  fill="#2c3e50"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {edge.weight}
                </SvgText>
              </React.Fragment>
            );
          })}
          
          {/* Düğümleri çiz */}
          {graph.nodes.map((node) => (
            <React.Fragment key={`node-${node.id}`}>
              <Circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={node.color || normalNodeColor}
              />
              <SvgText
                x={node.x}
                y={node.y + 5}
                fill="white"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
              >
                {node.label}
              </SvgText>
              
              {/* Mesafeyi göster (sadece Dijkstra görselleştirmesi sırasında) */}
              {node.distance !== undefined && node.distance !== Infinity && (
                <SvgText
                  x={node.x}
                  y={node.y - NODE_RADIUS - 5}
                  fill="#2c3e50"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {node.distance}
                </SvgText>
              )}
            </React.Fragment>
          ))}
        </Svg>
      </View>
      
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
  sourceNodeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sourceNodeText: {
    fontSize: 14,
    color: '#2c3e50',
    marginRight: 10,
  },
  nodeButtonContainer: {
    flexDirection: 'row',
  },
  nodeButton: {
    backgroundColor: '#f1f2f6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  activeNodeButton: {
    backgroundColor: '#6c5ce7',
  },
  nodeButtonText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  graphContainer: {
    height: 300,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
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
});

export default GraphVisualization; 