import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { AuthContext, API_BASE_URL } from '../../App';
import { getQuizAttemptDetails, getQuizById, Quiz, QuizAttempt, MultipleChoiceQuestion, CodeCompletionQuestion } from '../services/quizService';

const QuizResultScreen = ({ route, navigation }: any) => {
  const { attemptId, quizId, quizTitle, score, totalPossible, passed } = route.params;
  const { isLoggedIn } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoggedIn) {
      navigation.replace('Home');
      return;
    }
    
    loadResultDetails();
  }, []);
  
  const loadResultDetails = async () => {
    try {
      setLoading(true);
      console.log(`Sonuç detayları yükleniyor: quizId=${quizId}, attemptId=${attemptId}`);
      
      // 1. Quiz verilerini doğrudan yükle (doğru cevapları göstermek için)
      let quizData = await fetchQuizData(quizId);
      
      // 2. Quiz girişim verilerini yükle
      console.log('getQuizAttemptDetails fonksiyonu çağrılıyor...');
      let attemptData = await getQuizAttemptDetails(attemptId, {
            quizId,
            score,
            totalPossible,
        passed
      });
      
      console.log('getQuizAttemptDetails sonucu:', attemptData ? 'Veri alındı' : 'Veri alınamadı');
      if (attemptData) {
        console.log('Attempt veri türü:', typeof attemptData);
        console.log('Attempt özellikleri:', Object.keys(attemptData));
        console.log('Attempt ID:', attemptData._id);
        console.log('isFallback?', attemptData.isFallback);
        
        // Veriyi state'e kaydet
        setAttempt(attemptData);
      }
      
    } catch (error) {
      console.error('Quiz sonuçları yüklenirken beklenmeyen hata:', error);
      setErrorMessage('Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };
  
  // Quiz verilerini getir
  const fetchQuizData = async (quizId: string) => {
    try {
      // Doğrudan API isteği yap
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
      
      if (!response.ok) {
        console.error(`Quiz verisi alınamadı: ${response.status}`);
        return null;
      }
      
      const quizData = await response.json();
      console.log('Quiz verileri başarıyla yüklendi');
      setQuiz(quizData);
      return quizData;
    } catch (error) {
      console.error('Quiz verisi yüklenirken hata:', error);
      return null;
    }
  };
  
  // Çoktan seçmeli soruları render et
  const renderMultipleChoiceQuestion = ({ item, index }: { item: any, index: number }) => {
    if (!quiz) return null;
    
    // Quiz'den soru bilgisini al
    const question = quiz.multipleChoiceQuestions[item.questionIndex];
    if (!question) return null;
    
    // Kullanıcı cevabı
    const userAnswer = item;
    const isCorrect = userAnswer.isCorrect;
    
    return (
      <View style={[styles.questionCard, isCorrect ? styles.correctCard : styles.incorrectCard]}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Soru {item.questionIndex + 1}</Text>
          <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
            <Text style={styles.resultBadgeText}>
              {isCorrect ? 'Doğru' : 'Yanlış'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.optionsContainer}>
          {question.options.map((option, optIndex) => {
            const isSelected = Array.isArray(userAnswer.selectedOptions) && 
                              userAnswer.selectedOptions.includes(optIndex);
            const isCorrectOption = option.isCorrect;
            
            let optionStyle = styles.option;
            let optionTextStyle = styles.optionText;
            
            if (isSelected && isCorrectOption) {
              // Doğru seçilmiş
              optionStyle = styles.correctSelectedOption;
              optionTextStyle = styles.correctOptionText;
            } else if (isSelected && !isCorrectOption) {
              // Yanlış seçilmiş
              optionStyle = styles.incorrectSelectedOption;
              optionTextStyle = styles.incorrectOptionText;
            } else if (!isSelected && isCorrectOption) {
              // Doğru ama seçilmemiş
              optionStyle = styles.correctUnselectedOption;
            }
            
            return (
              <View key={optIndex} style={optionStyle}>
                <View style={styles.optionLetterContainer}>
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + optIndex)}</Text>
                </View>
                <Text style={optionTextStyle}>{option.text}</Text>
                
                {isCorrectOption && (
                  <Text style={styles.correctAnswerText}>✓ Doğru Cevap</Text>
                )}
              </View>
            );
          })}
        </View>
        
        {!isCorrect && question.options.filter(opt => opt.isCorrect && opt.explanation).length > 0 && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Açıklama:</Text>
            {question.options
              .filter(option => option.isCorrect && option.explanation)
              .map((option, i) => (
                <Text key={i} style={styles.explanationText}>{option.explanation}</Text>
              ))}
          </View>
        )}
        
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>
            Kazanılan Puan: {userAnswer.pointsEarned || 0} / 10
              </Text>
            </View>
          </View>
    );
  };
  
  // Kod tamamlama sorularını render et
  const renderCodeCompletionQuestion = ({ item, index }: { item: any, index: number }) => {
    if (!quiz) return null;
    
    // Quiz'den soru bilgisini al
    const question = quiz.codeCompletionQuestions[item.questionIndex];
    if (!question) return null;
    
    // Kullanıcı cevabı
    const userAnswer = item;
    const isCorrect = userAnswer.isCorrect;
    const startIndex = quiz.multipleChoiceQuestions.length; 
    
    return (
      <View style={[styles.questionCard, isCorrect ? styles.correctCard : styles.incorrectCard]}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Soru {startIndex + item.questionIndex + 1}</Text>
          <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
            <Text style={styles.resultBadgeText}>
              {isCorrect ? 'Doğru' : 'Yanlış'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Sizin Kodunuz:</Text>
          <Text style={styles.codeText}>{userAnswer.userCode || '// Kod bulunamadı'}</Text>
        </View>
        
          <View style={styles.solutionContainer}>
          <Text style={styles.solutionLabel}>Doğru Çözüm:</Text>
          <Text style={styles.solutionText}>{question.solution || '// Çözüm bulunamadı'}</Text>
          </View>
        
        {userAnswer.feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Geri Bildirim:</Text>
            <Text style={styles.feedbackText}>{userAnswer.feedback}</Text>
          </View>
        )}
        
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>
            Kazanılan Puan: {userAnswer.pointsEarned || 0} / 20
          </Text>
        </View>
      </View>
    );
  };
  
  // Fetch algorithm by ID
  const fetchAlgorithmById = async (algorithmId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/algorithms/id/${algorithmId}`);
      if (!response.ok) {
        console.error('Algorithm fetch error:', response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching algorithm:', error);
      return null;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Sonuçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (errorMessage) {
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Hata</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Quiz detayları veya attempt detayları yoksa basit sonuç ekranı göster
  if (!quiz || !attempt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
              onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
            <Text style={styles.title}>{quizTitle || 'Quiz'} Sonuçları</Text>
      </View>
      
          <View style={styles.fallbackContainer}>
            <View style={styles.scoreCard}>
              <View style={[styles.scoreCircle, passed ? styles.passedScore : styles.failedScore]}>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreTotal}>/ {totalPossible}</Text>
          </View>
          
              <Text style={styles.scoreLabel}>
                {passed ? 'Tebrikler! Başarılı oldunuz.' : 'Üzgünüz, başarısız oldunuz.'}
            </Text>
          </View>
          
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={() => loadResultDetails()}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>Yeniden Dene</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{quiz.title} Sonuçları</Text>
        </View>
        
        <View style={styles.scoreSection}>
          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, attempt.passed ? styles.passedScore : styles.failedScore]}>
              <Text style={styles.scoreValue}>{attempt.score}</Text>
              <Text style={styles.scoreTotal}>/ {attempt.totalPossible || quiz.totalPoints}</Text>
            </View>
            
            <Text style={styles.scoreLabel}>
              {attempt.passed ? 'Tebrikler! Başarılı oldunuz.' : 'Üzgünüz, başarısız oldunuz.'}
            </Text>
            
            <Text style={styles.passingScore}>
              Geçme Puanı: {quiz.passingScore} ({Math.round((quiz.passingScore / quiz.totalPoints) * 100)}%)
            </Text>
          </View>
        </View>
        
        <ScrollView style={styles.questionsContainer}>
          {attempt.multipleChoiceAnswers && attempt.multipleChoiceAnswers.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Çoktan Seçmeli Sorular</Text>
              <FlatList
                data={attempt.multipleChoiceAnswers}
                renderItem={renderMultipleChoiceQuestion}
                keyExtractor={(item, index) => `mc-${index}`}
                scrollEnabled={false}
              />
            </View>
          )}
          
          {attempt.codeCompletionAnswers && attempt.codeCompletionAnswers.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Kod Tamamlama Soruları</Text>
              <FlatList
                data={attempt.codeCompletionAnswers}
                renderItem={renderCodeCompletionQuestion}
                keyExtractor={(item, index) => `code-${index}`}
                scrollEnabled={false}
              />
            </View>
          )}
          
          <View style={styles.buttonRow}>
              <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Home')}
              >
              <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
              </TouchableOpacity>
          
              <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                // Redirect to the quiz list or retake the current quiz
                if (quiz && quiz._id) {
                  navigation.navigate('Quiz', { quizId: quiz._id });
                } else {
                  navigation.navigate('Home');
                }
              }}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Yeniden Dene
              </Text>
              </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  fallbackContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fallbackMessage: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  scoreSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  passedScore: {
    backgroundColor: '#28A745',
  },
  failedScore: {
    backgroundColor: '#DC3545',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreTotal: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  passingScore: {
    fontSize: 14,
    color: '#6C757D',
  },
  questionsContainer: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  correctCard: {
    borderColor: '#28A74520',
    backgroundColor: '#28A74510',
  },
  incorrectCard: {
    borderColor: '#DC354520',
    backgroundColor: '#DC354510',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  correctBadge: {
    backgroundColor: '#28A74520',
  },
  incorrectBadge: {
    backgroundColor: '#DC354520',
  },
  resultBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    marginBottom: 8,
  },
  correctSelectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#28A745',
    backgroundColor: '#28A74520',
    borderRadius: 8,
    marginBottom: 8,
  },
  incorrectSelectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DC3545',
    backgroundColor: '#DC354520',
    borderRadius: 8,
    marginBottom: 8,
  },
  correctUnselectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#28A745',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionLetterContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  optionText: {
    fontSize: 15,
    color: '#212529',
    flex: 1,
  },
  correctOptionText: {
    fontSize: 15,
    color: '#28A745',
    fontWeight: 'bold',
    flex: 1,
  },
  incorrectOptionText: {
    fontSize: 15,
    color: '#DC3545',
    fontWeight: 'bold',
    flex: 1,
  },
  correctAnswerText: {
    color: '#28a745',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  explanationContainer: {
    padding: 12,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#495057',
  },
  codeContainer: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  solutionContainer: {
    marginBottom: 16,
  },
  solutionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 8,
  },
  solutionText: {
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: '#28A74510',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#28A74520',
  },
  feedbackContainer: {
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C757D',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#6C757D',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 4,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C757D',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#E9ECEF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  primaryButton: {
    backgroundColor: '#007BFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
});

export default QuizResultScreen;