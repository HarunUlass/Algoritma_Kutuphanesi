import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChatMessage, 
  ChatOption,
  AlgorithmSuggestion,
  getChatbotResponse, 
  getResponseForPredefinedQuestion,
  predefinedQuestions
} from '../services/chatbotService';
import '../styles/ChatBot.css';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Kullanıcı mesajını gönder
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const botResponse = await getResponseForPredefinedQuestion(option.value);
      
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
  const handleAlgorithmClick = (algorithm: AlgorithmSuggestion) => {
    onClose();
    navigate(algorithm.link);
  };
  
  // Mesaj zamanını biçimlendir
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };
  
  // ChatBot açık değilse hiçbir şey gösterme
  if (!isOpen) return null;
  
  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Algoritma Asistanı</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="chatbot-messages">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              <p>{message.content}</p>
              
              {/* Algoritma önerileri */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="algorithm-suggestions">
                  {message.suggestions.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className="algorithm-card"
                      onClick={() => handleAlgorithmClick(suggestion)}
                    >
                      <h4>{suggestion.title}</h4>
                      <p className="algo-description">{suggestion.description}</p>
                      <div className="algo-meta">
                        <span className="complexity">Karmaşıklık: {suggestion.complexity}</span>
                        <span 
                          className="difficulty"
                          style={{ 
                            backgroundColor: 
                              suggestion.difficulty === 'Kolay' ? '#27ae60' : 
                              suggestion.difficulty === 'Orta' ? '#f39c12' : '#e74c3c'
                          }}
                        >
                          {suggestion.difficulty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Önceden tanımlı seçenekler */}
              {message.options && message.options.length > 0 && (
                <div className="message-options">
                  {message.options.map(option => (
                    <button 
                      key={option.id} 
                      className="option-button"
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="message-time">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot-message loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chatbot-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Bir şeyler yazın..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isLoading}
        >
          Gönder
        </button>
      </form>
    </div>
  );
};

export default ChatBot; 