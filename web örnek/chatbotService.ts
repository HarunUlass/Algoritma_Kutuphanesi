import { api } from './apiClient';

// Chatbot mesaj tipleri
export type MessageRole = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  options?: ChatOption[];
  suggestions?: AlgorithmSuggestion[];
}

export interface ChatOption {
  id: string;
  text: string;
  value: string;
}

// Algoritma öneri sonucu
export interface AlgorithmSuggestion {
  id: string;
  title: string;
  description: string;
  complexity: string;
  category: string;
  difficulty?: string;
  link: string;
}

// Önceden tanımlanmış soru ve yanıtlar
export const predefinedQuestions = [
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
    text: 'Başlangıç seviyesi için hangi algoritmaları öğrenmeliyim?',
    value: 'beginner'
  }
];

// Algoritma kategorileri ve anahtar kelimeler
const algorithmKeywords = {
  sorting: ['sıralama', 'sort', 'düzenleme', 'bubble', 'quick', 'merge', 'insertion', 'selection'],
  searching: ['arama', 'search', 'bulma', 'binary', 'linear', 'hash'],
  graph: ['graf', 'graph', 'ağaç', 'tree', 'dfs', 'bfs', 'dijkstra', 'yol bulma', 'path finding'],
  dynamic: ['dinamik', 'dynamic', 'programlama', 'programming', 'dp', 'optimizasyon', 'memoization'],
  recursive: ['özyinelemeli', 'rekürsif', 'recursive', 'recursion'],
  dataStructure: ['veri yapısı', 'data structure', 'heap', 'stack', 'queue', 'linked list', 'bağlı liste'],
  beginner: ['başlangıç', 'beginner', 'temel', 'kolay'],
  advanced: ['ileri', 'advanced', 'zor', 'karmaşık']
};

// Algoritma önerilerini anahtar kelime eşleşmesine göre filtrele
const filterAlgorithmsByKeywords = (algorithms: any[], userQuery: string): any[] => {
  const normalizedQuery = userQuery.toLowerCase().trim();
  
  // Hangi kategorilerin anahtar kelimeleri eşleşiyor kontrol et
  const matchingCategories = Object.entries(algorithmKeywords)
    .filter(([_, keywords]) => 
      keywords.some(keyword => normalizedQuery.includes(keyword.toLowerCase()))
    )
    .map(([category]) => category);
  
  // Zorluk seviyesi kontrolü
  const difficultyMap: Record<string, string[]> = {
    beginner: ['Kolay'],
    intermediate: ['Orta'],
    advanced: ['Zor']
  };
  
  const matchingDifficulties: string[] = [];
  Object.entries(difficultyMap).forEach(([level, keywords]) => {
    if (matchingCategories.includes(level)) {
      matchingDifficulties.push(...keywords);
    }
  });
  
  // Filtreleme işlemi
  return algorithms.filter(algo => {
    // Kategori eşleşmesi
    if (matchingCategories.length > 0) {
      const algoKeywords = algo.title.toLowerCase() + ' ' + algo.description.toLowerCase();
      const categoryMatch = matchingCategories.some(category => 
        algorithmKeywords[category as keyof typeof algorithmKeywords].some(keyword => 
          algoKeywords.includes(keyword.toLowerCase())
        )
      );
      
      if (!categoryMatch) return false;
    }
    
    // Zorluk seviyesi eşleşmesi
    if (matchingDifficulties.length > 0 && algo.difficulty) {
      if (!matchingDifficulties.includes(algo.difficulty)) return false;
    }
    
    return true;
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
      options: predefinedQuestions.slice(0, 3) // İlk 3 önceden tanımlı soruyu göster
    };
  }
  
  if (queryLowerCase.includes('teşekkür')) {
    return {
      id: Date.now().toString(),
      content: 'Rica ederim! Başka bir sorunuz var mı?',
      role: 'bot',
      timestamp: new Date(),
      options: predefinedQuestions.slice(3) // Son 2 önceden tanımlı soruyu göster
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
      difficulty: algo.difficulty || 'Orta',
      link: `/algorithm/${algo.title}`
    }));
    
    return {
      id: Date.now().toString(),
      content: `Aramanızla ilgili ${matchingAlgorithms.length} algoritma buldum. İşte en uygun olanlar:`,
      role: 'bot',
      timestamp: new Date(),
      options: [
        {
          id: 'more',
          text: 'Daha fazla algoritma göster',
          value: 'more_algorithms'
        },
        {
          id: 'refine',
          text: 'Aramayı daralt',
          value: 'refine_search'
        }
      ],
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

// Tüm algoritmaları getir
export const getAllAlgorithms = async (): Promise<any[]> => {
  try {
    return await api.algorithms.getAll();
  } catch (error) {
    console.error('Algoritma verileri alınırken hata:', error);
    return [];
  }
};

// Kullanıcı mesajına yanıt ver
export const getChatbotResponse = async (userMessage: string): Promise<ChatMessage> => {
  try {
    const algorithms = await getAllAlgorithms();
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

// Önceden tanımlı bir soruya göre yanıt ver
export const getResponseForPredefinedQuestion = async (questionValue: string): Promise<ChatMessage> => {
  const algorithms = await getAllAlgorithms();
  return generateResponseForQuery(questionValue, algorithms);
}; 