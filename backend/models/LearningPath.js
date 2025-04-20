const mongoose = require('mongoose');

// Öğrenme Yolu Adımı Şeması
const pathStepSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ALGORITHM', 'QUIZ', 'ARTICLE', 'VIDEO', 'PRACTICE'],
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
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'type',
    required: true
  },
  estimatedTime: {
    type: Number, // Dakika cinsinden
    required: true
  },
  xpReward: {
    type: Number,
    default: 25
  }
}, { _id: true });

// Öğrenme Yolu Şeması
const learningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Sıralama Algoritmaları', 'Arama Algoritmaları', 'Graf Algoritmaları', 'Veri Yapıları', 'Dinamik Programlama', 'Genel'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Başlangıç', 'Orta', 'İleri'],
    required: true
  },
  coverImage: {
    type: String,
    default: '/images/default-path.jpg'
  },
  prerequisites: {
    type: [String],
    default: []
  },
  steps: {
    type: [pathStepSchema],
    default: []
  },
  totalSteps: {
    type: Number,
    default: 0
  },
  totalXP: {
    type: Number,
    default: 0
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  completionsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'Öğrenme Yolları'
});

// Toplam XP hesaplama middleware
learningPathSchema.pre('save', function(next) {
  if (this.isModified('steps')) {
    this.totalSteps = this.steps.length;
    this.totalXP = this.steps.reduce((total, step) => total + step.xpReward, 0);
    
    // Toplam tahmini süreyi saat cinsine çevirme
    const totalMinutes = this.steps.reduce((total, step) => total + step.estimatedTime, 0);
    this.estimatedHours = Math.ceil(totalMinutes / 60);
  }
  next();
});

const LearningPath = mongoose.model('LearningPath', learningPathSchema);

module.exports = LearningPath; 