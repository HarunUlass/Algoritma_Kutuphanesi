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
  }
];

// Algoritma kategorileri ve anahtar kelimeler
const algorithmKeywords = {
  sorting: ['sıralama', 'sort', 'düzenleme', 'bubble', 'quick', 'merge', 'insertion', 'selection'],
  searching: ['arama', 'search', 'bulma', 'binary', 'linear', 'hash'],
  graph: ['graf', 'graph', 'ağaç', 'tree', 'dfs', 'bfs', 'dijkstra', 'yol bulma', 'path finding'],
  dynamic: ['dinamik', 'dynamic', 'programlama', 'programming', 'dp', 'optimizasyon'],
  beginner: ['başlangıç', 'beginner', 'temel', 'kolay']
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
        options: predefinedQuestions.slice(0, 4)
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
        options: predefinedQuestions.slice(0, 3)
      };
    }
    
    if (queryLowerCase.includes('teşekkür')) {
      return {
        id: Date.now().toString(),
        content: 'Rica ederim! Başka bir sorunuz var mı?',
        role: 'bot',
        timestamp: new Date(),
        options: predefinedQuestions.slice(2)
      };
    }
    
    // Algoritma öneri yanıtı
    if (matchingAlgorithms.length > 0) {
      const suggestions = matchingAlgorithms.slice(0, 3).map(algo => ({
        id: algo._id || algo.id,
        title: algo.title,
        description: algo.description,
        complexity: algo.complexity?.time?.average || algo.complexity?.time?.worst || algo.complexity || 'Belirtilmemiş',
        category: algo.category || 'Genel',
        difficulty: algo.difficulty || 'Orta'
      }));
      
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
    // @ts-ignore - navigation türündeki type hatası için
    navigation.navigate('AlgorithmDetail', { algorithmId });
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
                      onPress={() => handleAlgorithmClick(suggestion.id)}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6c5ce7',
    borderRadius: 16,
    padding: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 12,
    color: '#6c5ce7',
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