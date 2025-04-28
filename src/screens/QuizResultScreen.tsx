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
} from 'react-native';
import { AuthContext, API_BASE_URL } from '../../App';

const QuizResultScreen = ({ route, navigation }: any) => {
  const { attemptId, quizId, quizTitle, score, totalPossible, passed } = route.params;
  const { isLoggedIn } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [quizAttempt, setQuizAttempt] = useState<any>(null);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  
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
      
      // Quiz ve attempt detaylarını paralel olarak yükle
      const [quizResponse, attemptResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/quizzes/${quizId}`),
        fetch(`${API_BASE_URL}/quiz-attempts/${attemptId}`)
      ]);
      
      if (!quizResponse.ok || !attemptResponse.ok) {
        throw new Error('Sonuç detayları yüklenemedi');
      }
      
      const [quizData, attemptData] = await Promise.all([
        quizResponse.json(),
        attemptResponse.json()
      ]);
      
      setQuizDetails(quizData);
      setQuizAttempt(attemptData);
      
    } catch (error) {
      console.error('Sonuç detayları yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculatePercentage = () => {
    return Math.round((score / totalPossible) * 100);
  };
  
  const renderMCQuestionResult = ({ item, index }: any) => {
    // Quiz detaylarından soruyu bul
    const question = quizDetails?.multipleChoiceQuestions[item.questionIndex];
    if (!question) return null;
    
    const isCorrect = item.isCorrect;
    
    return (
      <View style={[styles.questionResultItem, isCorrect ? styles.correctItem : styles.incorrectItem]}>
        <View style={styles.questionResultHeader}>
          <Text style={styles.questionResultNumber}>Soru {item.questionIndex + 1}</Text>
          <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
            <Text style={styles.resultBadgeText}>
              {isCorrect ? 'Doğru' : 'Yanlış'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.optionsContainer}>
          {question.options.map((option: any, optIndex: number) => {
            const isSelected = item.selectedOptions.includes(optIndex);
            const isCorrectOption = option.isCorrect;
            
            let optionStyle = styles.optionItem;
            if (isSelected && isCorrectOption) {
              optionStyle = styles.correctOptionItem;
            } else if (isSelected && !isCorrectOption) {
              optionStyle = styles.incorrectOptionItem;
            } else if (!isSelected && isCorrectOption) {
              optionStyle = styles.missedOptionItem;
            }
            
            return (
              <View key={optIndex} style={optionStyle}>
                <View style={styles.optionIndexContainer}>
                  <Text style={styles.optionIndexText}>{String.fromCharCode(65 + optIndex)}</Text>
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </View>
            );
          })}
        </View>
        
        {!isCorrect && question.options.some((o: any) => o.explanation) && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Açıklama:</Text>
            {question.options
              .filter((o: any) => o.isCorrect && o.explanation)
              .map((o: any, i: number) => (
                <Text key={i} style={styles.explanationText}>{o.explanation}</Text>
              ))}
          </View>
        )}
      </View>
    );
  };
  
  const renderCodeQuestionResult = ({ item, index }: any) => {
    // Quiz detaylarından soruyu bul
    const question = quizDetails?.codeCompletionQuestions[item.questionIndex];
    if (!question) return null;
    
    const isCorrect = item.isCorrect;
    const questionIndex = quizDetails.multipleChoiceQuestions.length + item.questionIndex + 1;
    
    return (
      <View style={[styles.questionResultItem, isCorrect ? styles.correctItem : styles.incorrectItem]}>
        <View style={styles.questionResultHeader}>
          <Text style={styles.questionResultNumber}>Soru {questionIndex}</Text>
          <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
            <Text style={styles.resultBadgeText}>
              {isCorrect ? 'Doğru' : 'Yanlış'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.codeContainer}>
          <Text style={styles.codeTitle}>Cevabınız:</Text>
          <Text style={styles.codeText}>{item.userCode}</Text>
        </View>
        
        {!isCorrect && (
          <View style={styles.solutionContainer}>
            <Text style={styles.solutionTitle}>Çözüm:</Text>
            <Text style={styles.solutionText}>{question.solution}</Text>
          </View>
        )}
        
        {item.feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackTitle}>Geri Bildirim:</Text>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
          </View>
        )}
      </View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>Sonuçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, passed ? styles.passedHeader : styles.failedHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Sonuçları</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Sonuç Özeti */}
        <View style={styles.resultSummaryContainer}>
          <Text style={styles.quizTitle}>{quizTitle}</Text>
          
          <View style={styles.resultCircle}>
            <Text style={styles.resultPercentage}>{calculatePercentage()}%</Text>
            <Text style={styles.resultScore}>{score}/{totalPossible}</Text>
          </View>
          
          <View style={[styles.statusBadge, passed ? styles.passedBadge : styles.failedBadge]}>
            <Text style={styles.statusText}>
              {passed ? 'Tebrikler! Testi Geçtiniz' : 'Testi Geçemediniz'}
            </Text>
          </View>
          
          <View style={styles.resultDetails}>
            <View style={styles.resultDetailItem}>
              <Text style={styles.resultDetailLabel}>Çoktan Seçmeli:</Text>
              <Text style={styles.resultDetailValue}>
                {quizAttempt?.multipleChoiceAnswers.filter((a: any) => a.isCorrect).length}/{quizAttempt?.multipleChoiceAnswers.length}
              </Text>
            </View>
            
            <View style={styles.resultDetailItem}>
              <Text style={styles.resultDetailLabel}>Kod Tamamlama:</Text>
              <Text style={styles.resultDetailValue}>
                {quizAttempt?.codeCompletionAnswers.filter((a: any) => a.isCorrect).length}/{quizAttempt?.codeCompletionAnswers.length}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Soru Sonuçları */}
        <View style={styles.questionsContainer}>
          <Text style={styles.sectionTitle}>Soru Detayları</Text>
          
          {/* Çoktan Seçmeli Sorular */}
          {quizAttempt?.multipleChoiceAnswers.length > 0 && (
            <FlatList
              data={quizAttempt.multipleChoiceAnswers}
              renderItem={renderMCQuestionResult}
              keyExtractor={(item, index) => `mc-${index}`}
              scrollEnabled={false}
              ListHeaderComponent={quizAttempt.multipleChoiceAnswers.length > 0 ? (
                <Text style={styles.questionTypeTitle}>Çoktan Seçmeli Sorular</Text>
              ) : null}
            />
          )}
          
          {/* Kod Tamamlama Soruları */}
          {quizAttempt?.codeCompletionAnswers.length > 0 && (
            <FlatList
              data={quizAttempt.codeCompletionAnswers}
              renderItem={renderCodeQuestionResult}
              keyExtractor={(item, index) => `code-${index}`}
              scrollEnabled={false}
              ListHeaderComponent={quizAttempt.codeCompletionAnswers.length > 0 ? (
                <Text style={styles.questionTypeTitle}>Kod Tamamlama Soruları</Text>
              ) : null}
            />
          )}
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonText}>Ana Sayfaya Dön</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  passedHeader: {
    backgroundColor: '#6c5ce7',
  },
  failedHeader: {
    backgroundColor: '#e74c3c',
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
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  resultSummaryContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  resultScore: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  passedBadge: {
    backgroundColor: '#27ae6020',
  },
  failedBadge: {
    backgroundColor: '#e74c3c20',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  resultDetails: {
    width: '100%',
  },
  resultDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultDetailLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  questionsContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  questionTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  questionResultItem: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  correctItem: {
    borderColor: '#27ae6020',
    backgroundColor: '#27ae6010',
  },
  incorrectItem: {
    borderColor: '#e74c3c20',
    backgroundColor: '#e74c3c10',
  },
  questionResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionResultNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  correctBadge: {
    backgroundColor: '#27ae6020',
  },
  incorrectBadge: {
    backgroundColor: '#e74c3c20',
  },
  resultBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  correctOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#27ae60',
    backgroundColor: '#27ae6020',
    borderRadius: 8,
    marginBottom: 8,
  },
  incorrectOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
    backgroundColor: '#e74c3c20',
    borderRadius: 8,
    marginBottom: 8,
  },
  missedOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#27ae60',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 8,
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
  explanationContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
  },
  codeContainer: {
    marginTop: 10,
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 10,
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
  },
  solutionContainer: {
    marginTop: 15,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  solutionText: {
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 10,
    backgroundColor: '#27ae6020',
    borderRadius: 8,
  },
  feedbackContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    backgroundColor: 'white',
  },
  homeButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QuizResultScreen; 