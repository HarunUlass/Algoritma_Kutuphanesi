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
      console.log(`Sonuç detayları yükleniyor: quizId=${quizId}, attemptId=${attemptId}`);
      
      // Önce quiz verilerini yükle
      let quizData = null;
      try {
        // Timeout ekleyerek ağ isteklerinin çok uzun sürmesini engelle
        const quizPromise = fetch(`${API_BASE_URL}/quizzes/${quizId}`);
        let quizResponse;
        
        try {
          quizResponse = await Promise.race([
            quizPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('İstek zaman aşımına uğradı')), 10000))
          ]);
        } catch (timeoutError) {
          console.error('Quiz verisi zaman aşımı hatası:', timeoutError);
          throw new Error('Quiz verisi yüklenirken zaman aşımı oluştu');
        }
        
        if (!quizResponse || !quizResponse.ok) {
          console.error(`Quiz API yanıt hatası: ${quizResponse?.status || 'Yanıt alınamadı'}`);
          throw new Error(`Quiz bilgisi alınamadı (${quizResponse?.status || 'Bağlantı hatası'})`);
        }
        
        try {
          quizData = await quizResponse.json();
          console.log('Quiz verileri başarıyla yüklendi');
          setQuizDetails(quizData);
        } catch (parseError) {
          console.error('Quiz verisi JSON ayrıştırma hatası:', parseError);
          throw new Error('Quiz verisi geçerli bir format değil');
        }
      } catch (quizError) {
        console.error('Quiz verisi yükleme hatası:', quizError);
        // Quiz verisi yüklenemezse, boş bir quiz objesi oluştur
        // Bu, UI'ın çökmesini engelleyecek
        setQuizDetails({
          multipleChoiceQuestions: [],
          codeCompletionQuestions: []
        });
        console.log('Boş quiz detayları oluşturuldu');
        // Hatayı yukarı fırlatma, devam et
      }
      
      // Sonra attempt verilerini yükle
      try {
        // Timeout ekleyerek ağ isteklerinin çok uzun sürmesini engelle
        const attemptPromise = fetch(`${API_BASE_URL}/quiz-attempts/${attemptId}`);
        let attemptResponse;
        
        try {
          attemptResponse = await Promise.race([
            attemptPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('İstek zaman aşımına uğradı')), 10000))
          ]);
        } catch (timeoutError) {
          console.error('Attempt verisi zaman aşımı hatası:', timeoutError);
          throw new Error('Attempt verisi yüklenirken zaman aşımı oluştu');
        }
        
        if (!attemptResponse || !attemptResponse.ok) {
          console.error(`Attempt API yanıt hatası: ${attemptResponse?.status || 'Yanıt alınamadı'}`);
          
          // 404 hatası için özel mesaj
          if (attemptResponse?.status === 404) {
            console.log('Attempt kaydı bulunamadı (404), fallback verisi kullanılıyor');
          } else {
            console.log(`Attempt API ${attemptResponse?.status || 'bağlantı'} hatası, fallback verisi kullanılıyor`);
          }
          
          // Attempt verisi yüklenemezse, route params'tan gelen verileri kullanarak basit bir attempt objesi oluştur
          // 404 hatası durumunda bile sonuçların gösterilmesini sağlamak için boş cevap dizileri oluşturuyoruz
          const fallbackAttempt = {
            quizId,
            score,
            totalPossible,
            passed,
            // Boş cevap dizileri yerine, en azından soru sayısı kadar boş cevap oluşturalım
            // Bu, kullanıcının en azından soru sayısını görmesini sağlar
            multipleChoiceAnswers: quizDetails?.multipleChoiceQuestions?.map((_, index) => ({
              questionIndex: index,
              isCorrect: false,  // Varsayılan olarak yanlış kabul ediyoruz
              selectedOptions: [] // Seçilen cevaplar bilinmiyor
            })) || [],
            codeCompletionAnswers: quizDetails?.codeCompletionQuestions?.map((_, index) => ({
              questionIndex: index,
              isCorrect: false,  // Varsayılan olarak yanlış kabul ediyoruz
              userCode: ''       // Kullanıcı kodu bilinmiyor
            })) || [],
            // Fallback olduğunu belirten bir bayrak ekleyelim
            isFallback: true
          };
          
          console.log('Fallback attempt verisi oluşturuldu');
          setQuizAttempt(fallbackAttempt);
        } else {
          try {
            const attemptData = await attemptResponse.json();
            console.log('Attempt verileri başarıyla yüklendi');
            
            // Veri bütünlüğünü kontrol et ve eksik alanları tamamla
            const validatedAttempt = {
              ...(attemptData || {}),
              quizId: attemptData?.quizId || quizId,
              score: attemptData?.score !== undefined ? attemptData.score : score,
              totalPossible: attemptData?.totalPossible !== undefined ? attemptData.totalPossible : totalPossible,
              passed: attemptData?.passed !== undefined ? attemptData.passed : passed,
              multipleChoiceAnswers: Array.isArray(attemptData?.multipleChoiceAnswers) ? attemptData.multipleChoiceAnswers : [],
              codeCompletionAnswers: Array.isArray(attemptData?.codeCompletionAnswers) ? attemptData.codeCompletionAnswers : []
            };
            
            setQuizAttempt(validatedAttempt);
          } catch (parseError) {
            console.error('Attempt verisi JSON ayrıştırma hatası:', parseError);
            
            // JSON ayrıştırma hatası durumunda fallback verisi kullan
            const fallbackAttempt = {
              quizId,
              score,
              totalPossible,
              passed,
              multipleChoiceAnswers: quizDetails?.multipleChoiceQuestions?.map((_, index) => ({
                questionIndex: index,
                isCorrect: false,
                selectedOptions: []
              })) || [],
              codeCompletionAnswers: quizDetails?.codeCompletionQuestions?.map((_, index) => ({
                questionIndex: index,
                isCorrect: false,
                userCode: ''
              })) || [],
              isFallback: true,
              parseError: true
            };
            
            console.log('JSON ayrıştırma hatası nedeniyle fallback verisi kullanılıyor');
            setQuizAttempt(fallbackAttempt);
          }
        }
      } catch (attemptError) {
        console.error('Attempt verisi yükleme hatası:', attemptError);
        
        // Hata mesajını kaydet
        let errorType = 'network';
        if (attemptError instanceof Error) {
          if (attemptError.message.includes('zaman aşımı')) {
            errorType = 'timeout';
          }
        }
        
        // Attempt verisi yüklenemezse, route params'tan gelen verileri kullanarak basit bir attempt objesi oluştur
        const fallbackAttempt = {
          quizId: quizId || '',
          score: score !== undefined ? score : 0,
          totalPossible: totalPossible !== undefined ? totalPossible : 0,
          passed: passed !== undefined ? passed : false,
          // Boş cevap dizileri yerine, en azından soru sayısı kadar boş cevap oluşturalım
          // Bu, kullanıcının en azından soru sayısını görmesini sağlar
          multipleChoiceAnswers: quizDetails?.multipleChoiceQuestions?.map((_, index) => ({
            questionIndex: index,
            isCorrect: false,  // Varsayılan olarak yanlış kabul ediyoruz
            selectedOptions: [] // Seçilen cevaplar bilinmiyor
          })) || [],
          codeCompletionAnswers: quizDetails?.codeCompletionQuestions?.map((_, index) => ({
            questionIndex: index,
            isCorrect: false,  // Varsayılan olarak yanlış kabul ediyoruz
            userCode: ''       // Kullanıcı kodu bilinmiyor
          })) || [],
          // Fallback olduğunu belirten bayraklar ekleyelim
          isFallback: true,
          errorType: errorType
        };
        
        console.log(`${errorType === 'timeout' ? 'Zaman aşımı' : 'Ağ'} hatası nedeniyle fallback verisi kullanılıyor`);
        setQuizAttempt(fallbackAttempt);
      }
      
    } catch (error: any) {
      console.error('Sonuç detayları yükleme hatası:', error);
      
      // Hata mesajını belirle
      let errorMessage = 'Sonuç detayları yüklenemedi. Lütfen tekrar deneyin.';
      let is404Error = false;
      let isTimeoutError = false;
      
      // Hata türünü belirle
      if (error && error.message) {
        // Eğer 404 hatası varsa daha açıklayıcı bir mesaj göster ve bayrak ayarla
        if (error.message.includes('404')) {
          errorMessage = 'Sınav sonuç detayları sunucuda bulunamadı. Özet bilgiler gösterilecek.';
          is404Error = true;
        } else if (error.message.includes('zaman aşımı')) {
          errorMessage = 'Sunucu yanıt vermedi. İnternet bağlantınızı kontrol edip tekrar deneyin.';
          isTimeoutError = true;
        } else if (error.message.includes('geçerli bir format değil') || error.message.includes('JSON')) {
          errorMessage = 'Sunucudan gelen veri formatı geçersiz. Lütfen daha sonra tekrar deneyin.';
        }
      }
      
      // 404 hatası veya diğer hatalar için fallback verisi oluştur ve devam et
      if (is404Error || isTimeoutError) {
        // Fallback attempt objesi oluştur
        const fallbackAttempt = {
          quizId: quizId || '',
          score: score !== undefined ? score : 0,
          totalPossible: totalPossible !== undefined ? totalPossible : 0,
          passed: passed !== undefined ? passed : false,
          // Boş cevap dizileri yerine, en azından soru sayısı kadar boş cevap oluşturalım
          multipleChoiceAnswers: quizDetails?.multipleChoiceQuestions?.map((_, index) => ({
            questionIndex: index,
            isCorrect: false,
            selectedOptions: []
          })) || [],
          codeCompletionAnswers: quizDetails?.codeCompletionQuestions?.map((_, index) => ({
            questionIndex: index,
            isCorrect: false,
            userCode: ''
          })) || [],
          isFallback: true,
          errorType: is404Error ? '404' : 'timeout'
        };
        
        setQuizAttempt(fallbackAttempt);
        setLoading(false);
        
        // Kullanıcıya bilgi mesajı göster ama ekranı kapatma
        Alert.alert(
          'Bilgi',
          errorMessage,
          [{ text: 'Tamam', style: 'default' }]
        );
        
        return; // Ana hata işleyiciden çık
      }
      
      // Diğer hatalar için kullanıcıya hata mesajı göster ve geri dönme seçeneği sun
      Alert.alert(
        'Hata',
        errorMessage,
        [
          { text: 'Geri Dön', onPress: () => navigation.goBack() },
          { text: 'Tekrar Dene', onPress: () => loadResultDetails() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };
  
  const calculatePercentage = () => {
    // Sıfıra bölme hatasını önlemek için kontrol ekleyelim
    if (!totalPossible || totalPossible <= 0) {
      return 0;
    }
    return Math.round((score / totalPossible) * 100);
  };
  
  const renderMCQuestionResult = ({ item, index }: any) => {
    // Quiz detaylarından soruyu bul
    const question = quizDetails?.multipleChoiceQuestions?.[item.questionIndex];
    const isCorrect = item.isCorrect;
    const isFallback = quizAttempt?.isFallback;
    
    // Eğer soru bulunamadıysa, basitleştirilmiş bir görünüm göster
    if (!question) {
      console.log(`Soru bulunamadı: MC soru indeksi ${item.questionIndex}`);
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
          
          <Text style={styles.questionText}>
            {isFallback ? 
              `Çoktan seçmeli soru ${item.questionIndex + 1} - Detaylar sunucudan alınamadı` : 
              'Soru detayları yüklenemedi.'}
          </Text>
          
          <View style={styles.optionsContainer}>
            {isFallback ? (
              <Text style={styles.fallbackInfoText}>
                404 hatası nedeniyle soru detayları gösterilemiyor. Sonuçlarınızı daha sonra tekrar kontrol edebilirsiniz.
              </Text>
            ) : (
              <Text style={styles.emptyStateText}>Seçenekler görüntülenemiyor.</Text>
            )}
          </View>
          
          {item.selectedOptions && item.selectedOptions.length > 0 && (
            <View style={styles.userAnswerContainer}>
              <Text style={styles.userAnswerTitle}>Cevabınız:</Text>
              <Text style={styles.userAnswerText}>
                {item.selectedOptions.map((opt: number) => String.fromCharCode(65 + opt)).join(', ')}
              </Text>
            </View>
          )}
        </View>
      );
    }
    
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
          {Array.isArray(question.options) ? question.options.map((option: any, optIndex: number) => {
            const isSelected = Array.isArray(item.selectedOptions) && item.selectedOptions.includes(optIndex);
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
          }) : (
            <Text style={styles.emptyStateText}>Seçenekler yüklenemedi.</Text>
          )}
        </View>
        
        {!isCorrect && Array.isArray(question.options) && question.options.some((o: any) => o.explanation) && (
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
    const question = quizDetails?.codeCompletionQuestions?.[item.questionIndex];
    const isCorrect = item.isCorrect;
    const questionIndex = (quizDetails?.multipleChoiceQuestions?.length || 0) + item.questionIndex + 1;
    const isFallback = quizAttempt?.isFallback;
    
    // Eğer soru bulunamadıysa, basitleştirilmiş bir görünüm göster
    if (!question) {
      console.log(`Soru bulunamadı: Kod tamamlama soru indeksi ${item.questionIndex}`);
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
          
          <Text style={styles.questionText}>
            {isFallback ? 
              `Kod tamamlama sorusu ${item.questionIndex + 1} - Detaylar sunucudan alınamadı` : 
              'Soru detayları yüklenemedi.'}
          </Text>
          
          {item.userCode && (
            <View style={styles.codeContainer}>
              <Text style={styles.codeTitle}>Cevabınız:</Text>
              <Text style={styles.codeText}>{item.userCode}</Text>
            </View>
          )}
          
          {!isCorrect && (
            <View style={styles.emptyStateContainer}>
              {isFallback ? (
                <Text style={styles.fallbackInfoText}>
                  404 hatası nedeniyle çözüm bilgisi gösterilemiyor. Sonuçlarınızı daha sonra tekrar kontrol edebilirsiniz.
                </Text>
              ) : (
                <Text style={styles.emptyStateText}>Çözüm bilgisi yüklenemedi.</Text>
              )}
            </View>
          )}
        </View>
      );
    }
    
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
        
        <Text style={styles.questionText}>{question.question || 'Soru metni yüklenemedi'}</Text>
        
        <View style={styles.codeContainer}>
          <Text style={styles.codeTitle}>Cevabınız:</Text>
          <Text style={styles.codeText}>{item.userCode || 'Cevap bulunamadı'}</Text>
        </View>
        
        {!isCorrect && question.solution && (
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
          <Text style={styles.quizTitle}>{quizTitle || 'Quiz Sonuçları'}</Text>
          
          <View style={styles.resultCircle}>
            <Text style={styles.resultPercentage}>{calculatePercentage()}%</Text>
            <Text style={styles.resultScore}>{score || 0}/{totalPossible || 0}</Text>
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
                {Array.isArray(quizAttempt?.multipleChoiceAnswers) ? 
                  `${quizAttempt.multipleChoiceAnswers.filter((a: any) => a.isCorrect).length || 0}/${quizAttempt.multipleChoiceAnswers.length}` : 
                  '0/0'}
              </Text>
            </View>
            
            <View style={styles.resultDetailItem}>
              <Text style={styles.resultDetailLabel}>Kod Tamamlama:</Text>
              <Text style={styles.resultDetailValue}>
                {Array.isArray(quizAttempt?.codeCompletionAnswers) ? 
                  `${quizAttempt.codeCompletionAnswers.filter((a: any) => a.isCorrect).length || 0}/${quizAttempt.codeCompletionAnswers.length}` : 
                  '0/0'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Soru Sonuçları */}
        <View style={styles.questionsContainer}>
          <Text style={styles.sectionTitle}>Soru Detayları</Text>
          
          {/* Çoktan Seçmeli Sorular */}
          {Array.isArray(quizAttempt?.multipleChoiceAnswers) && quizAttempt.multipleChoiceAnswers.length > 0 ? (
            <View style={styles.questionSection}>
              <Text style={styles.questionTypeTitle}>Çoktan Seçmeli Sorular</Text>
              <FlatList
                data={quizAttempt.multipleChoiceAnswers}
                renderItem={renderMCQuestionResult}
                keyExtractor={(item, index) => `mc-${index}`}
                scrollEnabled={false}
                removeClippedSubviews={false}
              />
            </View>
          ) : null}
          
          {/* Kod Tamamlama Soruları */}
          {Array.isArray(quizAttempt?.codeCompletionAnswers) && quizAttempt.codeCompletionAnswers.length > 0 ? (
            <View style={styles.questionSection}>
              <Text style={styles.questionTypeTitle}>Kod Tamamlama Soruları</Text>
              <FlatList
                data={quizAttempt.codeCompletionAnswers}
                renderItem={renderCodeQuestionResult}
                keyExtractor={(item, index) => `code-${index}`}
                scrollEnabled={false}
                removeClippedSubviews={false}
              />
            </View>
          ) : null}
          
          {/* Fallback durumunda veya boş cevap dizileri durumunda bilgilendirme mesajı */}
          {quizAttempt?.isFallback && (
            <View style={styles.fallbackInfoContainer}>
              <Text style={styles.fallbackInfoTitle}>Bilgilendirme</Text>
              
              {quizAttempt.errorType === '404' && (
                <Text style={styles.fallbackInfoText}>
                  Sınav sonuç detayları sunucuda bulunamadı (404 hatası). Özet bilgiler ve mevcut soru detayları gösteriliyor.
                </Text>
              )}
              
              {quizAttempt.errorType === 'timeout' && (
                <Text style={styles.fallbackInfoText}>
                  Sunucu yanıt vermedi (zaman aşımı). Özet bilgiler ve mevcut soru detayları gösteriliyor.
                </Text>
              )}
              
              {quizAttempt.parseError && (
                <Text style={styles.fallbackInfoText}>
                  Sunucudan gelen veri formatı geçersiz. Özet bilgiler ve mevcut soru detayları gösteriliyor.
                </Text>
              )}
              
              {(!quizAttempt.errorType || (quizAttempt.errorType !== '404' && quizAttempt.errorType !== 'timeout' && !quizAttempt.parseError)) && (
                <Text style={styles.fallbackInfoText}>
                  Sınav sonuç detayları yüklenirken bir hata oluştu. Özet bilgiler ve mevcut soru detayları gösteriliyor.
                </Text>
              )}
              
              <Text style={styles.fallbackInfoText}>
                Bu durum genellikle sunucu bakımda olduğunda, internet bağlantınızda sorun olduğunda veya sınav sonuçları henüz işlenmediğinde oluşur.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadResultDetails}
              >
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {(!Array.isArray(quizAttempt?.multipleChoiceAnswers) || quizAttempt.multipleChoiceAnswers.length === 0) && 
           (!Array.isArray(quizAttempt?.codeCompletionAnswers) || quizAttempt.codeCompletionAnswers.length === 0) && 
           !quizAttempt?.isFallback && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>Detaylı soru sonuçları yüklenemedi.</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadResultDetails}
              >
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
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
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  fallbackInfoContainer: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffd54f',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  fallbackInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackInfoText: {
    fontSize: 14,
    color: '#5d4037',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  userAnswerContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  userAnswerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userAnswerText: {
    fontSize: 14,
    color: '#666',
  },
  questionSection: {
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'center',
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