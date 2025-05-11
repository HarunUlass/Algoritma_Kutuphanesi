// Quiz servis fonksiyonları
// Quiz ile ilgili tüm işlemleri yönetir

import { api } from './apiClient';
import { API_BASE_URL } from '../../App';

// Arayüzler
export interface Option {
  _id?: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface MultipleChoiceQuestion {
  _id?: string;
  question: string;
  options: Option[];
}

export interface CodeCompletionQuestion {
  _id?: string;
  question: string;
  codeTemplate: string;
  solution?: string;
  hints: string[];
}

export interface Quiz {
  _id: string;
  algorithmId?: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  totalPoints: number;
  passingScore: number;
  multipleChoiceQuestions: MultipleChoiceQuestion[];
  codeCompletionQuestions: CodeCompletionQuestion[];
}

export interface MultipleChoiceAnswer {
  questionIndex: number;
  selectedOptions: number[];
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface CodeCompletionAnswer {
  questionIndex: number;
  userCode: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  feedback?: string;
}

export interface QuizAttempt {
  _id?: string;
  userId: string;
  quizId: string;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  multipleChoiceAnswers: MultipleChoiceAnswer[];
  codeCompletionAnswers: CodeCompletionAnswer[];
  score: number;
  totalPossible?: number;
  passed: boolean;
  badges?: Badge[];
  xpUpdate?: XpUpdate;
  isFallback?: boolean;
}

export interface Badge {
  type: string;
  name: string;
  icon: string;
  xpReward: number;
}

export interface XpUpdate {
  gained: number;
  levelUp: boolean;
  newLevel?: number;
}

// Quiz verilerini getir
export const getQuizById = async (quizId: string): Promise<Quiz | null> => {
  try {
    const quizData = await api.quizzes.getById(quizId);
    return quizData;
  } catch (error) {
    console.error('Quiz verisi alınırken hata:', error);
    return null;
  }
};

// Quiz'i başlat
export const startQuiz = async (quizId: string, userId: string): Promise<{quiz: Quiz, attemptId: string} | null> => {
  try {
    const response = await api.quizzes.start(quizId, userId);
    return {
      quiz: response,
      attemptId: response.attemptId
    };
  } catch (error) {
    console.error('Quiz başlatılırken hata:', error);
    return null;
  }
};

// Çoktan seçmeli soru cevabını gönder
export const submitMultipleChoiceAnswer = async (
  attemptId: string, 
  questionIndex: number, 
  selectedOptions: number[],
  quizId?: string // Misafir kullanıcılar için
): Promise<{isCorrect: boolean, pointsEarned: number} | null> => {
  try {
    const response = await api.quizzes.submitMultipleChoice(attemptId, questionIndex, selectedOptions, quizId);
    return response;
  } catch (error) {
    console.error('Çoktan seçmeli soru cevabı gönderilirken hata:', error);
    return null;
  }
};

// Kod tamamlama sorusu cevabını gönder
export const submitCodeCompletionAnswer = async (
  attemptId: string, 
  questionIndex: number, 
  userCode: string,
  quizId?: string // Misafir kullanıcılar için
): Promise<{isCorrect: boolean, pointsEarned: number, feedback: string} | null> => {
  try {
    const response = await api.quizzes.submitCodeCompletion(attemptId, questionIndex, userCode, quizId);
    return response;
  } catch (error) {
    console.error('Kod tamamlama sorusu cevabı gönderilirken hata:', error);
    return null;
  }
};

// Quiz sonuçlarını hesapla (client-side)
export const calculateQuizResults = (quiz: Quiz, attempt: QuizAttempt): QuizAttempt => {
  let totalScore = 0;
  
  // Çoktan seçmeli soruların puanlarını topla
  attempt.multipleChoiceAnswers.forEach(answer => {
    if (answer.isCorrect) {
      totalScore += answer.pointsEarned || 0;
    }
  });
  
  // Kod tamamlama sorularının puanlarını topla
  attempt.codeCompletionAnswers.forEach(answer => {
    if (answer.isCorrect) {
      totalScore += answer.pointsEarned || 0;
    }
  });
  
  // Girişimi güncelle
  const updatedAttempt: QuizAttempt = {
    ...attempt,
    endTime: new Date(),
    completed: true,
    score: totalScore,
    totalPossible: quiz.totalPoints,
    passed: totalScore >= quiz.passingScore
  };
  
  return updatedAttempt;
};

// Quiz girişimini gönder
export const submitQuizAttempt = async (attempt: QuizAttempt): Promise<any> => {
  try {
    // API'ye gönderilecek verileri hazırla
    // Misafir kullanıcılar için quizId gereklidir
    const response = await api.quizzes.finish(
      attempt._id || 'temp', 
      attempt.quizId,
      attempt.multipleChoiceAnswers,
      attempt.codeCompletionAnswers
    );
    
    return {
      ...response,
      badges: response.badges || [],
      xpUpdate: response.xpUpdate || { gained: 0, levelUp: false }
    };
  } catch (error) {
    console.error('Quiz sonuçları gönderilirken hata:', error);
    // Hata durumunda varsayılan sonuçları döndür
    return {
      score: attempt.score,
      totalPossible: attempt.totalPossible,
      passed: attempt.passed,
      badges: [],
      xpUpdate: { gained: 0, levelUp: false }
    };
  }
};

// Quiz girişim detaylarını getir
export const getQuizAttemptDetails = async (
  attemptId: string,
  fallbackData?: {
    quizId?: string;
    score?: number; 
    totalPossible?: number;
    passed?: boolean;
  }
): Promise<QuizAttempt | null> => {
  try {
    // API URL'yi log ile kontrol et
    const apiUrl = `${API_BASE_URL}/quiz-attempts/${attemptId}`;
    console.log('API isteği yapılıyor:', apiUrl);
    
    // Öncelikle API'den veriyi almaya çalış
    const response = await fetch(apiUrl);
    console.log('API yanıt durum kodu:', response.status);
    
    // API'den veri başarıyla alındıysa döndür
    if (response.ok) {
      const data = await response.json();
      console.log('API verisi başarıyla alındı');
      return data;
    }
    
    // API'den veri alınamazsa ve fallback veri varsa
    if (fallbackData) {
      console.log('API hatası (Durum Kodu:', response.status, '). Fallback verisi kullanılıyor:', fallbackData);
      
      try {
        // API hatası hakkında daha fazla bilgi almaya çalış
        const errorText = await response.text();
        console.log('API hata detayı:', errorText);
      } catch (textError) {
        console.log('API hata detayı alınamadı');
      }
      
      // Quiz bilgilerine erişmeye çalış
      let quizDetails = null;
      if (fallbackData.quizId) {
        try {
          const quizUrl = `${API_BASE_URL}/quizzes/${fallbackData.quizId}`;
          console.log('Quiz verisi istek URL:', quizUrl);
          
          const quizResponse = await fetch(quizUrl);
          console.log('Quiz API yanıt durum kodu:', quizResponse.status);
          
          if (quizResponse.ok) {
            quizDetails = await quizResponse.json();
            console.log('Quiz verisi başarıyla alındı');
          } else {
            console.error('Quiz API hatası:', quizResponse.status);
          }
        } catch (quizError) {
          console.error('Quiz verisi yüklenemedi:', quizError);
        }
      }
      
      // Fallback verisi oluştur
      return createFallbackQuizAttempt(fallbackData, quizDetails);
    }
    
    // Hem API'den veri alınamadı hem de fallback veri yok
    console.error('Quiz girişim verisi alınamadı. API kodu:', response.status);
    return null;
  } catch (error) {
    console.error('Quiz girişim detayları alınırken hata:', error);
    
    // Hata durumunda fallback varsa kullan
    if (fallbackData) {
      return createFallbackQuizAttempt(fallbackData);
    }
    
    return null;
  }
};

// Fallback quiz girişimi oluştur
const createFallbackQuizAttempt = (
  fallbackData: {
    quizId?: string;
    score?: number;
    totalPossible?: number;
    passed?: boolean;
  },
  quizDetails?: any
): QuizAttempt => {
  return {
    _id: 'fallback_' + Date.now(),
    userId: 'guest', // Geçici kullanıcı ID'si ekle
    quizId: fallbackData.quizId || '',
    score: fallbackData.score !== undefined ? fallbackData.score : 0,
    totalPossible: fallbackData.totalPossible !== undefined ? fallbackData.totalPossible : 0,
    passed: fallbackData.passed !== undefined ? fallbackData.passed : false,
    startTime: new Date(),
    endTime: new Date(),
    completed: true,
    multipleChoiceAnswers: quizDetails?.multipleChoiceQuestions?.map((_: any, index: number) => ({
      questionIndex: index,
      isCorrect: false,
      selectedOptions: [],
      pointsEarned: 0
    })) || [],
    codeCompletionAnswers: quizDetails?.codeCompletionQuestions?.map((_: any, index: number) => ({
      questionIndex: index, 
      isCorrect: false,
      userCode: '',
      pointsEarned: 0
    })) || [],
    isFallback: true // Bunun fallback veri olduğunu işaretlemek için özel alan
  };
}; 