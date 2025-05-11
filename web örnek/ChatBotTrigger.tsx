import React, { useState } from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import ChatBot from './ChatBot';
import '../styles/ChatBot.css';

const ChatBotTrigger: React.FC = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  
  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };
  
  return (
    <>
      <div 
        className="chatbot-trigger"
        onClick={toggleChatbot}
        title={isChatbotOpen ? "Chatbot'u kapat" : "Algoritma Asistanı ile sohbet et"}
      >
        {isChatbotOpen ? <FaTimes className="chatbot-trigger-icon" /> : <FaRobot className="chatbot-trigger-icon" />}
      </div>
      
      <ChatBot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </>
  );
};

export default ChatBotTrigger; 