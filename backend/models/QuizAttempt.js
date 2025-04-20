const mongoose = require('mongoose');

// Kullanıcı Cevabı Şeması (Çoktan Seçmeli)
const mcAnswerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedOptions: {
    type: [Number], // Seçilen cevapların indeksleri
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  pointsEarned: {
    type: Number,
    required: true
  }
}, { _id: false });

// Kullanıcı Cevabı Şeması (Kod Tamamlama)
const ccAnswerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  userCode: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  pointsEarned: {
    type: Number,
    required: true
  },
  feedback: {
    type: String,
    default: ''
  }
}, { _id: false });

// Quiz Girişimi Şeması
const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  multipleChoiceAnswers: {
    type: [mcAnswerSchema],
    default: []
  },
  codeCompletionAnswers: {
    type: [ccAnswerSchema],
    default: []
  },
  score: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'Quiz Girişimleri'
});

// Skor ve başarı hesaplama
quizAttemptSchema.methods.calculateResults = async function() {
  try {
    // İlgili quizi getir
    const Quiz = mongoose.model('Quiz');
    const quiz = await Quiz.findById(this.quizId);
    
    if (!quiz) {
      throw new Error('Quiz bulunamadı');
    }
    
    // Toplam puanları hesapla
    let totalEarned = 0;
    
    // Çoktan seçmeli sorular
    this.multipleChoiceAnswers.forEach(answer => {
      totalEarned += answer.pointsEarned;
    });
    
    // Kod tamamlama soruları
    this.codeCompletionAnswers.forEach(answer => {
      totalEarned += answer.pointsEarned;
    });
    
    // Skor ve başarı güncelleme
    this.score = totalEarned;
    this.passed = totalEarned >= quiz.passingScore;
    this.completed = true;
    this.endTime = new Date();
    
    return {
      score: this.score,
      totalPossible: quiz.totalPoints,
      passed: this.passed
    };
  } catch (error) {
    throw error;
  }
};

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = QuizAttempt; 