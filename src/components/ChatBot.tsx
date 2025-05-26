import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/apiClient';

// Chatbot mesaj tipleri
type MessageRole = 'user' | 'bot';

interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  options?: ChatOption[];
  suggestions?: AlgorithmSuggestion[];
}

interface ChatOption {
  id: string;
  text: string;
  value: string;
}

interface AlgorithmSuggestion {
  id: string;
  title: string;
  description: string;
  complexity: string;
  category: string;
  difficulty?: string;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

// Önceden tanımlanmış soru ve yanıtlar
const predefinedQuestions = [
  {
    id: 'q1',
    text: 'Veri sıralama ile ilgili bir algoritma arıyorum',
    value: 'sorting'
  },
  {
    id: 'q2',
    text: 'Veri arama algoritmaları nelerdir?',
    value: 'searching'
  },
  {
    id: 'q3',
    text: 'Grafik algoritmaları hakkında bilgi almak istiyorum',
    value: 'graph'
  },
  {
    id: 'q4',
    text: 'En verimli sıralama algoritması hangisidir?',
    value: 'efficient_sorting'
  },
  {
    id: 'q5',
    text: 'Veri yapıları hakkında bilgi almak istiyorum',
    value: 'data_structures'
  },
  {
    id: 'q6',
    text: 'Makine öğrenmesi algoritmaları nelerdir?',
    value: 'machine_learning'
  },
  {
    id: 'q7',
    text: 'Derin öğrenme teknikleri hakkında bilgi almak istiyorum',
    value: 'deep_learning'
  },
  {
    id: 'q8',
    text: 'Algoritma karmaşıklığı nedir?',
    value: 'algorithm_complexity'
  }
];

// Alt kategoriler ve alt sorular
interface SubCategoryQuestionMap {
  [category: string]: ChatOption[];
}

const subCategoryQuestions: SubCategoryQuestionMap = {
  // Veri yapıları alt kategorileri
  data_structures: [
    {
      id: 'ds1',
      text: 'Diziler (Arrays) hakkında bilgi almak istiyorum',
      value: 'arrays'
    },
    {
      id: 'ds2',
      text: 'Bağlı Listeler (Linked Lists) nedir?',
      value: 'linked_lists'
    },
    {
      id: 'ds3',
      text: 'Ağaç (Tree) veri yapıları nelerdir?',
      value: 'trees'
    },
    {
      id: 'ds4',
      text: 'Yığın (Stack) ve Kuyruk (Queue) yapıları',
      value: 'stacks_queues'
    },
    {
      id: 'ds5',
      text: 'Hash Tabloları nasıl çalışır?',
      value: 'hash_tables'
    }
  ],
  
  // Sıralama algoritmaları alt kategorileri
  sorting: [
    {
      id: 'sort1',
      text: 'Bubble Sort algoritması nasıl çalışır?',
      value: 'bubble_sort'
    },
    {
      id: 'sort2',
      text: 'Quick Sort hakkında bilgi almak istiyorum',
      value: 'quick_sort'
    },
    {
      id: 'sort3',
      text: 'Merge Sort nasıl uygulanır?',
      value: 'merge_sort'
    },
    {
      id: 'sort4',
      text: 'Insertion Sort ve Selection Sort arasındaki farklar',
      value: 'insertion_selection_sort'
    },
    {
      id: 'sort5',
      text: 'Heap Sort algoritması nedir?',
      value: 'heap_sort'
    }
  ],
  
  // Arama algoritmaları alt kategorileri
  searching: [
    {
      id: 'search1',
      text: 'Linear Search nasıl çalışır?',
      value: 'linear_search'
    },
    {
      id: 'search2',
      text: 'Binary Search algoritması',
      value: 'binary_search'
    },
    {
      id: 'search3',
      text: 'Hash tabanlı arama yöntemleri',
      value: 'hash_search'
    },
    {
      id: 'search4',
      text: 'İkili arama ağacında arama',
      value: 'bst_search'
    }
  ],
  
  // Graf algoritmaları alt kategorileri
  graph: [
    {
      id: 'graph1',
      text: 'DFS (Depth First Search) algoritması',
      value: 'dfs'
    },
    {
      id: 'graph2',
      text: 'BFS (Breadth First Search) nasıl çalışır?',
      value: 'bfs'
    },
    {
      id: 'graph3',
      text: 'Dijkstra algoritması nedir?',
      value: 'dijkstra'
    },
    {
      id: 'graph4',
      text: 'Minimum Spanning Tree algoritmaları',
      value: 'mst'
    },
    {
      id: 'graph5',
      text: 'Topolojik sıralama nasıl yapılır?',
      value: 'topological_sort'
    }
  ],
  
  // Makine Öğrenmesi alt kategorileri
  machine_learning: [
    {
      id: 'ml1',
      text: 'Denetimli öğrenme algoritmaları',
      value: 'supervised_learning'
    },
    {
      id: 'ml2',
      text: 'Denetimsiz öğrenme yöntemleri',
      value: 'unsupervised_learning'
    },
    {
      id: 'ml3',
      text: 'Karar ağaçları nasıl çalışır?',
      value: 'decision_trees'
    },
    {
      id: 'ml4',
      text: 'Destek vektör makineleri (SVM)',
      value: 'svm'
    },
    {
      id: 'ml5',
      text: 'K-Means kümeleme algoritması',
      value: 'kmeans'
    }
  ],
  
  // Derin Öğrenme alt kategorileri
  deep_learning: [
    {
      id: 'dl1',
      text: 'Yapay sinir ağları nasıl çalışır?',
      value: 'neural_networks'
    },
    {
      id: 'dl2',
      text: 'CNN (Evrişimli Sinir Ağları) nedir?',
      value: 'cnn'
    },
    {
      id: 'dl3',
      text: 'RNN ve LSTM modelleri',
      value: 'rnn_lstm'
    },
    {
      id: 'dl4',
      text: 'Transformer mimarisi hakkında bilgi',
      value: 'transformers'
    }
  ]
};

// Algoritma kategorileri ve anahtar kelimeler
const algorithmKeywords = {
  sorting: ['sıralama', 'sort', 'düzenleme', 'bubble', 'quick', 'merge', 'insertion', 'selection', 'heap'],
  searching: ['arama', 'search', 'bulma', 'binary', 'linear', 'hash', 'ikili arama', 'doğrusal arama'],
  graph: ['graf', 'graph', 'ağaç', 'tree', 'dfs', 'bfs', 'dijkstra', 'yol bulma', 'path finding', 'en kısa yol', 'minimum spanning'],
  dynamic: ['dinamik', 'dynamic', 'programlama', 'programming', 'dp', 'optimizasyon'],
  beginner: ['başlangıç', 'beginner', 'temel', 'kolay'],
  data_structures: ['veri yapıları', 'veri yapısı', 'data structure', 'array', 'dizi', 'list', 'liste', 'tree', 'ağaç', 'queue', 'kuyruk', 'stack', 'yığın', 'hash'],
  machine_learning: ['makine öğrenmesi', 'ml', 'yapay zeka', 'ai', 'svm', 'karar ağacı', 'decision tree', 'regresyon', 'regression', 'sınıflandırma', 'classification', 'kümeleme', 'clustering'],
  deep_learning: ['derin öğrenme', 'deep learning', 'dl', 'neural network', 'sinir ağı', 'cnn', 'rnn', 'lstm', 'transformer']
};

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  
  // Chatbot açılma/kapanma animasyonu
  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 45,
        friction: 8
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: Dimensions.get('window').height,
        useNativeDriver: true,
        tension: 45,
        friction: 8
      }).start();
    }
  }, [isOpen, slideAnim]);
  
  // Chatbot ilk açıldığında karşılama mesajını göster
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: 'Merhaba! Ben algoritma asistanınızım. Size hangi konuda yardımcı olabilirim?',
        role: 'bot',
        timestamp: new Date(),
        options: predefinedQuestions
      };
      
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);
  
  // Mesajları en alt kısma kaydır
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  
  // Algoritmaları filtreleme
  const filterAlgorithmsByKeywords = (algorithms: any[], userQuery: string): any[] => {
    const normalizedQuery = userQuery.toLowerCase().trim();
    
    // Hangi kategorilerin anahtar kelimeleri eşleşiyor kontrol et
    const matchingCategories = Object.entries(algorithmKeywords)
      .filter(([_, keywords]) => 
        keywords.some(keyword => normalizedQuery.includes(keyword.toLowerCase()))
      )
      .map(([category]) => category);
    
    // Filtreleme işlemi
    return algorithms.filter(algo => {
      if (matchingCategories.length > 0) {
        const algoKeywords = (algo.title.toLowerCase() + ' ' + algo.description.toLowerCase());
        return matchingCategories.some(category => 
          algorithmKeywords[category as keyof typeof algorithmKeywords].some(keyword => 
            algoKeywords.includes(keyword.toLowerCase())
          )
        );
      }
      return false;
    });
  };
  
  // Chatbot yanıtlarını oluştur
  const generateResponseForQuery = (userQuery: string, algorithms: any[]): ChatMessage => {
    const matchingAlgorithms = filterAlgorithmsByKeywords(algorithms, userQuery);
    
    // Anahtar kelime kontrolü
    const queryLowerCase = userQuery.toLowerCase();
    
    // Özel durumlar
    if (queryLowerCase.includes('merhaba') || queryLowerCase.includes('selam')) {
      return {
        id: Date.now().toString(),
        content: 'Merhaba! Size algoritma konusunda nasıl yardımcı olabilirim?',
        role: 'bot',
        timestamp: new Date(),
        options: predefinedQuestions.slice(0, 4)
      };
    }
    
    if (queryLowerCase.includes('teşekkür')) {
      return {
        id: Date.now().toString(),
        content: 'Rica ederim! Başka bir sorunuz var mı?',
        role: 'bot',
        timestamp: new Date(),
        options: predefinedQuestions.slice(0, 4)
      };
    }
    
    // Alt kategori kontrolü - eğer sorgu bir kategori değerine eşleşiyorsa
    // o kategorinin alt sorularını göster
    const categoryValues = predefinedQuestions.map(q => q.value);
    for (const category of categoryValues) {
      if (userQuery === category && subCategoryQuestions[category]) {
        // Alt kategorilere ek olarak ana kategorilere dönüş seçeneği
        const subcategoryOptions = [...subCategoryQuestions[category]];
        subcategoryOptions.push({
          id: 'back_main',
          text: '« Ana Kategorilere Dön',
          value: 'main_categories'
        });
        
        return {
          id: Date.now().toString(),
          content: `${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} ile ilgili sorularınız için aşağıdaki seçeneklerden birini seçebilirsiniz:`,
          role: 'bot',
          timestamp: new Date(),
          options: subcategoryOptions
        };
      }
    }
    
    // Ana kategorilere dönüş seçeneği için özel yanıt
    if (userQuery === 'main_categories') {
      return {
        id: Date.now().toString(),
        content: 'Ana kategoriler burada. Hangi konuda yardım istersiniz?',
        role: 'bot',
        timestamp: new Date(),
        options: predefinedQuestions
      };
    }
    
    // Alt kategori sorguları için detaylı yanıtlar
    // Örneğin: bubble_sort, binary_search, dfs gibi
    if (userQuery.includes('_')) {
      // Bu basit bir demo için. Gerçek uygulamada her algoritma için özel yanıtlar oluşturulabilir
      const specificAlgorithm = matchingAlgorithms.find(algo => 
        algo.title.toLowerCase().includes(userQuery.split('_').join(' '))
      );
      
      if (specificAlgorithm) {
        // Gerçek API ID'sini veya bir özel ID oluştur
        const algorithmId = specificAlgorithm._id || specificAlgorithm.id || `algo_${Date.now()}`;
        
        console.log('Bulunan özel algoritma:', specificAlgorithm.title, 'ID:', algorithmId);
        
        return {
          id: Date.now().toString(),
          content: `${specificAlgorithm.title} algoritması hakkında bilgi:`,
          role: 'bot',
          timestamp: new Date(),
          suggestions: [{
            id: algorithmId,
            title: specificAlgorithm.title,
            description: specificAlgorithm.description,
            complexity: specificAlgorithm.complexity?.time?.average || specificAlgorithm.complexity?.time?.worst || specificAlgorithm.complexity || 'Belirtilmemiş',
            category: specificAlgorithm.category || 'Genel',
            difficulty: specificAlgorithm.difficulty || 'Orta'
          }]
        };
      }
    }
    
    // Algoritma öneri yanıtı
    if (matchingAlgorithms.length > 0) {
      const suggestions = matchingAlgorithms.slice(0, 3).map(algo => {
        // Gerçek API ID'sini veya bir özel ID oluştur
        const algorithmId = algo._id || algo.id || `algo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        return {
          id: algorithmId,
          title: algo.title,
          description: algo.description,
          complexity: algo.complexity?.time?.average || algo.complexity?.time?.worst || algo.complexity || 'Belirtilmemiş',
          category: algo.category || 'Genel',
          difficulty: algo.difficulty || 'Orta'
        };
      });
      
      console.log('Bulunan algoritmalar:', matchingAlgorithms.length, 'Öneriler:', suggestions.length);
      
      return {
        id: Date.now().toString(),
        content: `Aramanızla ilgili ${matchingAlgorithms.length} algoritma buldum. İşte en uygun olanlar:`,
        role: 'bot',
        timestamp: new Date(),
        suggestions
      };
    }
    
    // Sonuç bulunamazsa
    return {
      id: Date.now().toString(),
      content: 'Üzgünüm, aramanızla ilgili bir algoritma bulamadım. Farklı anahtar kelimelerle tekrar deneyebilir veya aşağıdaki kategorilerden birini seçebilirsiniz.',
      role: 'bot',
      timestamp: new Date(),
      options: predefinedQuestions
    };
  };
  
  // Kullanıcı mesajına yanıt ver
  const getChatbotResponse = async (userMessage: string): Promise<ChatMessage> => {
    try {
      const algorithms = await api.algorithms.getAll();
      return generateResponseForQuery(userMessage, algorithms);
    } catch (error) {
      console.error('Chatbot yanıtı oluşturulurken hata:', error);
      return {
        id: Date.now().toString(),
        content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        role: 'bot',
        timestamp: new Date()
      };
    }
  };
  
  // Kullanıcı mesajını gönder
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Kullanıcı mesajını ekle
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Chatbot yanıtını al
      const botResponse = await getChatbotResponse(inputValue);
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chatbot yanıtı alınırken hata:', error);
      
      // Hata mesajı göster
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Üzgünüm, yanıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        role: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Önceden tanımlı seçeneğe tıkla
  const handleOptionClick = async (option: ChatOption) => {
    // Kullanıcı seçeneğini mesaj olarak ekle
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: option.text,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Önceden tanımlı soruya yanıt al
      const botResponse = await getChatbotResponse(option.value);
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Önceden tanımlı soru yanıtı alınırken hata:', error);
      
      // Hata mesajı göster
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Üzgünüm, yanıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        role: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Algoritma detaylarına git
  const handleAlgorithmClick = (algorithmId: string) => {
    onClose();
    try {
      // Debug: Tüm mesajları ve önerileri logla
      console.log('Tüm mesajlar:', messages.length);
      const allSuggestions = messages.flatMap(msg => msg.suggestions || []);
      console.log('Tüm öneriler:', allSuggestions.length);
      
      // Seçilen algoritma önerisini bul
      const selectedSuggestion = messages.flatMap(msg => msg.suggestions || [])
        .find(suggestion => suggestion.id === algorithmId);
      
      console.log('Seçilen algoritma ID:', algorithmId);
      console.log('Bulunan algoritma:', selectedSuggestion);
      
      if (!selectedSuggestion) {
        console.error('Seçilen algoritma bulunamadı:', algorithmId);
        return;
      }
      
      // Algoritma detay sayfasının beklediği formatta algorithm nesnesi oluştur
      const algorithmObject = {
        id: selectedSuggestion.id,
        title: selectedSuggestion.title,
        description: selectedSuggestion.description,
        complexity: selectedSuggestion.complexity,
        category: selectedSuggestion.category,
        difficulty: selectedSuggestion.difficulty || 'Orta'
      };
      
      console.log('Oluşturulan algoritma nesnesi:', algorithmObject);
      
      // İlk önce navigation nesnesini kontrol et
      if (navigation) {
        // @ts-ignore - navigation türündeki type hatası için
        navigation.navigate('AlgorithmDetail', { algorithm: algorithmObject });
      } else {
        console.error('Navigation nesnesi tanımlı değil');
      }
    } catch (error) {
      console.error('Algoritma detayına yönlendirme hatası:', error);
      // Hata durumunda ana ekrana yönlendir
      if (navigation) {
        // @ts-ignore
        navigation.navigate('Home');
      }
    }
  };
  
  // Mesaj zamanını biçimlendir
  const formatTime = (timestamp: Date) => {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // ChatBot açık değilse hiçbir şey gösterme
  if (!isOpen) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Algoritma Asistanı</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessageContainer : styles.botMessageContainer
            ]}
          >
            <View style={[
              styles.messageContent,
              message.role === 'user' ? styles.userMessageContent : styles.botMessageContent
            ]}>
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.botMessageText
              ]}>
                {message.content}
              </Text>
              
              {/* Algoritma önerileri */}
              {message.suggestions && message.suggestions.length > 0 && (
                <View style={styles.suggestionContainer}>
                  {message.suggestions.map(suggestion => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.algorithmCard}
                      onPress={() => {
                        console.log('Algoritma kartına tıklandı:', suggestion.id, suggestion.title);
                        handleAlgorithmClick(suggestion.id);
                      }}
                    >
                      <Text style={styles.algorithmTitle}>{suggestion.title}</Text>
                      <Text style={styles.algorithmDescription} numberOfLines={2}>
                        {suggestion.description}
                      </Text>
                      <View style={styles.algorithmMeta}>
                        <Text style={styles.complexityText}>
                          Karmaşıklık: {suggestion.complexity}
                        </Text>
                        <View style={[
                          styles.difficultyBadge,
                          suggestion.difficulty === 'Kolay' ? styles.easyBadge :
                          suggestion.difficulty === 'Orta' ? styles.mediumBadge : 
                          styles.hardBadge
                        ]}>
                          <Text style={styles.difficultyText}>{suggestion.difficulty}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Önceden tanımlı seçenekler */}
              {message.options && message.options.length > 0 && (
                <View style={styles.optionsContainer}>
                  {message.options.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.optionButton}
                      onPress={() => handleOptionClick(option)}
                    >
                      <Text style={styles.optionText}>{option.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <Text style={[
              styles.timestampText,
              message.role === 'user' ? styles.userTimestamp : styles.botTimestamp
            ]}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.botMessageContainer}>
            <View style={styles.botMessageContent}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotMiddle]} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Bir şeyler yazın..."
          placeholderTextColor="#999"
          multiline
          maxLength={250}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputValue.trim() || isLoading) && styles.disabledButton
          ]}
          onPress={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: '90%',
    maxWidth: 350,
    height: '75%',
    maxHeight: 500,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6c5ce7',
    padding: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 16,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    borderRadius: 18,
    padding: 12,
  },
  userMessageContent: {
    backgroundColor: '#6c5ce7',
    borderBottomRightRadius: 4,
  },
  botMessageContent: {
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#343a40',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#adb5bd',
  },
  botTimestamp: {
    color: '#adb5bd',
  },
  suggestionContainer: {
    marginTop: 8,
  },
  algorithmCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  algorithmTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  algorithmDescription: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  algorithmMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complexityText: {
    fontSize: 10,
    color: '#6c757d',
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  easyBadge: {
    backgroundColor: '#27ae60',
  },
  mediumBadge: {
    backgroundColor: '#f39c12',
  },
  hardBadge: {
    backgroundColor: '#e74c3c',
  },
  difficultyText: {
    fontSize: 10,
    color: '#fff',
  },
  optionsContainer: {
    marginTop: 10,
    maxHeight: 200,
    overflow: 'hidden',
  },
  optionButton: {
    backgroundColor: '#f0f4f9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dce1e9',
  },
  optionText: {
    fontSize: 13,
    color: '#4a6583',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: '#343a40',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#6c5ce7',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#d1d1e0',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6c5ce7',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingDotMiddle: {
    marginTop: -5,
  },
});

export default ChatBot; 