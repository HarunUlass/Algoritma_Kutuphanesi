const mongoose = require('mongoose');

// Kullanıcı Rozet Şeması
const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeType: {
    type: String,
    required: true,
    enum: ['LEARNER', 'QUIZ_MASTER', 'ALGORITHM_MASTER', 'QUIZ_GENIUS', 'STREAK_HERO', 'GRADUATE', 'EXPLORER']
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
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  xpReward: {
    type: Number,
    default: 0
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'Kullanıcı Rozetleri'
});

// Birleşik indeks oluştur - bir kullanıcı için her rozet türünden sadece bir tane olabilir
userBadgeSchema.index({ userId: 1, badgeType: 1 }, { unique: true });

// Kullanıcının tüm rozetlerini getiren statik metod
userBadgeSchema.statics.getUserBadges = async function(userId) {
  try {
    console.log(`Kullanıcı rozetleri getiriliyor: userId=${userId}`);
    
    // Tüm rozetlerin tanımını getir (kazanılmış veya kazanılmamış)
    const allBadgeDefinitions = [
      {
        type: 'LEARNER',
        name: 'İlk Adım',
        description: 'İlk algoritma detayını görüntülediniz',
        icon: 'first_step',
        level: 1,
        xpReward: 10
      },
      {
        type: 'QUIZ_MASTER',
        name: 'Quiz Ustası',
        description: 'İlk kez bir quizi başarıyla tamamladınız!',
        icon: 'quiz_master',
        level: 1,
        xpReward: 50
      },
      {
        type: 'ALGORITHM_MASTER',
        name: 'Sıralama Uzmanı',
        description: 'Tüm sıralama algoritmalarını tamamladınız',
        icon: 'sorting_master',
        level: 2,
        xpReward: 100
      },
      {
        type: 'QUIZ_GENIUS',
        name: 'Bilgi Dehası',
        description: '10 quizi başarıyla tamamladınız',
        icon: 'quiz_genius',
        level: 2,
        xpReward: 150
      },
      {
        type: 'STREAK_HERO',
        name: 'Kararlı Öğrenci',
        description: '7 gün arka arkaya çalıştınız',
        icon: 'streak_hero',
        level: 1,
        xpReward: 50
      },
      {
        type: 'GRADUATE',
        name: 'Algoritma Lisansı',
        description: 'İlk öğrenme yolunu tamamladınız',
        icon: 'graduate',
        level: 2,
        xpReward: 200
      },
      {
        type: 'EXPLORER',
        name: 'Kâşif',
        description: '20 farklı algoritma keşfettiniz',
        icon: 'explorer',
        level: 3,
        xpReward: 300
      }
    ];
    
    // Kullanıcının kazandığı rozetleri veritabanından çek
    const earnedBadges = await this.find({ userId }).lean();
    
    // Kazanılan rozetlerin tip listesini çıkar
    const earnedBadgeTypes = earnedBadges.map(badge => badge.badgeType);
    
    // Tüm rozet tanımlarını işle, kazanılmış olanları işaretle
    const result = allBadgeDefinitions.map(definition => {
      const earned = earnedBadgeTypes.includes(definition.type);
      const earnedBadge = earned ? earnedBadges.find(badge => badge.badgeType === definition.type) : null;
      
      return {
        type: definition.type,
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        level: definition.level,
        xpReward: definition.xpReward,
        earned,
        earnedAt: earned ? earnedBadge.earnedAt : null
      };
    });
    
    console.log(`${earnedBadges.length} kazanılmış rozet bulundu.`);
    return result;
  } catch (error) {
    console.error('Kullanıcı rozetleri getirme hatası:', error);
    return [];
  }
};

// Kullanıcıya yeni rozet ekleyen statik metod
userBadgeSchema.statics.awardBadge = async function(userId, badgeType) {
  try {
    console.log(`Rozet kazandırılıyor: userId=${userId}, badgeType=${badgeType}`);
    
    // Rozet tanımlarını bul
    const badgeDefinitions = {
      'LEARNER': {
        name: 'İlk Adım',
        description: 'İlk algoritma detayını görüntülediniz',
        icon: 'first_step',
        level: 1,
        xpReward: 10
      },
      'QUIZ_MASTER': {
        name: 'Quiz Ustası',
        description: 'İlk kez bir quizi başarıyla tamamladınız!',
        icon: 'quiz_master',
        level: 1,
        xpReward: 50
      },
      'ALGORITHM_MASTER': {
        name: 'Sıralama Uzmanı',
        description: 'Tüm sıralama algoritmalarını tamamladınız',
        icon: 'sorting_master',
        level: 2,
        xpReward: 100
      },
      'QUIZ_GENIUS': {
        name: 'Bilgi Dehası',
        description: '10 quizi başarıyla tamamladınız',
        icon: 'quiz_genius',
        level: 2,
        xpReward: 150
      },
      'STREAK_HERO': {
        name: 'Kararlı Öğrenci',
        description: '7 gün arka arkaya çalıştınız',
        icon: 'streak_hero',
        level: 1,
        xpReward: 50
      },
      'GRADUATE': {
        name: 'Algoritma Lisansı',
        description: 'İlk öğrenme yolunu tamamladınız',
        icon: 'graduate',
        level: 2,
        xpReward: 200
      },
      'EXPLORER': {
        name: 'Kâşif',
        description: '20 farklı algoritma keşfettiniz',
        icon: 'explorer',
        level: 3,
        xpReward: 300
      }
    };
    
    // Badye type geçerli mi kontrol et
    if (!badgeDefinitions[badgeType]) {
      throw new Error(`Geçersiz rozet türü: ${badgeType}`);
    }
    
    // Kullanıcının bu rozeti daha önce kazanıp kazanmadığını kontrol et
    const existingBadge = await this.findOne({ userId, badgeType });
    
    if (existingBadge) {
      console.log(`Kullanıcı bu rozeti zaten kazanmış: ${badgeType}`);
      return existingBadge;
    }
    
    // Rozet bilgisini tanımlardan al
    const badgeInfo = badgeDefinitions[badgeType];
    
    // Yeni rozet oluştur
    const newBadge = new this({
      userId,
      badgeType,
      name: badgeInfo.name,
      description: badgeInfo.description,
      icon: badgeInfo.icon,
      level: badgeInfo.level,
      xpReward: badgeInfo.xpReward,
      earnedAt: new Date()
    });
    
    // Rozeti kaydet
    await newBadge.save();
    
    console.log(`Rozet kazandırıldı: ${badgeType}`);
    return newBadge;
  } catch (error) {
    console.error('Rozet kazandırma hatası:', error);
    throw error;
  }
};

// Kullanıcı görüntüleme sayısını kontrol eden ve EXPLORER rozetini kazandıran fonksiyon
userBadgeSchema.statics.checkAlgorithmViewMilestone = async function(userId, uniqueAlgorithmCount) {
  try {
    // Eğer kullanıcı 20 veya daha fazla benzersiz algoritma görüntülediyse Kâşif rozetini ver
    if (uniqueAlgorithmCount >= 20) {
      const existingBadge = await this.findOne({ userId, badgeType: 'EXPLORER' });
      
      if (!existingBadge) {
        console.log(`Kullanıcı 20 algoritma görüntüledi, EXPLORER rozeti kazandırılıyor.`);
        return await this.awardBadge(userId, 'EXPLORER');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Algoritma görüntüleme rozeti kontrol hatası:', error);
    return null;
  }
};

// Kullanıcın ilk algoritma görüntülemesinde LEARNER rozetini kazandıran fonksiyon
userBadgeSchema.statics.checkFirstView = async function(userId) {
  try {
    // İlk Adım rozetini kontrol et ve kazandır
    const existingBadge = await this.findOne({ userId, badgeType: 'LEARNER' });
    
    if (!existingBadge) {
      console.log(`Kullanıcı ilk algoritma görüntülemesini yaptı, LEARNER rozeti kazandırılıyor.`);
      return await this.awardBadge(userId, 'LEARNER');
    }
    
    return null;
  } catch (error) {
    console.error('İlk görüntüleme rozeti kontrol hatası:', error);
    return null;
  }
};

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

module.exports = UserBadge; 