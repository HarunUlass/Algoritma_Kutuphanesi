const mongoose = require('mongoose');

// Cevap Seçeneği Şeması
const answerOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  }
}, { _id: false });

// Çoktan Seçmeli Soru Şeması
const multipleChoiceSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [answerOptionSchema],
    required: true,
    validate: [
      {
        validator: function(options) {
          return options.length >= 2; // En az 2 seçenek olmalı
        },
        message: 'En az 2 cevap seçeneği olmalıdır.'
      },
      {
        validator: function(options) {
          return options.filter(option => option.isCorrect).length >= 1; // En az 1 doğru cevap olmalı
        },
        message: 'En az 1 doğru cevap olmalıdır.'
      }
    ]
  }
}, { _id: false });

// Kod Tamamlama Sorusu Şeması
const codeCompletionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  codeTemplate: {
    type: String,
    required: true
  },
  solution: {
    type: String,
    required: true
  },
  hints: {
    type: [String],
    default: []
  }
}, { _id: false });

// Quiz Şeması
const quizSchema = new mongoose.Schema({
  algorithmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Algorithm',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Kolay', 'Orta', 'Zor'],
    required: true
  },
  timeLimit: {
    type: Number, // Dakika cinsinden
    default: 10
  },
  multipleChoiceQuestions: {
    type: [multipleChoiceSchema],
    default: []
  },
  codeCompletionQuestions: {
    type: [codeCompletionSchema],
    default: []
  },
  totalPoints: {
    type: Number,
    required: true
  },
  passingScore: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'Quizler'
});

// Middleware: totalPoints hesaplama
quizSchema.pre('save', function(next) {
  // Her çoktan seçmeli soru 10 puan, her kod tamamlama sorusu 20 puan
  const mcPoints = this.multipleChoiceQuestions.length * 10;
  const ccPoints = this.codeCompletionQuestions.length * 20;
  this.totalPoints = mcPoints + ccPoints;
  
  // Varsayılan geçme puanı toplam puanın %60'ı
  if (!this.passingScore) {
    this.passingScore = Math.ceil(this.totalPoints * 0.6);
  }
  
  next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz; 