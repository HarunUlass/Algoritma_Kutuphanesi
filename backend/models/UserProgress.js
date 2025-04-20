const mongoose = require('mongoose');

// Algoritma İlerleme Şeması
const algorithmProgressSchema = new mongoose.Schema({
  algorithmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Algorithm',
    required: true
  },
  viewCount: {
    type: Number,
    default: 1
  },
  lastViewed: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Öğrenme Yolu İlerleme Şeması
const learningPathProgressSchema = new mongoose.Schema({
  pathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  progress: {
    type: Number, // Yüzde cinsinden
    default: 0
  },
  currentStep: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Rozet Şeması
const achievementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'ALGORITHM_MASTER', // Belirli bir algoritma kategorisindeki tüm algoritmaları tamamlamak
      'QUIZ_GENIUS', // Belirli sayıda quizi başarıyla tamamlamak
      'STREAK_HERO', // Belirli gün sayısı boyunca her gün giriş yapmak
      'LEARNER', // İlk kez bir algoritma görüntülemek
      'GRADUATE', // Bir öğrenme yolunu tamamlamak
      'CONTRIBUTOR', // Katkıda bulunmak (yorum yapmak, değerlendirme yapmak)
      'EXPLORER' // Tüm algoritma kategorilerinden en az bir algoritma görüntülemek
    ],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  relatedEntity: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedEntityModel'
  },
  relatedEntityModel: {
    type: String,
    enum: ['Algorithm', 'Quiz', 'LearningPath', null]
  }
}, { _id: false });

// Kullanıcı İlerleme Şeması
const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalXP: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  algorithmProgress: {
    type: Map,
    of: algorithmProgressSchema,
    default: {}
  },
  learningPathProgress: {
    type: Map,
    of: learningPathProgressSchema,
    default: {}
  },
  achievements: {
    type: [achievementSchema],
    default: []
  },
  streakDays: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  completedAlgorithmsCount: {
    type: Number,
    default: 0
  },
  completedQuizzesCount: {
    type: Number,
    default: 0
  },
  completedLearningPathsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// XP ve seviye hesaplama
userProgressSchema.methods.addXP = function(points) {
  this.totalXP += points;
  
  // Seviye hesaplama - her seviye için gereken XP artarak gider
  // Level n için gereken XP: 100 * n^1.5
  const newLevel = Math.floor(Math.pow(this.totalXP / 100, 1/1.5));
  
  // Seviye atladıysa
  if (newLevel > this.level) {
    const levelsGained = newLevel - this.level;
    this.level = newLevel;
    return { 
      levelUp: true, 
      levelsGained, 
      newLevel 
    };
  }
  
  return { 
    levelUp: false, 
    currentXP: this.totalXP, 
    nextLevelXP: Math.ceil(100 * Math.pow(this.level + 1, 1.5)) 
  };
};

// Rozet ekleme
userProgressSchema.methods.addAchievement = function(achievement) {
  // Aynı rozeti bir daha ekleme
  const existingAchievement = this.achievements.find(a => a.type === achievement.type && 
    a.relatedEntity?.toString() === achievement.relatedEntity?.toString());
  
  if (!existingAchievement) {
    this.achievements.push({
      ...achievement,
      earnedAt: new Date()
    });
    return true;
  }
  
  return false;
};

// Streaks güncelleme
userProgressSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActive = new Date(this.lastActive);
  
  // Tarih farklarını gün olarak hesapla
  const diffTime = Math.abs(now - lastActive);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Aynı gün içinde tekrar giriş yaptıysa streak değişmez
  if (diffDays === 0) {
    return this.streakDays;
  }
  
  // 1 gün sonra giriş yaptıysa streak devam eder
  if (diffDays === 1) {
    this.streakDays += 1;
  } else {
    // 1 günden fazla ara verdiyse streak sıfırlanır
    this.streakDays = 1;
  }
  
  this.lastActive = now;
  return this.streakDays;
};

// Algoritma ilerlemesini güncelleme
userProgressSchema.methods.updateAlgorithmProgress = function(algorithmId, update) {
  const algorithmIdStr = algorithmId.toString();
  const progress = this.algorithmProgress.get(algorithmIdStr) || {
    algorithmId,
    viewCount: 0,
    lastViewed: new Date(),
    completed: false
  };
  
  // Mevcut ilerlemeyi güncelle
  Object.assign(progress, update);
  
  // İlk kez tamamlandıysa
  if (update.completed && !this.algorithmProgress.get(algorithmIdStr)?.completed) {
    this.completedAlgorithmsCount += 1;
    progress.completedAt = new Date();
  }
  
  this.algorithmProgress.set(algorithmIdStr, progress);
  return progress;
};

// Öğrenme yolu ilerlemesini güncelleme
userProgressSchema.methods.updateLearningPathProgress = function(pathId, update) {
  const pathIdStr = pathId.toString();
  const progress = this.learningPathProgress.get(pathIdStr) || {
    pathId,
    startedAt: new Date(),
    progress: 0,
    currentStep: 0
  };
  
  // Mevcut ilerlemeyi güncelle
  Object.assign(progress, update);
  
  // İlk kez tamamlandıysa (%100)
  if (progress.progress >= 100 && !this.learningPathProgress.get(pathIdStr)?.completedAt) {
    this.completedLearningPathsCount += 1;
    progress.completedAt = new Date();
  }
  
  this.learningPathProgress.set(pathIdStr, progress);
  return progress;
};

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress; 