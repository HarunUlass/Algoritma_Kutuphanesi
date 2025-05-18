const mongoose = require('mongoose');

// Görüntülenen Algoritma Şeması
const viewedAlgorithmSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
    type: String
  },
  complexity: {
    type: String
  },
  difficulty: {
    type: String
  },
  viewCount: {
    type: Number,
    default: 1
  },
  firstViewed: {
    type: Date,
    default: Date.now
  },
  lastViewed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'Görüntülenen Algoritmalar'
});

// Birleşik indeks oluştur - bir kullanıcı için her algoritmadan sadece bir kayıt olmalı
viewedAlgorithmSchema.index({ userId: 1, algorithmId: 1 }, { unique: true });

// Son n algoritma görüntüleme kaydını getiren statik metod
viewedAlgorithmSchema.statics.getRecentlyViewed = async function(userId, limit = 5) {
  try {
    console.log(`Son görüntülenen algoritmalar getiriliyor: userId=${userId}, limit=${limit}`);
    
    // userId'yi string formatında kullan
    const userIdStr = userId.toString();
    
    const result = await this.find({ userId: userIdStr })
      .sort({ lastViewed: -1 })
      .limit(limit)
      .populate('algorithmId', 'title description complexity')
      .exec();
    
    console.log(`${result.length} algoritma bulundu`);
    return result;
  } catch (error) {
    console.error('Son görüntülenen algoritmaları getirme hatası:', error);
    // Hata olsa bile boş array dön
    return [];
  }
};

// Algoritma görüntüleme kaydını güncelleyen veya ekleyen statik metod
viewedAlgorithmSchema.statics.recordView = async function(userId, algorithm) {
  // Algoritma ID'si yoksa hata fırlat
  if (!algorithm._id) {
    throw new Error('Algoritma ID\'si eksik');
  }

  try {
    console.log(`Algoritma görüntüleme kaydediliyor: userId=${userId}, algorithm=${algorithm.title || algorithm._id}`);
    
    // userId ve algorithmId'yi string formatında kullan
    const userIdStr = userId.toString();
    const algorithmIdStr = algorithm._id.toString();
    
    // Görüntüleme kaydını bul veya oluştur
    const record = await this.findOneAndUpdate(
      { userId: userIdStr, algorithmId: algorithmIdStr },
      { 
        $set: {
          title: algorithm.title,
          description: algorithm.description || '',
          complexity: algorithm.complexity || '',
          difficulty: algorithm.difficulty || '',
          lastViewed: new Date()
        },
        $inc: { viewCount: 1 }
      },
      { 
        new: true, 
        upsert: true 
      }
    );
    
    console.log(`Algoritma görüntüleme kaydedildi: ${algorithm.title}`);
    return record;
  } catch (error) {
    console.error('Algoritma görüntüleme kaydı hatası:', error);
    throw error;
  }
};

const ViewedAlgorithm = mongoose.model('ViewedAlgorithm', viewedAlgorithmSchema);

module.exports = ViewedAlgorithm; 