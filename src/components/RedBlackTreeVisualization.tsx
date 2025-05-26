import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';

// Ağaç düğümü için tip tanımı
interface TreeNode {
  id: number;
  value: number;
  color: 'red' | 'black';
  left: number | null;
  right: number | null;
  parent: number | null;
  x: number;
  y: number;
}

interface RedBlackTree {
  nodes: TreeNode[];
  root: number | null;
}

interface RedBlackTreeVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Sabitler
const { width } = Dimensions.get('window');
const NODE_RADIUS = 20;
const LEVEL_HEIGHT = 100;
const HORIZONTAL_SPACING = NODE_RADIUS * 5;
const RED_COLOR = '#e74c3c';
const BLACK_COLOR = '#2c3e50';

const RedBlackTreeVisualization: React.FC<RedBlackTreeVisualizationProps> = ({
  title,
  animationSpeed = 500
}) => {
  const [tree, setTree] = useState<RedBlackTree>({ nodes: [], root: null });
  const [processing, setProcessing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [showProperties, setShowProperties] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(500);
  const [explanationText, setExplanationText] = useState<string>('Kırmızı-Siyah Ağaç görselleştirmesi. Başlamak için bir sayı girin.');
  const [logs, setLogs] = useState<string[]>([]);

  // Yeni düğüm oluştur
  const createNode = (id: number, value: number): TreeNode => ({
    id,
    value,
    color: 'red',
    left: null,
    right: null,
    parent: null,
    x: 0,
    y: 0
  });

  // Düğüm ekleme
  const insertNode = (tree: RedBlackTree, value: number): void => {
    const newNodeId = tree.nodes.length;
    const newNode = createNode(newNodeId, value);
    tree.nodes.push(newNode);

    // Log ekle
    const newLogs = [`${value} değeri ağaca ekleniyor...`];

    if (tree.root === null) {
      tree.root = newNodeId;
      newNode.color = 'black';
      newLogs.push(`${value} kök düğüm olarak eklendi (siyah).`);
      setLogs(prev => [...prev, ...newLogs]);
      return;
    }

    let currentId: number | null = tree.root;
    let parentId: number | null = null;

    while (currentId !== null) {
      parentId = currentId;
      const current: TreeNode = tree.nodes[currentId];

      if (value < current.value) {
        newLogs.push(`${value} < ${current.value}, sol alt ağaca gidiliyor...`);
        currentId = current.left;
      } else if (value > current.value) {
        newLogs.push(`${value} > ${current.value}, sağ alt ağaca gidiliyor...`);
        currentId = current.right;
      } else {
        newLogs.push(`${value} değeri zaten ağaçta var, ekleme iptal edildi.`);
        tree.nodes.pop();
        setLogs(prev => [...prev, ...newLogs]);
        return;
      }
    }

    if (parentId !== null) {
      newNode.parent = parentId;
      const parent = tree.nodes[parentId];

      if (value < parent.value) {
        parent.left = newNodeId;
        newLogs.push(`${value}, ${parent.value} düğümünün soluna eklendi (kırmızı).`);
      } else {
        parent.right = newNodeId;
        newLogs.push(`${value}, ${parent.value} düğümünün sağına eklendi (kırmızı).`);
      }
    }

    fixRedBlackProperties(tree, newNodeId, newLogs);
    newLogs.push(`${value} değeri eklendi ve Kırmızı-Siyah Ağaç özellikleri korundu.`);
    setLogs(prev => [...prev, ...newLogs]);
  };

  // Red-Black özellikleri düzeltme
  const fixRedBlackProperties = (tree: RedBlackTree, nodeId: number, logs: string[] = []): void => {
    let currentId = nodeId;

    while (currentId !== tree.root && 
           tree.nodes[currentId].parent !== null && 
           tree.nodes[tree.nodes[currentId].parent!].color === 'red') {
      
      const parentId = tree.nodes[currentId].parent!;
      const parent = tree.nodes[parentId];
      const grandparentId = parent.parent;

      if (grandparentId === null) break;
      const grandparent = tree.nodes[grandparentId];

      if (grandparent.left === parentId) {
        const uncleId = grandparent.right;

        if (uncleId !== null && tree.nodes[uncleId].color === 'red') {
          logs.push(`Durum 1: Ebeveyn (${parent.value}) ve Amca kırmızı.`);
          logs.push(`Ebeveyn (${parent.value}) ve Amca siyah yapılıyor, Büyükanne/baba (${grandparent.value}) kırmızı yapılıyor.`);
          parent.color = 'black';
          tree.nodes[uncleId].color = 'black';
          grandparent.color = 'red';
          currentId = grandparentId;
        } else {
          if (parent.right === currentId) {
            logs.push(`Durum 2: Ebeveyn (${parent.value}) kırmızı, Amca siyah, düğüm (${tree.nodes[currentId].value}) sağ çocuk.`);
            logs.push(`Ebeveyn (${parent.value}) üzerinde sol rotasyon yapılıyor.`);
            currentId = parentId;
            rotateLeft(tree, currentId);
          }

          const newParentId = tree.nodes[currentId].parent!;
          const newGrandparentId = tree.nodes[newParentId].parent!;
          logs.push(`Durum 3: Ebeveyn (${tree.nodes[newParentId].value}) kırmızı, Amca siyah, düğüm (${tree.nodes[currentId].value}) sol çocuk.`);
          logs.push(`Ebeveyn (${tree.nodes[newParentId].value}) siyah yapılıyor, Büyükanne/baba (${tree.nodes[newGrandparentId].value}) kırmızı yapılıyor.`);
          logs.push(`Büyükanne/baba (${tree.nodes[newGrandparentId].value}) üzerinde sağ rotasyon yapılıyor.`);
          tree.nodes[newParentId].color = 'black';
          tree.nodes[newGrandparentId].color = 'red';
          rotateRight(tree, newGrandparentId);
        }
      } else {
        const uncleId = grandparent.left;

        if (uncleId !== null && tree.nodes[uncleId].color === 'red') {
          logs.push(`Durum 1: Ebeveyn (${parent.value}) ve Amca kırmızı.`);
          logs.push(`Ebeveyn (${parent.value}) ve Amca siyah yapılıyor, Büyükanne/baba (${grandparent.value}) kırmızı yapılıyor.`);
          parent.color = 'black';
          tree.nodes[uncleId].color = 'black';
          grandparent.color = 'red';
          currentId = grandparentId;
        } else {
          if (parent.left === currentId) {
            logs.push(`Durum 2: Ebeveyn (${parent.value}) kırmızı, Amca siyah, düğüm (${tree.nodes[currentId].value}) sol çocuk.`);
            logs.push(`Ebeveyn (${parent.value}) üzerinde sağ rotasyon yapılıyor.`);
            currentId = parentId;
            rotateRight(tree, currentId);
          }

          const newParentId = tree.nodes[currentId].parent!;
          const newGrandparentId = tree.nodes[newParentId].parent!;
          logs.push(`Durum 3: Ebeveyn (${tree.nodes[newParentId].value}) kırmızı, Amca siyah, düğüm (${tree.nodes[currentId].value}) sağ çocuk.`);
          logs.push(`Ebeveyn (${tree.nodes[newParentId].value}) siyah yapılıyor, Büyükanne/baba (${tree.nodes[newGrandparentId].value}) kırmızı yapılıyor.`);
          logs.push(`Büyükanne/baba (${tree.nodes[newGrandparentId].value}) üzerinde sol rotasyon yapılıyor.`);
          tree.nodes[newParentId].color = 'black';
          tree.nodes[newGrandparentId].color = 'red';
          rotateLeft(tree, newGrandparentId);
        }
      }
    }

    if (tree.root !== null) {
      if (tree.nodes[tree.root].color === 'red') {
        logs.push(`Kök düğüm (${tree.nodes[tree.root].value}) siyah yapılıyor.`);
      }
      tree.nodes[tree.root].color = 'black';
    }
  };

  // Sol rotasyon
  const rotateLeft = (tree: RedBlackTree, nodeId: number): void => {
    const node = tree.nodes[nodeId];
    const rightChildId = node.right;

    if (rightChildId === null) return;
    const rightChild = tree.nodes[rightChildId];

    node.right = rightChild.left;
    if (rightChild.left !== null) {
      tree.nodes[rightChild.left].parent = nodeId;
    }

    rightChild.parent = node.parent;

    if (node.parent === null) {
      tree.root = rightChildId;
    } else if (tree.nodes[node.parent].left === nodeId) {
      tree.nodes[node.parent].left = rightChildId;
    } else {
      tree.nodes[node.parent].right = rightChildId;
    }

    rightChild.left = nodeId;
    node.parent = rightChildId;
  };

  // Sağ rotasyon
  const rotateRight = (tree: RedBlackTree, nodeId: number): void => {
    const node = tree.nodes[nodeId];
    const leftChildId = node.left;

    if (leftChildId === null) return;
    const leftChild = tree.nodes[leftChildId];

    node.left = leftChild.right;
    if (leftChild.right !== null) {
      tree.nodes[leftChild.right].parent = nodeId;
    }

    leftChild.parent = node.parent;

    if (node.parent === null) {
      tree.root = leftChildId;
    } else if (tree.nodes[node.parent].right === nodeId) {
      tree.nodes[node.parent].right = leftChildId;
    } else {
      tree.nodes[node.parent].left = leftChildId;
    }

    leftChild.right = nodeId;
    node.parent = leftChildId;
  };

  // Düğüm pozisyonlarını hesapla
  const calculateNodePositions = (tree: RedBlackTree) => {
    if (tree.root === null) return;

    // Ağacın derinliğini hesapla
    const getDepth = (nodeId: number | null): number => {
      if (nodeId === null) return 0;
      const node = tree.nodes[nodeId];
      return 1 + Math.max(
        getDepth(node.left),
        getDepth(node.right)
      );
    };

    const depth = getDepth(tree.root);
    // Ekran genişliğinin %90'ını kullan
    const totalWidth = width * 0.9;
    const totalHeight = depth * LEVEL_HEIGHT + 60;

    const calculatePositionsRecursive = (
      nodeId: number | null,
      level: number,
      leftX: number,
      rightX: number
    ): void => {
      if (nodeId === null) return;

      const node = tree.nodes[nodeId];
      const x = (leftX + rightX) / 2;
      const y = level * LEVEL_HEIGHT + 60;

      // Düğüm pozisyonunu güncelle
      node.x = x;
      node.y = y;

      // Alt ağaçları yerleştir
      calculatePositionsRecursive(node.left, level + 1, leftX, x);
      calculatePositionsRecursive(node.right, level + 1, x, rightX);
    };

    // Kök düğümden başlayarak tüm düğümleri yerleştir
    calculatePositionsRecursive(tree.root, 0, 10, totalWidth - 10);
  };

  // Örnek ağaç oluştur
  const createSampleTree = () => {
    const newTree: RedBlackTree = { nodes: [], root: null };
    const values = [50, 30, 70]; // Daha az düğüm ile başla
    
    // Değerleri sırayla ekle
    values.forEach(value => {
      insertNode(newTree, value);
    });
    
    // Düğüm pozisyonlarını hesapla
    calculateNodePositions(newTree);
    return newTree;
  };

  // Yeni ağaç oluştur
  const handleNewTree = () => {
    try {
      console.log("Yeni ağaç oluşturuluyor...");
      const initialTree = createSampleTree();
      console.log("Ağaç oluşturuldu, düğüm sayısı:", initialTree.nodes.length);
      setTree(initialTree);
      setExplanationText('Yeni bir Kırmızı-Siyah Ağaç oluşturuldu. Düğüm eklemek için bir sayı girin.');
      setLogs(['Yeni Kırmızı-Siyah ağacı oluşturuldu.', 'Başlangıç değerleri: 50, 30, 70']);
    } catch (error) {
      console.error("Ağaç oluşturma hatası:", error);
    }
  };

  // İlk yükleme
  useEffect(() => {
    try {
      console.log("İlk ağaç oluşturuluyor...");
      const initialTree = createSampleTree();
      console.log("Ağaç oluşturuldu, düğüm sayısı:", initialTree.nodes.length);
      setTree(initialTree);
      setExplanationText('Kırmızı-Siyah Ağaç oluşturuldu. Yeni düğüm eklemek için bir sayı girin.');
      setLogs(['Kırmızı-Siyah ağacı oluşturuldu.', 'Başlangıç değerleri: 50, 30, 70']);
    } catch (error) {
      console.error("İlk ağaç oluşturma hatası:", error);
    }
  }, []);

  // Düğüm ekle
  const handleInsert = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      setExplanationText('Lütfen geçerli bir sayı girin.');
      return;
    }

    // Yeni ağaç oluştur
    const newTree = { ...tree };
    insertNode(newTree, value);
    
    // Düğüm pozisyonlarını güncelle
    calculateNodePositions(newTree);
    
    // State'i güncelle
    setTree(newTree);
    setInputValue('');
    setExplanationText(`${value} değeri ağaca eklendi.`);
  };

  // Düğüm sil
  const handleDelete = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      setExplanationText('Lütfen geçerli bir sayı girin.');
      return;
    }

    setExplanationText('Silme özelliği yakında eklenecek.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.newTreeButton]}
            onPress={handleNewTree}
          >
            <Text style={styles.buttonText}>Yeni Ağaç</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.propertiesButton]}
            onPress={() => setShowProperties(!showProperties)}
          >
            <Text style={styles.buttonText}>Özellikleri Göster</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Sayı girin..."
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.button, styles.insertButton]}
            onPress={handleInsert}
          >
            <Text style={styles.buttonText}>Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.buttonText}>Sil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.speedControl}>
          <Text style={styles.speedLabel}>Hız:</Text>
          <View style={styles.speedSlider}>
            {/* Hız kontrolü burada implement edilecek */}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.treeContainer}
        horizontal={true}
        contentContainerStyle={styles.treeContentContainer}
      >
        <View style={styles.canvas}>
          {/* Kenarları çiz */}
          {tree.nodes.map((node) => (
            <React.Fragment key={`edges-${node.id}`}>
              {node.left !== null && tree.nodes[node.left] && (
                <View
                  style={[
                    styles.edge,
                    {
                      position: 'absolute',
                      left: node.x,
                      top: node.y,
                      width: Math.sqrt(
                        Math.pow(tree.nodes[node.left].x - node.x, 2) +
                        Math.pow(tree.nodes[node.left].y - node.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          tree.nodes[node.left].y - node.y,
                          tree.nodes[node.left].x - node.x
                        )}rad`
                      }]
                    }
                  ]}
                />
              )}
              {node.right !== null && tree.nodes[node.right] && (
                <View
                  style={[
                    styles.edge,
                    {
                      position: 'absolute',
                      left: node.x,
                      top: node.y,
                      width: Math.sqrt(
                        Math.pow(tree.nodes[node.right].x - node.x, 2) +
                        Math.pow(tree.nodes[node.right].y - node.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          tree.nodes[node.right].y - node.y,
                          tree.nodes[node.right].x - node.x
                        )}rad`
                      }]
                    }
                  ]}
                />
              )}
            </React.Fragment>
          ))}

          {/* Düğümleri çiz */}
          {tree.nodes.map((node) => (
            <View
              key={`node-${node.id}`}
              style={[
                styles.node,
                {
                  backgroundColor: node.color === 'red' ? RED_COLOR : BLACK_COLOR,
                  left: node.x - NODE_RADIUS,
                  top: node.y - NODE_RADIUS,
                }
              ]}
            >
              <Text style={styles.nodeText}>{node.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: RED_COLOR }]} />
          <Text style={styles.legendText}>Kırmızı Düğüm</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: BLACK_COLOR }]} />
          <Text style={styles.legendText}>Siyah Düğüm</Text>
        </View>
      </View>
      
      {/* İşlem loglarını göster */}
      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  controls: {
    padding: 15,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  newTreeButton: {
    backgroundColor: '#6c5ce7',
  },
  propertiesButton: {
    backgroundColor: '#a55eea',
  },
  insertButton: {
    backgroundColor: '#00b894',
  },
  deleteButton: {
    backgroundColor: '#d63031',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
  },
  speedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  speedLabel: {
    fontSize: 14,
    color: '#2c3e50',
  },
  speedSlider: {
    flex: 1,
    height: 40,
  },
  treeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  treeContentContainer: {
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  canvas: {
    flex: 1,
    width: width - 20,
    minHeight: 400,
    backgroundColor: '#f8f9fa',
    position: 'relative',
    borderRadius: 12,
    elevation: 2,
  },
  edge: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#95a5a6',
    transformOrigin: 'left center',
    opacity: 0.8,
  },
  node: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  nodeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  legendText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  logsContainer: {
    maxHeight: 150,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default RedBlackTreeVisualization;