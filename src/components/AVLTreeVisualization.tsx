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

// AVL Ağaç düğümü için tip tanımı
interface AVLTreeNode {
  id: number;
  value: number;
  height: number;
  balanceFactor: number;
  left: number | null;
  right: number | null;
  parent: number | null;
  x: number;
  y: number;
}

interface AVLTree {
  nodes: AVLTreeNode[];
  root: number | null;
}

interface AVLTreeVisualizationProps {
  title: string;
  animationSpeed?: number;
}

// Sabitler
const { width } = Dimensions.get('window');
const NODE_RADIUS = 20;
const LEVEL_HEIGHT = 100;
const HORIZONTAL_SPACING = NODE_RADIUS * 5;
const BALANCED_COLOR = '#27ae60'; // Dengeli düğüm rengi (yeşil)
const UNBALANCED_COLOR = '#e74c3c'; // Dengesiz düğüm rengi (kırmızı)
const NEUTRAL_COLOR = '#3498db'; // Nötr düğüm rengi (mavi)

const AVLTreeVisualization: React.FC<AVLTreeVisualizationProps> = ({
  title,
  animationSpeed = 500
}) => {
  const [tree, setTree] = useState<AVLTree>({ nodes: [], root: null });
  const [processing, setProcessing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [showProperties, setShowProperties] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(500);
  const [explanationText, setExplanationText] = useState<string>('AVL Ağaç görselleştirmesi. Başlamak için bir sayı girin.');
  const [logs, setLogs] = useState<string[]>([]);

  // Yeni düğüm oluştur
  const createNode = (id: number, value: number): AVLTreeNode => ({
    id,
    value,
    height: 1,
    balanceFactor: 0,
    left: null,
    right: null,
    parent: null,
    x: 0,
    y: 0
  });

  // Düğümün yüksekliğini hesapla
  const getHeight = (tree: AVLTree, nodeId: number | null): number => {
    if (nodeId === null) return 0;
    return tree.nodes[nodeId].height;
  };

  // Düğümün denge faktörünü hesapla
  const getBalanceFactor = (tree: AVLTree, nodeId: number | null): number => {
    if (nodeId === null) return 0;
    const node = tree.nodes[nodeId];
    return getHeight(tree, node.left) - getHeight(tree, node.right);
  };

  // Düğümün yüksekliğini güncelle
  const updateHeight = (tree: AVLTree, nodeId: number | null): void => {
    if (nodeId === null) return;
    const node = tree.nodes[nodeId];
    node.height = 1 + Math.max(
      getHeight(tree, node.left),
      getHeight(tree, node.right)
    );
    node.balanceFactor = getBalanceFactor(tree, nodeId);
  };

  // Sağa döndürme
  const rightRotate = (tree: AVLTree, nodeId: number): number => {
    const node = tree.nodes[nodeId];
    const leftChildId = node.left;

    if (leftChildId === null) return nodeId;
    const leftChild = tree.nodes[leftChildId];
    const leftRightChildId = leftChild.right;

    // Döndürme işlemi
    leftChild.right = nodeId;
    leftChild.parent = node.parent;
    node.parent = leftChildId;
    node.left = leftRightChildId;

    if (leftRightChildId !== null) {
      tree.nodes[leftRightChildId].parent = nodeId;
    }

    // Kök düğümü güncelle
    if (node.parent === null) {
      tree.root = leftChildId;
    } else {
      const parentId = leftChild.parent;
      if (parentId !== null) {
        const parent = tree.nodes[parentId];
        if (parent.left === nodeId) {
          parent.left = leftChildId;
        } else {
          parent.right = leftChildId;
        }
      }
    }

    // Yükseklikleri güncelle
    updateHeight(tree, nodeId);
    updateHeight(tree, leftChildId);

    return leftChildId;
  };

  // Sola döndürme
  const leftRotate = (tree: AVLTree, nodeId: number): number => {
    const node = tree.nodes[nodeId];
    const rightChildId = node.right;

    if (rightChildId === null) return nodeId;
    const rightChild = tree.nodes[rightChildId];
    const rightLeftChildId = rightChild.left;

    // Döndürme işlemi
    rightChild.left = nodeId;
    rightChild.parent = node.parent;
    node.parent = rightChildId;
    node.right = rightLeftChildId;

    if (rightLeftChildId !== null) {
      tree.nodes[rightLeftChildId].parent = nodeId;
    }

    // Kök düğümü güncelle
    if (node.parent === null) {
      tree.root = rightChildId;
    } else {
      const parentId = rightChild.parent;
      if (parentId !== null) {
        const parent = tree.nodes[parentId];
        if (parent.left === nodeId) {
          parent.left = rightChildId;
        } else {
          parent.right = rightChildId;
        }
      }
    }

    // Yükseklikleri güncelle
    updateHeight(tree, nodeId);
    updateHeight(tree, rightChildId);

    return rightChildId;
  };

  // Ağacı dengele
  const balanceTree = (tree: AVLTree, nodeId: number | null): number | null => {
    if (nodeId === null) return null;

    const node = tree.nodes[nodeId];
    const balanceFactor = node.balanceFactor;

    // Sol ağır durumu
    if (balanceFactor > 1) {
      const leftChild = tree.nodes[node.left!];
      
      // Sol-Sol durumu
      if (leftChild.balanceFactor >= 0) {
        return rightRotate(tree, nodeId);
      }
      
      // Sol-Sağ durumu
      if (leftChild.balanceFactor < 0) {
        node.left = leftRotate(tree, node.left!);
        return rightRotate(tree, nodeId);
      }
    }
    
    // Sağ ağır durumu
    if (balanceFactor < -1) {
      const rightChild = tree.nodes[node.right!];
      
      // Sağ-Sağ durumu
      if (rightChild.balanceFactor <= 0) {
        return leftRotate(tree, nodeId);
      }
      
      // Sağ-Sol durumu
      if (rightChild.balanceFactor > 0) {
        node.right = rightRotate(tree, node.right!);
        return leftRotate(tree, nodeId);
      }
    }
    
    return nodeId;
  };

  // Düğüm ekleme
  const insertNode = (tree: AVLTree, value: number): void => {
    const newNodeId = tree.nodes.length;
    const newNode = createNode(newNodeId, value);
    tree.nodes.push(newNode);

    // Log ekle
    const newLogs = [`${value} değeri ağaca ekleniyor...`];

    if (tree.root === null) {
      tree.root = newNodeId;
      newLogs.push(`${value} kök düğüm olarak eklendi.`);
      setLogs(prev => [...prev, ...newLogs]);
      return;
    }

    let currentId: number | null = tree.root;
    let parentId: number | null = null;

    while (currentId !== null) {
      parentId = currentId;
      const current: AVLTreeNode = tree.nodes[currentId];

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
        newLogs.push(`${value}, ${parent.value} düğümünün soluna eklendi.`);
      } else {
        parent.right = newNodeId;
        newLogs.push(`${value}, ${parent.value} düğümünün sağına eklendi.`);
      }
    }

    // Ağacı dengele
    let current = newNode.parent;
    while (current !== null) {
      updateHeight(tree, current);
      const node = tree.nodes[current];
      newLogs.push(`${node.value} düğümünün yüksekliği güncellendi: ${node.height}, denge faktörü: ${node.balanceFactor}`);
      
      if (Math.abs(node.balanceFactor) > 1) {
        newLogs.push(`${node.value} düğümü dengesiz (denge faktörü: ${node.balanceFactor})`);
        
        // Sol ağır durumu
        if (node.balanceFactor > 1) {
          const leftChild = tree.nodes[node.left!];
          
          // Sol-Sol durumu
          if (leftChild.balanceFactor >= 0) {
            newLogs.push(`LL Durumu: ${node.value} düğümünde sağa rotasyon yapılıyor...`);
            current = rightRotate(tree, current);
          }
          
          // Sol-Sağ durumu
          else {
            newLogs.push(`LR Durumu: Önce ${leftChild.value} düğümünde sola rotasyon yapılıyor...`);
            node.left = leftRotate(tree, node.left!);
            newLogs.push(`Sonra ${node.value} düğümünde sağa rotasyon yapılıyor...`);
            current = rightRotate(tree, current);
          }
        }
        
        // Sağ ağır durumu
        else if (node.balanceFactor < -1) {
          const rightChild = tree.nodes[node.right!];
          
          // Sağ-Sağ durumu
          if (rightChild.balanceFactor <= 0) {
            newLogs.push(`RR Durumu: ${node.value} düğümünde sola rotasyon yapılıyor...`);
            current = leftRotate(tree, current);
          }
          
          // Sağ-Sol durumu
          else {
            newLogs.push(`RL Durumu: Önce ${rightChild.value} düğümünde sağa rotasyon yapılıyor...`);
            node.right = rightRotate(tree, node.right!);
            newLogs.push(`Sonra ${node.value} düğümünde sola rotasyon yapılıyor...`);
            current = leftRotate(tree, current);
          }
        }
      }
      
      current = tree.nodes[current!].parent;
    }

    newLogs.push(`${value} değeri eklendi ve ağaç dengelendi.`);
    setLogs(prev => [...prev, ...newLogs]);
  };

  // Düğüm pozisyonlarını hesapla
  const calculateNodePositions = (tree: AVLTree) => {
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
    const newTree: AVLTree = { nodes: [], root: null };
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
      console.log("Yeni AVL ağacı oluşturuluyor...");
      const initialTree = createSampleTree();
      console.log("AVL ağacı oluşturuldu, düğüm sayısı:", initialTree.nodes.length);
      setTree(initialTree);
      setExplanationText('Yeni bir AVL Ağaç oluşturuldu. Düğüm eklemek için bir sayı girin.');
      setLogs(['Yeni AVL ağacı oluşturuldu.', 'Başlangıç değerleri: 50, 30, 70']);
    } catch (error) {
      console.error("Ağaç oluşturma hatası:", error);
    }
  };

  // İlk yükleme
  useEffect(() => {
    try {
      console.log("İlk AVL ağacı oluşturuluyor...");
      const initialTree = createSampleTree();
      console.log("AVL ağacı oluşturuldu, düğüm sayısı:", initialTree.nodes.length);
      setTree(initialTree);
      setExplanationText('AVL Ağaç oluşturuldu. Yeni düğüm eklemek için bir sayı girin.');
      setLogs(['AVL ağacı oluşturuldu.', 'Başlangıç değerleri: 50, 30, 70']);
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

  // Düğüm rengi belirle
  const getNodeColor = (node: AVLTreeNode) => {
    // Denge faktörüne göre renk belirleme
    if (Math.abs(node.balanceFactor) > 1) {
      return UNBALANCED_COLOR; // Dengesiz düğüm
    } else if (Math.abs(node.balanceFactor) === 1) {
      return NEUTRAL_COLOR; // Nötr düğüm
    } else {
      return BALANCED_COLOR; // Dengeli düğüm
    }
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
                  backgroundColor: getNodeColor(node),
                  left: node.x - NODE_RADIUS,
                  top: node.y - NODE_RADIUS,
                }
              ]}
            >
              <Text style={styles.nodeText}>{node.value}</Text>
              {/* Denge faktörünü göster */}
              <View style={styles.balanceFactorBadge}>
                <Text style={styles.balanceFactorText}>{node.balanceFactor}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: BALANCED_COLOR }]} />
          <Text style={styles.legendText}>Dengeli Düğüm</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: NEUTRAL_COLOR }]} />
          <Text style={styles.legendText}>Nötr Düğüm</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: UNBALANCED_COLOR }]} />
          <Text style={styles.legendText}>Dengesiz Düğüm</Text>
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
  balanceFactorBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  balanceFactorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
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
    fontSize: 12,
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

export default AVLTreeVisualization; 