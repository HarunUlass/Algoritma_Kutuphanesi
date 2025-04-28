import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { AuthContext, API_BASE_URL } from '../../App';

const QuizScreen = ({ route, navigation }: any) => {
  // Route params
  const { quizId, quizTitle, timeLimit: initialTimeLimit } = route.params;
  
  // Auth context
  const auth = useContext(AuthContext);
  const { isLoggedIn } = auth;
  const userId = auth.userId;
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [userCode, setUserCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(initialTimeLimit || 20); // Default to 20 minutes if not provided
  const [remainingTime, setRemainingTime] = useState(timeLimit * 60);
  const [isMCQuestion, setIsMCQuestion] = useState(true);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load quiz on component mount
  useEffect(() => {
    loadQuiz();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Main function to load quiz data
  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`QuizScreen: Loading quiz with ID ${quizId}`);
      
      if (!quizId) {
        throw new Error('Quiz ID is missing');
      }
      
      // First, get quiz info to verify it exists
      const quizInfoResponse = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
      
      if (!quizInfoResponse.ok) {
        console.error(`Quiz info request failed: ${quizInfoResponse.status}`);
        throw new Error(`Quiz bilgisi alınamadı (${quizInfoResponse.status})`);
      }
      
      const quizInfo = await quizInfoResponse.json();
      console.log(`Found quiz: ${quizInfo.title}`);
      
      // Then start the quiz session
      console.log(`Starting quiz session with userId: ${userId || 'guest'}`);
      
      const startResponse = await fetch(`${API_BASE_URL}/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId || '' }),
      });
      
      if (!startResponse.ok) {
        console.error(`Quiz start request failed: ${startResponse.status}`);
        const errorText = await startResponse.text();
        console.error(`Error details: ${errorText}`);
        throw new Error(`Quiz başlatılamadı (${startResponse.status})`);
      }
      
      const responseText = await startResponse.text();
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse quiz data:', e);
        console.error('Response text:', responseText);
        throw new Error('Quiz verisi geçerli bir JSON değil');
      }
      
      console.log(`Quiz data loaded successfully. Contains ${data.multipleChoiceQuestions?.length || 0} multiple choice questions and ${data.codeCompletionQuestions?.length || 0} code completion questions`);
      
      // Ensure we have question arrays
      if (!data.multipleChoiceQuestions) {
        data.multipleChoiceQuestions = [];
      }
      
      if (!data.codeCompletionQuestions) {
        data.codeCompletionQuestions = [];
      }
      
      // Make sure we have at least one question
      const totalQuestions = data.multipleChoiceQuestions.length + data.codeCompletionQuestions.length;
      if (totalQuestions === 0) {
        throw new Error('Bu quiz için soru bulunmamaktadır');
      }
      
      // Update state
      setQuizData(data);
      setAttemptId(data.attemptId);
      
      // Set time limit from quiz data if available
      if (data.timeLimit && data.timeLimit > 0) {
        setTimeLimit(data.timeLimit);
        setRemainingTime(data.timeLimit * 60);
      }
      
      // Set up first question
      setupQuestion(0, data);
      
      // Start timer
      startTimer();
      
    } catch (error: any) {
      console.error('Error loading quiz:', error);
      setError(error.message || 'Quiz yüklenirken bir hata oluştu');
      
      Alert.alert(
        'Hata', 
        error.message || 'Quiz yüklenirken bir hata oluştu',
        [{ text: 'Geri Dön', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Timer management
  const startTimer = () => {
    console.log(`Starting quiz timer with ${remainingTime} seconds`);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          console.log('Timer expired, finishing quiz');
          clearInterval(timerRef.current!);
          finishQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Set up current question
  const setupQuestion = (index: number, data = quizData) => {
    if (!data) return;
    
    console.log(`Setting up question ${index + 1}`);
    
    // Reset answers
    setSelectedOptions([]);
    setUserCode('');
    
    // Determine if it's a multiple choice question
    const mcQuestions = data.multipleChoiceQuestions || [];
    const isMC = index < mcQuestions.length;
    setIsMCQuestion(isMC);
    
    // For code completion questions, set template code if available
    if (!isMC) {
      const ccQuestions = data.codeCompletionQuestions || [];
      const ccIndex = index - mcQuestions.length;
      
      if (ccQuestions && ccIndex >= 0 && ccIndex < ccQuestions.length) {
        const template = ccQuestions[ccIndex].codeTemplate || '';
        setUserCode(template);
      }
    }
  };
  
  // Check if current question is the last one
  const isLastQuestion = () => {
    if (!quizData) return false;
    
    const totalQuestions = 
      (quizData.multipleChoiceQuestions?.length || 0) + 
      (quizData.codeCompletionQuestions?.length || 0);
      
    return currentQuestionIndex === totalQuestions - 1;
  };
  
  // Handle option selection for multiple choice questions
  const handleOptionPress = (optionIndex: number) => {
    setSelectedOptions(prev => {
      const isSelected = prev.includes(optionIndex);
      if (isSelected) {
        return prev.filter(index => index !== optionIndex);
      } else {
        return [...prev, optionIndex];
      }
    });
  };
  
  // Move to next question
  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setupQuestion(nextIndex);
  };
  
  // Submit current answer
  const submitAnswer = async () => {
    if (!quizData || !attemptId || answerSubmitting) return;
    
    try {
      setAnswerSubmitting(true);
      
      // Handle multiple choice questions
      if (isMCQuestion) {
        // Validate selection
        if (selectedOptions.length === 0) {
          Alert.alert('Uyarı', 'Lütfen en az bir cevap seçin');
          setAnswerSubmitting(false);
          return;
        }
        
        // Submit answer
        const response = await fetch(`${API_BASE_URL}/quiz-attempts/${attemptId}/multiple-choice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionIndex: currentQuestionIndex,
            selectedOptions: selectedOptions,
          }),
        });
        
        if (!response.ok) {
          const errorBody = await response.text(); // Hata detayını almaya çalış
          console.error('MC Answer Submission Error Status:', response.status);
          console.error('MC Answer Submission Error Body:', errorBody);
          throw new Error(`Cevap gönderilemedi (Status: ${response.status})`);
        }
        
      // Handle code completion questions  
      } else {
        // Validate code
        if (!userCode.trim()) {
          Alert.alert('Uyarı', 'Lütfen bir kod girin');
          setAnswerSubmitting(false);
          return;
        }
        
        // Calculate code completion question index
        const mcQuestionsCount = quizData.multipleChoiceQuestions?.length || 0;
        const ccIndex = currentQuestionIndex - mcQuestionsCount;
        
        // Submit answer
        const response = await fetch(`${API_BASE_URL}/quiz-attempts/${attemptId}/code-completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionIndex: ccIndex,
            userCode: userCode,
          }),
        });
        
        if (!response.ok) {
          const errorBody = await response.text(); // Hata detayını almaya çalış
          console.error('Code Answer Submission Error Status:', response.status);
          console.error('Code Answer Submission Error Body:', errorBody);
          throw new Error(`Cevap gönderilemedi (Status: ${response.status})`);
        }
      }
      
      // Move to next question or finish quiz
      if (isLastQuestion()) {
        finishQuiz();
      } else {
        nextQuestion();
      }
      
    } catch (error: any) {
      // Log the detailed error object
      console.error('Error submitting answer (Detailed):', error);
      // Keep the original alert but use the potentially more detailed error message
      Alert.alert('Hata', `Cevap gönderilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setAnswerSubmitting(false);
    }
  };
  
  // Finish quiz and calculate results
  const finishQuiz = async () => {
    try {
      if (!attemptId) return;
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      console.log(`Finishing quiz with attempt ID: ${attemptId}`);
      
      // Submit finish request
      const response = await fetch(`${API_BASE_URL}/quiz-attempts/${attemptId}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Quiz tamamlanamadı');
      }
      
      // Get results
      const results = await response.json();
      console.log('Quiz results:', results);
      
      // Navigate to results screen
      navigation.replace('QuizResult', {
        attemptId,
        quizId,
        quizTitle,
        score: results.score,
        totalPossible: results.totalPossible,
        passed: results.passed,
      });
      
    } catch (error: any) {
      console.error('Error finishing quiz:', error);
      Alert.alert('Hata', `Test tamamlanırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      navigation.goBack();
    }
  };
  
  // Confirm quiz quit
  const confirmQuit = () => {
    Alert.alert(
      'Testi Sonlandır',
      'Testi sonlandırmak istediğinize emin misiniz? Sonuçlarınız kaydedilecek.',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sonlandır',
          onPress: finishQuiz,
          style: 'destructive'
        }
      ]
    );
  };
  
  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>Test yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Error screen
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadQuiz()}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, {marginTop: 10, backgroundColor: '#e74c3c'}]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Prepare current question data
  let currentQuestion = null;
  let questionNumber = 0;
  let totalQuestions = 0;
  
  if (quizData) {
    const mcQuestionsCount = quizData.multipleChoiceQuestions?.length || 0;
    const ccQuestionsCount = quizData.codeCompletionQuestions?.length || 0;
    
    totalQuestions = mcQuestionsCount + ccQuestionsCount;
    questionNumber = currentQuestionIndex + 1;
    
    if (isMCQuestion) {
      currentQuestion = quizData.multipleChoiceQuestions[currentQuestionIndex];
    } else {
      const ccIndex = currentQuestionIndex - mcQuestionsCount;
      currentQuestion = quizData.codeCompletionQuestions[ccIndex];
    }
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={confirmQuit}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quizTitle}</Text>
        <View style={styles.timerContainer}>
          <Text style={[
            styles.timerText, 
            remainingTime < 60 && styles.timerWarning
          ]}>
            {formatTime(remainingTime)}
          </Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${(questionNumber / totalQuestions) * 100}%` }
          ]} 
        />
        <Text style={styles.progressText}>
          Soru {questionNumber}/{totalQuestions}
        </Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {currentQuestion && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            
            {isMCQuestion ? (
              // Multiple choice question
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      selectedOptions.includes(index) && styles.optionSelected
                    ]}
                    onPress={() => handleOptionPress(index)}
                    disabled={answerSubmitting}
                  >
                    <View style={styles.optionIndexContainer}>
                      <Text style={styles.optionIndexText}>{String.fromCharCode(65 + index)}</Text>
                    </View>
                    <Text style={styles.optionText}>{option.text}</Text>
                  </TouchableOpacity>
                ))}
                
                <Text style={styles.infoText}>
                  Not: Birden fazla doğru cevap olabilir
                </Text>
              </View>
            ) : (
              // Code completion question
              <View style={styles.codeContainer}>
                <TextInput
                  style={styles.codeInput}
                  multiline
                  value={userCode}
                  onChangeText={setUserCode}
                  placeholder="Kodu buraya yazın..."
                  editable={!answerSubmitting}
                />
                
                {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                  <View style={styles.hintsContainer}>
                    <Text style={styles.hintsTitle}>İpuçları:</Text>
                    {currentQuestion.hints.map((hint: string, index: number) => (
                      <Text key={index} style={styles.hintText}>• {hint}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitAnswer}
          disabled={answerSubmitting}
        >
          {answerSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isLastQuestion() ? 'Testi Tamamla' : 'Sonraki Soru'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#6c5ce7',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
  },
  timerContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timerWarning: {
    color: '#ff7675',
  },
  progressContainer: {
    height: 30,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#6c5ce7',
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#6c5ce730',
    borderColor: '#6c5ce7',
  },
  optionIndexContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionIndexText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  codeContainer: {
    marginTop: 10,
  },
  codeInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    minHeight: 200,
    textAlignVertical: 'top',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  hintsContainer: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
  },
  hintsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QuizScreen;