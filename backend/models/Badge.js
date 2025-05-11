const mongoose = require('mongoose');

// Rozet Şeması
const badgeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'ALGORITHM_MASTER', // Belirli bir algoritma kategorisindeki tüm algoritmaları tamamlamak
      'QUIZ_GENIUS', // Belirli sayıda quizi başarıyla tamamlamak
      'STREAK_HERO', // Belirli gün sayısı boyunca her gün giriş yapmak
      'LEARNER', // İlk kez bir algoritma görüntülemek
      'GRADUATE', // Bir öğrenme yolunu tamamlamak
      'CONTRIBUTOR', // Katkıda bulunmak (yorum yapmak, değerlendirme yapmak)
      'EXPLORER', // Tüm algoritma kategorilerinden en az bir algoritma görüntülemek
      'QUIZ_MASTER' // Bir quizi ilk kez başarıyla tamamlamak
    ],
    required: true,
    unique: true
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
  xpReward: {
    type: Number,
    default: 50
  },
  requirement: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    enum: [1, 2, 3], // Bronze, Silver, Gold
    default: 1
  }
}, {
  timestamps: true,
  collection: 'Rozetler'
});

const Badge = mongoose.model('Badge', badgeSchema);

// Örnek rozetler oluşturma fonksiyonu
async function initializeBadges() {
  try {
    const count = await Badge.countDocuments();
    if (count === 0) {
      const badges = [
        {
          type: 'LEARNER',
          name: 'İlk Adım',
          description: 'İlk algoritma detayını görüntülediniz',
          icon: 'first_step',
          xpReward: 10,
          requirement: { 
            viewCount: 1
          },
          level: 1
        },
        {
          type: 'ALGORITHM_MASTER',
          name: 'Sıralama Uzmanı',
          description: 'Tüm sıralama algoritmalarını tamamladınız',
          icon: 'sorting_master',
          xpReward: 100,
          requirement: { 
            category: 'Sıralama Algoritmaları', 
            completedCount: 5
          },
          level: 2
        },
        {
          type: 'QUIZ_GENIUS',
          name: 'Bilgi Dehası',
          description: '10 quizi başarıyla tamamladınız',
          icon: 'quiz_genius',
          xpReward: 150,
          requirement: { 
            completedQuizzes: 10, 
            passingScore: 75
          },
          level: 2
        },
        {
          type: 'STREAK_HERO',
          name: 'Kararlı Öğrenci',
          description: '7 gün arka arkaya çalıştınız',
          icon: 'streak_hero',
          xpReward: 50,
          requirement: { 
            streakDays: 7
          },
          level: 1
        },
        {
          type: 'GRADUATE',
          name: 'Algoritma Lisansı',
          description: 'İlk öğrenme yolunu tamamladınız',
          icon: 'graduate',
          xpReward: 200,
          requirement: { 
            completedPaths: 1
          },
          level: 2
        },
        {
          type: 'EXPLORER',
          name: 'Kaşif',
          description: 'Her kategoriden en az bir algoritma öğrendiniz',
          icon: 'explorer',
          xpReward: 100,
          requirement: { 
            uniqueCategories: 5
          },
          level: 2
        },
        {
          type: 'QUIZ_MASTER',
          name: 'Quiz Ustası',
          description: 'İlk kez bir quizi başarıyla tamamladınız!',
          icon: 'quiz_master',
          xpReward: 50,
          requirement: { 
            quizPassed: 1
          },
          level: 1
        }
      ];
      
      await Badge.insertMany(badges);
      console.log('Örnek rozetler başarıyla oluşturuldu');
    }
  } catch (error) {
    console.error('Rozet oluşturma hatası:', error);
  }
}

// Başlangıç verileri olarak kullanılabilir
module.exports = {
  Badge,
  initializeBadges
}; 