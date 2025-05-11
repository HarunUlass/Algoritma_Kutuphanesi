import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import ChatBot from './ChatBot';

const ChatBotTrigger: React.FC = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  
  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };
  
  return (
    <>
      <TouchableOpacity 
        style={[
          styles.chatbotTrigger,
          isChatbotOpen && styles.chatbotTriggerActive
        ]}
        onPress={toggleChatbot}
      >
        <Text style={styles.chatbotIcon}>
          {isChatbotOpen ? '×' : '💬'}
        </Text>
      </TouchableOpacity>
      
      <ChatBot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  chatbotTrigger: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#6c5ce7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  chatbotTriggerActive: {
    backgroundColor: '#e74c3c',
  },
  chatbotIcon: {
    fontSize: 24,
    color: '#fff',
  }
});

export default ChatBotTrigger; 