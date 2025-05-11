// API istemcisi
// App.tsx'teki API_BASE_URL'yi kullanarak API isteklerini yönetir

// API Base URL'yi doğrudan içe aktarıyoruz
// Bu, App.tsx'te export edilmiş olmalıdır
import { API_BASE_URL } from '../../App';

// Yardımcı fonksiyonlar
const fetchWithRetry = async (url: string, options?: RequestInit, retries = 2, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`Yeniden deneniyor (${retries} kalan)...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
};

// API'nin kullanılabilir endpointleri
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    },
    register: async (email: string, username: string, password: string) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });
      return await response.json();
    },
  },
  
  quizzes: {
    getAll: async () => {
      const response = await fetchWithRetry(`${API_BASE_URL}/quizzes`);
      return await response.json();
    },
    
    getById: async (quizId: string) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/quizzes/${quizId}`);
      return await response.json();
    },
    
    start: async (quizId: string, userId: string) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      return await response.json();
    },
    
    submitMultipleChoice: async (attemptId: string, questionIndex: number, selectedOptions: number[], quizId?: string) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/quiz-attempts/${attemptId}/multiple-choice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionIndex, selectedOptions, quizId }),
      });
      return await response.json();
    },
    
    submitCodeCompletion: async (attemptId: string, questionIndex: number, userCode: string, quizId?: string) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/quiz-attempts/${attemptId}/code-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionIndex, userCode, quizId }),
      });
      return await response.json();
    },
    
    finish: async (attemptId: string, quizId?: string, multipleChoiceAnswers?: any[], codeCompletionAnswers?: any[]) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/quiz-attempts/${attemptId}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId, multipleChoiceAnswers, codeCompletionAnswers }),
      });
      return await response.json();
    },
    
    getAttempt: async (attemptId: string, sessionParams?: {
      quizId?: string;
      score?: number;
      totalPossible?: number;
      passed?: boolean;
    }) => {
      try {
        // İlk olarak API çağrısını deneyin
        const response = await fetchWithRetry(`${API_BASE_URL}/quiz-attempts/${attemptId}`, undefined, 1);
        
        if (!response.ok) {
          // API hatası durumunda, Sessşon parametreleri varsa fallback data oluştur
          console.error(`Quiz girişim API hatası: ${response.status}`);
          
          if (sessionParams) {
            console.log('API erişilemedi, geçici sonuç verisi oluşturuluyor...');
            // Geçici bir sonuç objesi oluştur
            return {
              _id: attemptId,
              quizId: sessionParams.quizId || '',
              score: sessionParams.score || 0,
              totalPossible: sessionParams.totalPossible || 0,
              passed: sessionParams.passed || false,
              multipleChoiceAnswers: [],
              codeCompletionAnswers: [],
              isFallback: true,
              apiError: response.status,
              message: 'Geçici sonuç bilgileri - API bağlantısı sağlanamadı'
            };
          }
          return null;
        }
        
        return await response.json();
      } catch (error) {
        console.error('Quiz girişim verisi alınırken hata:', error);
        
        // Ağ hatası durumunda session parametreleri varsa yedek veri oluştur
        if (sessionParams) {
          console.log('API erişilemedi, geçici sonuç verisi oluşturuluyor...');
          return {
            _id: attemptId,
            quizId: sessionParams.quizId || '',
            score: sessionParams.score || 0,
            totalPossible: sessionParams.totalPossible || 0,
            passed: sessionParams.passed || false, 
            multipleChoiceAnswers: [],
            codeCompletionAnswers: [],
            isFallback: true,
            networkError: true,
            message: 'Geçici sonuç bilgileri - Ağ hatası'
          };
        }
        return null;
      }
    }
  },
  
  algorithms: {
    getAll: async () => {
      const response = await fetchWithRetry(`${API_BASE_URL}/algorithms`);
      return await response.json();
    },
    
    getById: async (algorithmId: string) => {
      const response = await fetchWithRetry(`${API_BASE_URL}/algorithms/${algorithmId}`);
      return await response.json();
    }
  },
  
  users: {
    getQuizStats: async (userId: string) => {
      if (!userId) {
        throw new Error('Geçersiz kullanıcı ID: tanımlı değil');
      }
      const response = await fetchWithRetry(`${API_BASE_URL}/users/${userId}/quiz-stats`);
      return await response.json();
    },
    
    getProgress: async (userId: string) => {
      if (!userId) {
        throw new Error('Geçersiz kullanıcı ID: tanımlı değil');
      }
      const response = await fetchWithRetry(`${API_BASE_URL}/users/${userId}/progress`);
      return await response.json();
    },
    
    getAchievements: async (userId: string) => {
      if (!userId) {
        throw new Error('Geçersiz kullanıcı ID: tanımlı değil');
      }
      const response = await fetchWithRetry(`${API_BASE_URL}/users/${userId}/achievements`);
      if (!response.ok) {
        throw new Error(`Kullanıcı rozetleri alınamadı: ${response.status}`);
      }
      return await response.json();
    },
    
    getRecentlyViewedAlgorithms: async (userId: string, limit = 10) => {
      if (!userId) {
        throw new Error('Geçersiz kullanıcı ID: tanımlı değil');
      }
      try {
        const response = await fetchWithRetry(`${API_BASE_URL}/users/${userId}/recently-viewed-algorithms?limit=${limit}`);
        if (!response.ok) {
          console.error('Son görüntülenen algoritmalar getirilemedi:', await response.text());
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error('Son görüntülenen algoritmalar getirilemedi:', error);
        return [];
      }
    },
    
    getProfile: async (userId: string) => {
      if (!userId) {
        throw new Error('Geçersiz kullanıcı ID: tanımlı değil');
      }
      const response = await fetchWithRetry(`${API_BASE_URL}/users/${userId}`);
      if (!response.ok) {
        throw new Error(`Kullanıcı profili alınamadı: ${response.status}`);
      }
      return await response.json();
    },
    
    updateProfile: async (userId: string, updateData: {
      username?: string;
      email?: string;
      password?: string;
      currentPassword?: string;
    }) => {
      if (!userId) {
        throw new Error('Geçersiz kullanıcı ID: tanımlı değil');
      }
      const response = await fetchWithRetry(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      return await response.json();
    }
  }
}; 