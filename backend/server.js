const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Bağlantı URI'si
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Bağlantısı
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'Algoritmalar' // Açıkça veritabanı adı belirtiyoruz
})
.then(() => {
  console.log('MongoDB Atlas\'a başarıyla bağlanıldı');
  // Başlatma verilerini ekle
  initializeData();
})
.catch((err) => {
  console.error('MongoDB Atlas bağlantı hatası:', err);
});

// Model importları
const User = require('./models/User');
const Algorithm = require('./models/Algorithm');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');
const UserProgress = require('./models/UserProgress');
const LearningPath = require('./models/LearningPath');
const { Badge, initializeBadges } = require('./models/Badge');

// Veritabanı başlatma fonksiyonu
async function initializeData() {
  try {
    // Algoritmalar koleksiyonunun boş olup olmadığını kontrol et
    const count = await Algorithm.countDocuments();
    console.log(`Veritabanında ${count} algoritma bulundu`);
    
    // Bubble Sort algoritmasının varlığını kontrol et
    const existingBubbleSort = await Algorithm.findOne({ 
      title: { $regex: new RegExp('^Bubble Sort$', 'i') } 
    });
    
    if (existingBubbleSort) {
      console.log('Bubble Sort algoritması zaten mevcut:', existingBubbleSort.title);
      
      // Bubble Sort algoritması için bir quiz var mı kontrol et
      const existingQuiz = await Quiz.findOne({ title: { $regex: new RegExp('^Bubble Sort Quiz$', 'i') } });
      
      if (existingQuiz) {
        console.log('Bubble Sort Quiz zaten mevcut');
      } else {
        console.log('Bubble Sort Quiz oluşturuluyor...');
        
        // Örnek bir quiz oluştur
        const bubbleSortQuiz = new Quiz({
          algorithmId: existingBubbleSort._id,
          title: "Bubble Sort Quiz",
          description: "Bubble Sort algoritmasını ne kadar iyi öğrendiniz? Bu quiz ile kendinizi test edin.",
          difficulty: "Kolay",
          timeLimit: 15, // 15 dakika
          multipleChoiceQuestions: [
            {
              question: "Bubble Sort'un en kötü durum zaman karmaşıklığı nedir?",
              options: [
                { text: "O(n)", isCorrect: false, explanation: "Bu en iyi durum karmaşıklığıdır, zaten sıralı bir dizide." },
                { text: "O(n²)", isCorrect: true, explanation: "Doğru! Her eleman için tüm diziyi geçmemiz gerektiğinden." },
                { text: "O(n log n)", isCorrect: false, explanation: "Bu Merge Sort veya Quick Sort gibi daha verimli algoritmaların karmaşıklığıdır." },
                { text: "O(2ⁿ)", isCorrect: false, explanation: "Bu üstel bir karmaşıklıktır ve Bubble Sort için geçerli değildir." }
              ]
            },
            {
              question: "Bubble Sort'un alan karmaşıklığı nedir?",
              options: [
                { text: "O(1)", isCorrect: true, explanation: "Doğru! Bubble Sort in-place bir algoritmadır, ekstra bellek kullanmaz." },
                { text: "O(n)", isCorrect: false, explanation: "Bubble Sort ekstra dizi kullanmaz." },
                { text: "O(log n)", isCorrect: false, explanation: "Bu bir sıralama algoritması için alan karmaşıklığı değildir." },
                { text: "O(n²)", isCorrect: false, explanation: "Bubble Sort bu kadar bellek kullanmaz." }
              ]
            },
            {
              question: "Bubble Sort kararlı bir algoritma mıdır? (Aynı değere sahip öğelerin sırası korunur mu?)",
              options: [
                { text: "Evet", isCorrect: true, explanation: "Doğru! Bubble Sort kararlı bir algoritmadır. Eşit değerli elemanların sırası değişmez." },
                { text: "Hayır", isCorrect: false, explanation: "Bubble Sort kararlı bir algoritmadır, eşit değerli elemanların sırası değişmez." }
              ]
            }
          ],
          codeCompletionQuestions: [
            {
              question: "Aşağıdaki Bubble Sort implementasyonunu tamamlayın. Dizideki elemanların takas edildiği kısmı doldurun.",
              codeTemplate: "function bubbleSort(arr) {\n  const n = arr.length;\n  \n  for (let i = 0; i < n; i++) {\n    for (let j = 0; j < n - i - 1; j++) {\n      // Eğer mevcut eleman bir sonrakinden büyükse\n      if (arr[j] > arr[j + 1]) {\n        // BURAYA KOD YAZIN: Elemanları yer değiştirin\n        \n      }\n    }\n  }\n  \n  return arr;\n}",
              solution: "[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];",
              hints: [
                "JavaScript'te array destructuring kullanabilirsiniz",
                "Eleman değişimi için geçici bir değişken kullanmaya gerek yoktur"
              ]
            }
          ],
          totalPoints: 40, // 3 çoktan seçmeli (3x10) + 1 kod tamamlama (1x20)
          passingScore: 25 // Geçmek için %60 puan
        });
        
        await bubbleSortQuiz.save();
        console.log('Bubble Sort Quiz başarıyla oluşturuldu');
      }
    } else {
      console.log('Bubble Sort algoritması ekleniyor...');
      
      // Örnek algoritma verisi
      const bubbleSort = {
        title: "Bubble Sort",
        complexity: {
          time: {
            best: "O(n)",
            average: "O(n²22222)",
            worst: "O(n²)"
          },
          space: "O(1)"
        },
        stability: "Kararlı",
        description: "Bubble Sort, dizideki her elemanı komşusu ile karşılaştırarak çalışan basit bir sıralama algoritmasıdır. Adını, her geçişte en büyük elemanın dizi sonuna doğru kabarcık gibi yükselmesinden alır.",
        steps: [
          "Dizinin ilk elemanından başlayarak her elemanı bir sonraki ile karşılaştır.",
          "Eğer şu anki eleman bir sonrakinden büyükse, elemanları yer değiştir.",
          "Dizinin sonuna kadar devam et.",
          "Diziyi bir kez geçtikten sonra, en büyük eleman dizinin sonunda olacaktır.",
          "Bu işlemi dizinin sonuna yerleştirdiğin eleman sayısı kadar azaltarak tekrarla.",
          "Hiçbir takas işlemi gerçekleşmezse, dizi sıralanmış demektir."
        ],
        pros: [
          "Kolay uygulanabilir.",
          "Az yer kaplar (in-place sıralama).",
          "Kararlı bir sıralama algoritmasıdır (eşit elemanların sırası korunur)."
        ],
        cons: [
          "Büyük dizilerde verimsizdir (O(n²) karmaşıklığı).",
          "Quick Sort, Merge Sort gibi daha hızlı algoritmalardan çok daha yavaştır."
        ],
        exampleCode: {
          language: "JavaScript",
          code: "function bubbleSort(arr) {\n  let n = arr.length;\n  for (let i = 0; i < n; i++) {\n    // Son i eleman zaten yerleştirildi\n    let swapped = false;\n    for (let j = 0; j < n - i - 1; j++) {\n      // Dizi içinde ilerle\n      if (arr[j] > arr[j + 1]) {\n        // Elemanları takas et\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n        swapped = true;\n      }\n    }\n    // Eğer hiç takas olmadıysa, dizi sıralanmıştır\n    if (!swapped) break;\n  }\n  return arr;\n}"
        }
      };
      
      // Bubble Sort'u ekle
      const savedAlgorithm = await new Algorithm(bubbleSort).save();
      console.log('Bubble Sort algoritması başarıyla eklendi:', savedAlgorithm.title);
      
      // Quiz'i de ekle
      const bubbleSortQuiz = new Quiz({
        algorithmId: savedAlgorithm._id,
        title: "Bubble Sort Quiz",
        description: "Bubble Sort algoritmasını ne kadar iyi öğrendiniz? Bu quiz ile kendinizi test edin.",
        difficulty: "Kolay",
        timeLimit: 15, // 15 dakika
        multipleChoiceQuestions: [
          {
            question: "Bubble Sort'un en kötü durum zaman karmaşıklığı nedir?",
            options: [
              { text: "O(n)", isCorrect: false, explanation: "Bu en iyi durum karmaşıklığıdır, zaten sıralı bir dizide." },
              { text: "O(n²)", isCorrect: true, explanation: "Doğru! Her eleman için tüm diziyi geçmemiz gerektiğinden." },
              { text: "O(n log n)", isCorrect: false, explanation: "Bu Merge Sort veya Quick Sort gibi daha verimli algoritmaların karmaşıklığıdır." },
              { text: "O(2ⁿ)", isCorrect: false, explanation: "Bu üstel bir karmaşıklıktır ve Bubble Sort için geçerli değildir." }
            ]
          },
          {
            question: "Bubble Sort'un alan karmaşıklığı nedir?",
            options: [
              { text: "O(1)", isCorrect: true, explanation: "Doğru! Bubble Sort in-place bir algoritmadır, ekstra bellek kullanmaz." },
              { text: "O(n)", isCorrect: false, explanation: "Bubble Sort ekstra dizi kullanmaz." },
              { text: "O(log n)", isCorrect: false, explanation: "Bu bir sıralama algoritması için alan karmaşıklığı değildir." },
              { text: "O(n²)", isCorrect: false, explanation: "Bubble Sort bu kadar bellek kullanmaz." }
            ]
          },
          {
            question: "Bubble Sort kararlı bir algoritma mıdır? (Aynı değere sahip öğelerin sırası korunur mu?)",
            options: [
              { text: "Evet", isCorrect: true, explanation: "Doğru! Bubble Sort kararlı bir algoritmadır. Eşit değerli elemanların sırası değişmez." },
              { text: "Hayır", isCorrect: false, explanation: "Bubble Sort kararlı bir algoritmadır, eşit değerli elemanların sırası değişmez." }
            ]
          }
        ],
        codeCompletionQuestions: [
          {
            question: "Aşağıdaki Bubble Sort implementasyonunu tamamlayın. Dizideki elemanların takas edildiği kısmı doldurun.",
            codeTemplate: "function bubbleSort(arr) {\n  const n = arr.length;\n  \n  for (let i = 0; i < n; i++) {\n    for (let j = 0; j < n - i - 1; j++) {\n      // Eğer mevcut eleman bir sonrakinden büyükse\n      if (arr[j] > arr[j + 1]) {\n        // BURAYA KOD YAZIN: Elemanları yer değiştirin\n        \n      }\n    }\n  }\n  \n  return arr;\n}",
            solution: "[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];",
            hints: [
              "JavaScript'te array destructuring kullanabilirsiniz",
              "Eleman değişimi için geçici bir değişken kullanmaya gerek yoktur"
            ]
          }
        ],
        totalPoints: 40, // 3 çoktan seçmeli (3x10) + 1 kod tamamlama (1x20)
        passingScore: 25 // Geçmek için %60 puan
      });
      
      await bubbleSortQuiz.save();
      console.log('Bubble Sort Quiz başarıyla oluşturuldu');
    }
    
    // Rozet verilerini yükle
    await initializeBadges();
    
    // Örnek öğrenme yolları oluştur
    await initializeLearningPaths();
    
  } catch (error) {
    console.error('Başlangıç verilerini eklerken hata oluştu:', error);
  }
}

// Örnek öğrenme yolları
async function initializeLearningPaths() {
  try {
    const count = await LearningPath.countDocuments();
    
    if (count === 0) {
      // Sıralama Algoritmaları öğrenme yolu için algoritmaları bul
      const bubbleSort = await Algorithm.findOne({ title: 'Bubble Sort' });
      const bubbleSortQuiz = await Quiz.findOne({ title: 'Bubble Sort Quiz' });
      
      if (bubbleSort && bubbleSortQuiz) {
        // Örnek bir öğrenme yolu oluştur
        const sortingPath = new LearningPath({
          title: 'Sıralama Algoritmaları 101',
          description: 'Temel sıralama algoritmalarını öğrenmek için en iyi başlangıç noktası. Algoritmaların çalışma prensiplerini, avantaj ve dezavantajlarını öğreneceksiniz.',
          category: 'Sıralama Algoritmaları',
          difficulty: 'Başlangıç',
          prerequisites: ['Temel programlama bilgisi', 'Dizi (Array) veri yapısı bilgisi'],
          steps: [
            {
              type: 'ALGORITHM',
              title: 'Bubble Sort',
              description: 'Bubble Sort algoritmasının çalışma prensiplerini öğrenin',
              entityId: bubbleSort._id,
              estimatedTime: 30,
              xpReward: 25
            },
            {
              type: 'QUIZ',
              title: 'Bubble Sort Quiz',
              description: 'Bubble Sort bilginizi test edin',
              entityId: bubbleSortQuiz._id,
              estimatedTime: 15,
              xpReward: 35
            }
          ]
        });
        
        await sortingPath.save();
        console.log('Örnek öğrenme yolu oluşturuldu:', sortingPath.title);
      }
    } else {
      console.log(`Veritabanında ${count} öğrenme yolu zaten mevcut`);
    }
  } catch (error) {
    console.error('Öğrenme yolları oluşturma hatası:', error);
  }
}

// Routes
// Kullanıcı işlemleri
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Bu email veya kullanıcı adı zaten kullanılıyor'
      });
    }

    const user = new User({ email, username, password });
    await user.save();

    res.status(201).json({
      message: 'Kullanıcı başarıyla kaydedildi',
      username: user.username
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      error: 'Kayıt işlemi sırasında bir hata oluştu'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı'
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        error: 'Hatalı şifre'
      });
    }

    res.json({
      message: 'Giriş başarılı',
      username: user.username
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      error: 'Giriş işlemi sırasında bir hata oluştu'
    });
  }
});

// Algoritma işlemleri
app.get('/api/algorithms', async (req, res) => {
  try {
    const algorithms = await Algorithm.find({}, 'title description complexity');
    console.log(`${algorithms.length} algoritma bulundu`);
    res.json(algorithms);
  } catch (error) {
    console.error('Algoritmaları getirme hatası:', error);
    res.status(500).json({
      error: 'Algoritmaları getirirken bir hata oluştu'
    });
  }
});

// Önce statik/spesifik endpointler
// Algoritma favorisine göre filtreleme ve sıralama
app.get('/api/algorithms/filter', async (req, res) => {
  try {
    const { userId, favoritesOnly, sortBy } = req.query;
    
    // Base query
    let query = {};
    
    // Favori filtrelemesi
    if (userId && favoritesOnly === 'true') {
      // Kullanıcının var olup olmadığını kontrol et
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }
      
      // Kullanıcının ilerleme bilgisini getir
      const userProgress = await UserProgress.findOne({ userId });
      
      if (!userProgress || userProgress.algorithmProgress.size === 0) {
        return res.json([]);
      }
      
      // Favori algoritma ID'lerini bul
      const favoriteIds = Array.from(userProgress.algorithmProgress.entries())
        .filter(([_, progress]) => progress.isFavorite)
        .map(([id, _]) => mongoose.Types.ObjectId(id));
      
      if (favoriteIds.length === 0) {
        return res.json([]);
      }
      
      query._id = { $in: favoriteIds };
    }
    
    // Algoritmaları getir
    let algorithms = await Algorithm.find(query, 'title description complexity');
    
    // Sıralama
    if (sortBy) {
      switch (sortBy) {
        case 'title':
          algorithms.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'timeComplexity':
          // Karmaşıklık sıralaması (daha basit olanlar önce)
          const complexityRanking = {
            'O(1)': 1,
            'O(log n)': 2,
            'O(n)': 3,
            'O(n log n)': 4,
            'O(n²)': 5,
            'O(n³)': 6,
            'O(2ⁿ)': 7,
            'O(n!)': 8
          };
          
          algorithms.sort((a, b) => {
            const complexityA = a.complexity?.time?.average || a.complexity?.time?.worst || 'N/A';
            const complexityB = b.complexity?.time?.average || b.complexity?.time?.worst || 'N/A';
            return (complexityRanking[complexityA] || 999) - (complexityRanking[complexityB] || 999);
          });
          break;
        // Diğer sıralama kriterleri buraya eklenebilir
      }
    }
    
    res.json(algorithms);
  } catch (error) {
    console.error('Algoritma filtreleme hatası:', error);
    res.status(500).json({
      error: 'Algoritmaları filtrelerken bir hata oluştu'
    });
  }
});

// Algoritma performans metriklerini getir
app.get('/api/algorithms/performance', async (req, res) => {
  try {
    // Tüm algoritmaları getir
    const algorithms = await Algorithm.find({}, 'title complexity');
    
    // Performans verileri - karmaşıklık değerlerini tablolaştır
    const performanceData = {
      algorithms: algorithms.map(algo => ({
        _id: algo._id,
        title: algo.title,
        timeComplexity: {
          best: algo.complexity?.time?.best || 'N/A',
          average: algo.complexity?.time?.average || 'N/A',
          worst: algo.complexity?.time?.worst || 'N/A'
        },
        spaceComplexity: algo.complexity?.space || 'N/A'
      })),
      complexityRanking: [
        'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)'
      ]
    };
    
    res.json(performanceData);
  } catch (error) {
    console.error('Algoritma performans verileri hatası:', error);
    res.status(500).json({
      error: 'Algoritma performans verilerini getirirken bir hata oluştu'
    });
  }
});

// Algoritma Karşılaştırma API'si
app.post('/api/algorithms/compare', async (req, res) => {
  try {
    const { algorithmIds } = req.body;
    
    if (!algorithmIds || !Array.isArray(algorithmIds) || algorithmIds.length < 2) {
      return res.status(400).json({
        error: 'En az iki algoritma ID\'si gereklidir'
      });
    }
    
    // Algoritmaları getir
    const algorithms = await Algorithm.find({ 
      _id: { $in: algorithmIds.map(id => mongoose.Types.ObjectId(id)) } 
    });
    
    if (algorithms.length !== algorithmIds.length) {
      return res.status(404).json({
        error: 'Bazı algoritmalar bulunamadı'
      });
    }
    
    // Karşılaştırma için algoritma verilerini hazırla
    const comparisonData = algorithms.map(algo => ({
      _id: algo._id,
      title: algo.title,
      complexity: algo.complexity,
      stability: algo.stability,
      pros: algo.pros,
      cons: algo.cons
    }));
    
    res.json(comparisonData);
  } catch (error) {
    console.error('Algoritma karşılaştırma hatası:', error);
    res.status(500).json({
      error: 'Algoritmaları karşılaştırırken bir hata oluştu'
    });
  }
});

// İki algoritmanın çalışma sürelerini karşılaştır (simülasyon)
app.post('/api/algorithms/compare-runtime', async (req, res) => {
  try {
    const { algorithmIds, inputSizes } = req.body;
    
    if (!algorithmIds || !Array.isArray(algorithmIds) || algorithmIds.length < 1) {
      return res.status(400).json({
        error: 'En az bir algoritma ID\'si gereklidir'
      });
    }
    
    if (!inputSizes || !Array.isArray(inputSizes) || inputSizes.length < 1) {
      return res.status(400).json({
        error: 'En az bir girdi boyutu gereklidir'
      });
    }
    
    // Algoritmaları getir
    const algorithms = await Algorithm.find({ 
      _id: { $in: algorithmIds.map(id => mongoose.Types.ObjectId(id)) } 
    }, 'title complexity');
    
    if (algorithms.length === 0) {
      return res.status(404).json({
        error: 'Algoritmalar bulunamadı'
      });
    }
    
    // Farklı girdi boyutları için tahmini çalışma sürelerini hesapla
    const runtimeData = algorithms.map(algo => {
      const timeComplexity = algo.complexity?.time?.average || algo.complexity?.time?.worst || 'O(n)';
      
      // Karmaşıklık fonksiyonlarını işlev olarak eşleştir
      const complexityFunctions = {
        'O(1)': n => 1,
        'O(log n)': n => Math.log2(n),
        'O(n)': n => n,
        'O(n log n)': n => n * Math.log2(n),
        'O(n²)': n => n * n,
        'O(n³)': n => n * n * n,
        'O(2ⁿ)': n => Math.pow(2, n),
        'O(n!)': n => n <= 1 ? 1 : Array(n).fill(0).map((_, i) => i + 1).reduce((a, b) => a * b)
      };
      
      // Karmaşıklık fonksiyonunu seç, eğer yoksa doğrusal varsay
      const complexityFunction = complexityFunctions[timeComplexity] || complexityFunctions['O(n)'];
      
      // Simüle edilmiş çalışma sürelerini hesapla (ms cinsinden)
      const runtimes = inputSizes.map(size => {
        let relativeTime;
        try {
          // Çok büyük değerler için hesaplamayı sınırla
          if ((timeComplexity === 'O(2ⁿ)' || timeComplexity === 'O(n!)') && size > 20) {
            relativeTime = Infinity;
          } else {
            relativeTime = complexityFunction(size);
          }
          
          // Büyük değerleri kırp
          if (relativeTime > 1e10) {
            return { size, time: Infinity };
          }
          
          // Simüle edilmiş süre (ms)
          return { size, time: relativeTime * 0.1 };
        } catch (error) {
          return { size, time: Infinity };
        }
      });
      
      return {
        _id: algo._id,
        title: algo.title,
        timeComplexity,
        runtimes
      };
    });
    
    res.json(runtimeData);
  } catch (error) {
    console.error('Algoritma çalışma süresi karşılaştırma hatası:', error);
    res.status(500).json({
      error: 'Algoritma çalışma sürelerini karşılaştırırken bir hata oluştu'
    });
  }
});

// Algoritma ID'ye göre quizleri getir
app.get('/api/algorithms/:algorithmId/quizzes', async (req, res) => {
  try {
    const { algorithmId } = req.params;
    
    // Önce algoritmanın var olup olmadığını kontrol et
    const algorithm = await Algorithm.findById(algorithmId);
    
    if (!algorithm) {
      return res.status(404).json({
        error: 'Algoritma bulunamadı'
      });
    }
    
    // Algoritma için quizleri getir
    const quizzes = await Quiz.find({ algorithmId }, 'title description difficulty timeLimit totalPoints');
    
    res.json(quizzes);
  } catch (error) {
    console.error('Algoritma quizlerini getirme hatası:', error);
    res.status(500).json({
      error: 'Algoritma quizlerini getirirken bir hata oluştu'
    });
  }
});

// Parametreli routelar en son tanımlanmalı
app.get('/api/algorithms/:title', async (req, res) => {
  try {
    const title = req.params.title;
    console.log(`Aranan algoritma: "${title}"`);
    
    // Tüm algoritmaları getir ve log'la (debug için)
    const allAlgos = await Algorithm.find({}, 'title');
    console.log('Veritabanındaki algoritmalar:', allAlgos.map(algo => algo.title));
    
    // Algoritma başlığı birebir eşleşme yerine case-insensitive arama yap
    const algorithm = await Algorithm.findOne({ 
      title: { $regex: new RegExp(`^${title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } 
    });
    
    if (!algorithm) {
      console.log(`Algoritma bulunamadı: "${title}"`);
      return res.status(404).json({
        error: 'Algoritma bulunamadı'
      });
    }
    
    console.log(`Algoritma bulundu: ${algorithm.title}`);
    res.json(algorithm);
  } catch (error) {
    console.error('Algoritma detayını getirme hatası:', error);
    res.status(500).json({
      error: 'Algoritma detayını getirirken bir hata oluştu'
    });
  }
});

// Quiz API Endpointleri
// Tüm quizleri getir
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find({}, 'title description difficulty timeLimit totalPoints').populate('algorithmId', 'title');
    res.json(quizzes);
  } catch (error) {
    console.error('Quizleri getirme hatası:', error);
    res.status(500).json({
      error: 'Quizleri getirirken bir hata oluştu'
    });
  }
});

// Belirli bir quizi getir
app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate('algorithmId', 'title');
    
    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz bulunamadı'
      });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Quiz detayını getirme hatası:', error);
    res.status(500).json({
      error: 'Quiz detayını getirirken bir hata oluştu'
    });
  }
});

// Yeni bir quiz başlat
app.post('/api/quizzes/:quizId/start', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;
    
    console.log(`Quiz başlatma isteği: quizId=${quizId}, userId=${userId || 'Misafir kullanıcı'}`);
    
    // Önce quizi bul
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      console.error(`Quiz bulunamadı: ${quizId}`);
      return res.status(404).json({
        error: 'Quiz bulunamadı'
      });
    }
    
    console.log(`Quiz bulundu: ${quiz.title}`);
    
    // Kullanıcı kimliği sağlanmışsa, kullanıcıyı kontrol et
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      
      if (!user) {
        console.error(`Kullanıcı bulunamadı: ${userId}`);
        // Kullanıcı bulunamadıysa bile quiz'e devam edebilir,
        // ancak ilerleme kaydedilmeyecek
        console.log('Kullanıcı bulunamadı. Misafir modunda devam ediliyor.');
      }
    }
    
    let attemptId = null;
    
    // Kullanıcı varsa aktif girişim kontrolü yap
    if (user) {
      // Aktif bir girişim olup olmadığını kontrol et
      const activeAttempt = await QuizAttempt.findOne({
        userId,
        quizId,
        completed: false
      });
      
      if (activeAttempt) {
        console.log(`Aktif quiz girişimi bulundu: ${activeAttempt._id}`);
        attemptId = activeAttempt._id;
      } else {
        // Yeni bir girişim oluştur
        const newAttempt = new QuizAttempt({
          userId,
          quizId,
          startTime: new Date()
        });
        
        await newAttempt.save();
        console.log(`Yeni quiz girişimi oluşturuldu: ${newAttempt._id}`);
        attemptId = newAttempt._id;
      }
    } else {
      // Misafir kullanıcı için geçici bir girişim oluştur (kaydedilmez)
      console.log('Misafir kullanıcı için geçici girişim kimliği oluşturuluyor');
      attemptId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Soruları gizleyerek quiz verilerini gönder
    const quizData = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      totalPoints: quiz.totalPoints,
      passingScore: quiz.passingScore,
      multipleChoiceQuestions: quiz.multipleChoiceQuestions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options.map(o => ({
          _id: o._id,
          text: o.text
        }))
      })),
      codeCompletionQuestions: quiz.codeCompletionQuestions && quiz.codeCompletionQuestions.length > 0 
        ? quiz.codeCompletionQuestions.map(q => ({
            _id: q._id,
            question: q.question,
            codeTemplate: q.codeTemplate,
            hints: q.hints
          }))
        : [],
      attemptId: attemptId
    };
    
    console.log(`Quiz verisi hazırlandı, sorular: MC=${quizData.multipleChoiceQuestions.length}, CC=${quizData.codeCompletionQuestions.length}`);
    res.status(200).json(quizData);
  } catch (error) {
    console.error('Quiz başlatma hatası:', error);
    res.status(500).json({
      error: `Quiz başlatırken bir hata oluştu: ${error.message}`
    });
  }
});

// Çoktan seçmeli soru cevabını gönder
app.post('/api/quiz-attempts/:attemptId/multiple-choice', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionIndex, selectedOptions } = req.body;
    
    // Geçici ID kontrolü (misafir kullanıcı için)
    if (attemptId.startsWith('temp_')) {
      // Misafir kullanıcı için doğrudan quiz bilgilerini getir
      const quizId = req.body.quizId; // İstek gövdesinden quiz ID'sini al
      
      if (!quizId) {
        return res.status(400).json({
          error: 'Quiz ID gereklidir'
        });
      }
      
      // MongoDB ObjectId formatını kontrol et
      let quiz;
      try {
        quiz = await Quiz.findById(quizId);
      } catch (err) {
        console.error('Geçersiz Quiz ID formatı:', err);
        return res.status(400).json({
          error: 'Geçersiz Quiz ID formatı'
        });
      }
      
      if (!quiz || !quiz.multipleChoiceQuestions[questionIndex]) {
        return res.status(404).json({
          error: 'Quiz veya soru bulunamadı'
        });
      }
      
      // Soruyu ve doğru cevapları al
      const question = quiz.multipleChoiceQuestions[questionIndex];
      const correctOptionIndices = question.options
        .map((option, index) => option.isCorrect ? index : null)
        .filter(index => index !== null);
      
      // Cevabın doğruluğunu kontrol et
      const isCorrect = selectedOptions.length === correctOptionIndices.length &&
        selectedOptions.every(index => correctOptionIndices.includes(index));
      
      // Her soru 10 puan değerinde
      const pointsEarned = isCorrect ? 10 : 0;
      
      return res.json({
        isCorrect,
        pointsEarned,
        explanation: isCorrect 
          ? question.options.find(o => o.isCorrect)?.explanation 
          : question.options.filter((_, i) => selectedOptions.includes(i)).map(o => o.explanation).join(' ')
      });
    }
    
    // Kayıtlı kullanıcı için normal işlem
    let attempt;
    try {
      attempt = await QuizAttempt.findById(attemptId);
    } catch (err) {
      console.error('Geçersiz Attempt ID formatı:', err);
      return res.status(400).json({
        error: 'Geçersiz Quiz Girişimi ID formatı'
      });
    }
    
    if (!attempt) {
      return res.status(404).json({
        error: 'Quiz girişimi bulunamadı'
      });
    }
    
    if (attempt.completed) {
      return res.status(400).json({
        error: 'Bu quiz girişimi zaten tamamlanmış'
      });
    }
    
    // İlgili quiz ve soruyu getir
    const quiz = await Quiz.findById(attempt.quizId);
    
    if (!quiz || !quiz.multipleChoiceQuestions[questionIndex]) {
      return res.status(404).json({
        error: 'Quiz veya soru bulunamadı'
      });
    }
    
    // Soruyu ve doğru cevapları al
    const question = quiz.multipleChoiceQuestions[questionIndex];
    const correctOptionIndices = question.options
      .map((option, index) => option.isCorrect ? index : null)
      .filter(index => index !== null);
    
    // Cevabın doğruluğunu kontrol et
    const isCorrect = selectedOptions.length === correctOptionIndices.length &&
      selectedOptions.every(index => correctOptionIndices.includes(index));
    
    // Her soru 10 puan değerinde
    const pointsEarned = isCorrect ? 10 : 0;
    
    // Cevabı kaydet
    const answer = {
      questionIndex,
      selectedOptions,
      isCorrect,
      pointsEarned
    };
    
    // Aynı soruya daha önce cevap verilmiş mi kontrol et
    const existingAnswerIndex = attempt.multipleChoiceAnswers.findIndex(a => a.questionIndex === questionIndex);
    
    if (existingAnswerIndex >= 0) {
      // Var olan cevabı güncelle
      attempt.multipleChoiceAnswers[existingAnswerIndex] = answer;
    } else {
      // Yeni cevap ekle
      attempt.multipleChoiceAnswers.push(answer);
    }
    
    await attempt.save();
    
    res.json({
      isCorrect,
      pointsEarned,
      explanation: isCorrect 
        ? question.options.find(o => o.isCorrect)?.explanation 
        : question.options.filter((_, i) => selectedOptions.includes(i)).map(o => o.explanation).join(' ')
    });
  } catch (error) {
    console.error('Çoktan seçmeli soru cevaplama hatası:', error);
    res.status(500).json({
      error: 'Cevap gönderirken bir hata oluştu'
    });
  }
});

// Kod tamamlama cevabını gönder
app.post('/api/quiz-attempts/:attemptId/code-completion', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionIndex, userCode } = req.body;
    
    // Geçici ID kontrolü (misafir kullanıcı için)
    if (attemptId.startsWith('temp_')) {
      // Misafir kullanıcı için doğrudan quiz bilgilerini getir
      const quizId = req.body.quizId; // İstek gövdesinden quiz ID'sini al
      
      if (!quizId) {
        return res.status(400).json({
          error: 'Quiz ID gereklidir'
        });
      }
      
      // MongoDB ObjectId formatını kontrol et
      let quiz;
      try {
        quiz = await Quiz.findById(quizId);
      } catch (err) {
        console.error('Geçersiz Quiz ID formatı:', err);
        return res.status(400).json({
          error: 'Geçersiz Quiz ID formatı'
        });
      }
      
      if (!quiz || !quiz.codeCompletionQuestions[questionIndex]) {
        return res.status(404).json({
          error: 'Quiz veya soru bulunamadı'
        });
      }
      
      // Soruyu al
      const question = quiz.codeCompletionQuestions[questionIndex];
      
      // Basit bir kod doğrulama: çözüm kullanıcı kodunda var mı?
      const solution = question.solution.trim();
      const normalizedUserCode = userCode.trim();
      const isCorrect = normalizedUserCode.includes(solution);
      
      // Kod tamamlama soruları 20 puan değerinde
      const pointsEarned = isCorrect ? 20 : 0;
      
      return res.json({
        isCorrect,
        pointsEarned,
        feedback: isCorrect 
          ? 'Harika! Doğru çözümü buldunuz.' 
          : `Çözümünüz doğru değil. İpucu: ${question.hints[0]}`
      });
    }
    
    // Kayıtlı kullanıcı için normal işlem
    let attempt;
    try {
      attempt = await QuizAttempt.findById(attemptId);
    } catch (err) {
      console.error('Geçersiz Attempt ID formatı:', err);
      return res.status(400).json({
        error: 'Geçersiz Quiz Girişimi ID formatı'
      });
    }
    
    if (!attempt) {
      return res.status(404).json({
        error: 'Quiz girişimi bulunamadı'
      });
    }
    
    if (attempt.completed) {
      return res.status(400).json({
        error: 'Bu quiz girişimi zaten tamamlanmış'
      });
    }
    
    // İlgili quiz ve soruyu getir
    const quiz = await Quiz.findById(attempt.quizId);
    
    if (!quiz || !quiz.codeCompletionQuestions[questionIndex]) {
      return res.status(404).json({
        error: 'Quiz veya soru bulunamadı'
      });
    }
    
    // Soruyu al
    const question = quiz.codeCompletionQuestions[questionIndex];
    
    // Basit bir kod doğrulama: çözüm kullanıcı kodunda var mı?
    // Not: Gerçek bir uygulamada, daha gelişmiş bir doğrulama yapılmalıdır
    const solution = question.solution.trim();
    const normalizedUserCode = userCode.trim();
    const isCorrect = normalizedUserCode.includes(solution);
    
    // Kod tamamlama soruları 20 puan değerinde
    const pointsEarned = isCorrect ? 20 : 0;
    
    // Cevabı kaydet
    const answer = {
      questionIndex,
      userCode,
      isCorrect,
      pointsEarned,
      feedback: isCorrect 
        ? 'Harika! Doğru çözümü buldunuz.' 
        : `Çözümünüz doğru değil. İpucu: ${question.hints[0]}`
    };
    
    // Aynı soruya daha önce cevap verilmiş mi kontrol et
    const existingAnswerIndex = attempt.codeCompletionAnswers.findIndex(a => a.questionIndex === questionIndex);
    
    if (existingAnswerIndex >= 0) {
      // Var olan cevabı güncelle
      attempt.codeCompletionAnswers[existingAnswerIndex] = answer;
    } else {
      // Yeni cevap ekle
      attempt.codeCompletionAnswers.push(answer);
    }
    
    await attempt.save();
    
    res.json({
      isCorrect,
      pointsEarned,
      feedback: answer.feedback
    });
  } catch (error) {
    console.error('Kod tamamlama cevaplama hatası:', error);
    res.status(500).json({
      error: 'Cevap gönderirken bir hata oluştu'
    });
  }
});

// Quiz'i tamamla ve sonuçları hesapla
app.post('/api/quiz-attempts/:attemptId/finish', async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    // Geçici ID kontrolü (misafir kullanıcı için)
    if (attemptId.startsWith('temp_')) {
      // Misafir kullanıcı için doğrudan sonuçları hesapla
      const { quizId, multipleChoiceAnswers = [], codeCompletionAnswers = [] } = req.body;
      
      if (!quizId) {
        return res.status(400).json({
          error: 'Quiz ID gereklidir'
        });
      }
      
      // MongoDB ObjectId formatını kontrol et
      let quiz;
      try {
        quiz = await Quiz.findById(quizId);
      } catch (err) {
        console.error('Geçersiz Quiz ID formatı:', err);
        return res.status(400).json({
          error: 'Geçersiz Quiz ID formatı'
        });
      }
      
      if (!quiz) {
        return res.status(404).json({
          error: 'Quiz bulunamadı'
        });
      }
      
      // Toplam puanları hesapla
      let totalEarned = 0;
      
      // Çoktan seçmeli sorular için puanları topla
      multipleChoiceAnswers.forEach(answer => {
        totalEarned += answer.isCorrect ? 10 : 0;
      });
      
      // Kod tamamlama soruları için puanları topla
      codeCompletionAnswers.forEach(answer => {
        totalEarned += answer.isCorrect ? 20 : 0;
      });
      
      // Sonuçları döndür
      return res.json({
        score: totalEarned,
        totalPossible: quiz.totalPoints,
        passed: totalEarned >= quiz.passingScore
      });
    }
    
    // Kayıtlı kullanıcı için normal işlem
    let attempt;
    try {
      attempt = await QuizAttempt.findById(attemptId);
    } catch (err) {
      console.error('Geçersiz Attempt ID formatı:', err);
      return res.status(400).json({
        error: 'Geçersiz Quiz Girişimi ID formatı'
      });
    }
    
    if (!attempt) {
      return res.status(404).json({
        error: 'Quiz girişimi bulunamadı'
      });
    }
    
    if (attempt.completed) {
      return res.status(400).json({
        error: 'Bu quiz girişimi zaten tamamlanmış'
      });
    }
    
    // Sonuçları hesapla
    const results = await attempt.calculateResults();
    
    // Girişimi güncelle
    await attempt.save();
    
    res.json(results);
  } catch (error) {
    console.error('Quiz tamamlama hatası:', error);
    res.status(500).json({
      error: 'Quiz tamamlanırken bir hata oluştu'
    });
  }
});

// Kullanıcının quiz istatistiklerini getir
app.get('/api/users/:userId/quiz-stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının tamamlanmış quiz girişimlerini getir
    const attempts = await QuizAttempt.find({
      userId,
      completed: true
    }).populate({
      path: 'quizId',
      select: 'title totalPoints',
      populate: {
        path: 'algorithmId',
        select: 'title'
      }
    });
    
    // İstatistikleri hesapla
    const stats = {
      totalAttempts: attempts.length,
      passedQuizzes: attempts.filter(a => a.passed).length,
      averageScore: attempts.length > 0 
        ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score / curr.quizId.totalPoints) * 100, 0) / attempts.length)
        : 0,
      recentAttempts: attempts
        .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
        .slice(0, 5)
        .map(a => ({
          quizTitle: a.quizId.title,
          algorithmTitle: a.quizId.algorithmId.title,
          score: a.score,
          totalPoints: a.quizId.totalPoints,
          passed: a.passed,
          date: a.endTime
        }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Kullanıcı quiz istatistikleri hatası:', error);
    res.status(500).json({
      error: 'Kullanıcı quiz istatistiklerini getirirken bir hata oluştu'
    });
  }
});

// Kullanıcı İlerleme Sistemi Endpointleri
// Kullanıcı ilerleme bilgisini getir
app.get('/api/users/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının ilerleme bilgisini getir, yoksa oluştur
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
      await userProgress.save();
    }
    
    // İlerleme bilgisini döndür
    res.json(userProgress);
  } catch (error) {
    console.error('Kullanıcı ilerleme bilgisi hatası:', error);
    res.status(500).json({
      error: 'Kullanıcı ilerleme bilgisi alınırken bir hata oluştu'
    });
  }
});

// Algoritma görüntüleme kaydı
app.post('/api/users/:userId/algo-viewed/:algorithmId', async (req, res) => {
  try {
    const { userId, algorithmId } = req.params;
    
    // Kullanıcının ve algoritmanın var olup olmadığını kontrol et
    const [user, algorithm] = await Promise.all([
      User.findById(userId),
      Algorithm.findById(algorithmId)
    ]);
    
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    if (!algorithm) {
      return res.status(404).json({
        error: 'Algoritma bulunamadı'
      });
    }
    
    // Kullanıcının ilerleme bilgisini getir, yoksa oluştur
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
    }
    
    // Algoritma ilerlemesini güncelle
    const algorithmIdStr = algorithmId.toString();
    const isFirstView = !userProgress.algorithmProgress.has(algorithmIdStr);
    const existingProgress = userProgress.algorithmProgress.get(algorithmIdStr) || {
      algorithmId,
      viewCount: 0,
      lastViewed: new Date(),
      completed: false
    };
    
    // Görüntüleme sayısını artır
    existingProgress.viewCount = (existingProgress.viewCount || 0) + 1;
    existingProgress.lastViewed = new Date();
    
    userProgress.algorithmProgress.set(algorithmIdStr, existingProgress);
    
    // İlk kez görüntüleme ise LEARNER rozeti ve XP ver
    let achievements = [];
    let xpUpdate = { gained: 0, levelUp: false };
    
    if (isFirstView) {
      // İlk kez bir algoritma görüntülemeye XP ver
      xpUpdate = userProgress.addXP(10);
      
      // İlk algoritma görüntülemesi için rozet kontrolü yap
      const learnerBadge = await Badge.findOne({ type: 'LEARNER' });
      
      if (learnerBadge && !userProgress.achievements.some(a => a.type === 'LEARNER')) {
        const badgeAdded = userProgress.addAchievement({
          type: 'LEARNER',
          name: learnerBadge.name,
          description: learnerBadge.description,
          icon: learnerBadge.icon,
          relatedEntity: algorithmId,
          relatedEntityModel: 'Algorithm'
        });
        
        if (badgeAdded) {
          // Rozet XP'si ekle
          xpUpdate = userProgress.addXP(learnerBadge.xpReward);
          achievements.push({
            type: 'LEARNER',
            name: learnerBadge.name,
            icon: learnerBadge.icon,
            xpReward: learnerBadge.xpReward
          });
        }
      }
      
      // Streak güncelle (günlük çalışma serisi)
      userProgress.updateStreak();
      
      // STREAK_HERO rozeti kontrolü
      const streakBadge = await Badge.findOne({ 
        type: 'STREAK_HERO',
        'requirement.streakDays': { $lte: userProgress.streakDays }
      });
      
      if (streakBadge && !userProgress.achievements.some(a => a.type === 'STREAK_HERO')) {
        const badgeAdded = userProgress.addAchievement({
          type: 'STREAK_HERO',
          name: streakBadge.name,
          description: streakBadge.description,
          icon: streakBadge.icon
        });
        
        if (badgeAdded) {
          xpUpdate = userProgress.addXP(streakBadge.xpReward);
          achievements.push({
            type: 'STREAK_HERO',
            name: streakBadge.name,
            icon: streakBadge.icon,
            xpReward: streakBadge.xpReward
          });
        }
      }
    }
    
    await userProgress.save();
    
    // Güncellenmiş ilerleme bilgisini döndür
    res.json({
      progress: {
        viewCount: existingProgress.viewCount,
        lastViewed: existingProgress.lastViewed
      },
      xpUpdate,
      achievements
    });
  } catch (error) {
    console.error('Algoritma görüntüleme kaydı hatası:', error);
    res.status(500).json({
      error: 'Algoritma görüntüleme kaydı yapılırken bir hata oluştu'
    });
  }
});

// Algoritma tamamlama
app.post('/api/users/:userId/algo-completed/:algorithmId', async (req, res) => {
  try {
    const { userId, algorithmId } = req.params;
    
    // Kullanıcının ve algoritmanın var olup olmadığını kontrol et
    const [user, algorithm] = await Promise.all([
      User.findById(userId),
      Algorithm.findById(algorithmId)
    ]);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (!algorithm) {
      return res.status(404).json({ error: 'Algoritma bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir, yoksa oluştur
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
    }
    
    // Algoritma ilerlemesini güncelle
    const progress = userProgress.updateAlgorithmProgress(algorithmId, {
      completed: true,
      completedAt: new Date()
    });
    
    // Tamamlama için XP ver (ilk kez tamamlanıyorsa)
    let xpUpdate = { gained: 0, levelUp: false };
    let achievements = [];
    
    if (progress.completedAt) {
      // Algoritmayı tamamlamaya XP ver
      xpUpdate = userProgress.addXP(50);
      
      // Aynı kategorideki algoritmaların tamamlanma sayısı
      const completedInCategory = Array.from(userProgress.algorithmProgress.values())
        .filter(p => p.completed)
        .length;
      
      // ALGORITHM_MASTER rozeti kontrolü
      const masterBadge = await Badge.findOne({ 
        type: 'ALGORITHM_MASTER',
        'requirement.completedCount': { $lte: completedInCategory }
      });
      
      if (masterBadge && !userProgress.achievements.some(a => a.type === 'ALGORITHM_MASTER')) {
        const badgeAdded = userProgress.addAchievement({
          type: 'ALGORITHM_MASTER',
          name: masterBadge.name,
          description: masterBadge.description,
          icon: masterBadge.icon
        });
        
        if (badgeAdded) {
          xpUpdate = userProgress.addXP(masterBadge.xpReward);
          achievements.push({
            type: 'ALGORITHM_MASTER',
            name: masterBadge.name,
            icon: masterBadge.icon,
            xpReward: masterBadge.xpReward
          });
        }
      }
      
      // Farklı kategorideki algoritmaların sayısını kontrol et (EXPLORER rozeti için)
      const algorithms = await Algorithm.find(
        { _id: { $in: Array.from(userProgress.algorithmProgress.keys()).map(id => mongoose.Types.ObjectId(id)) } },
        'category'
      );
      
      const uniqueCategories = new Set(algorithms.map(a => a.category)).size;
      
      const explorerBadge = await Badge.findOne({ 
        type: 'EXPLORER',
        'requirement.uniqueCategories': { $lte: uniqueCategories }
      });
      
      if (explorerBadge && !userProgress.achievements.some(a => a.type === 'EXPLORER')) {
        const badgeAdded = userProgress.addAchievement({
          type: 'EXPLORER',
          name: explorerBadge.name,
          description: explorerBadge.description,
          icon: explorerBadge.icon
        });
        
        if (badgeAdded) {
          xpUpdate = userProgress.addXP(explorerBadge.xpReward);
          achievements.push({
            type: 'EXPLORER',
            name: explorerBadge.name,
            icon: explorerBadge.icon,
            xpReward: explorerBadge.xpReward
          });
        }
      }
    }
    
    await userProgress.save();
    
    // Güncellenmiş ilerleme bilgisini döndür
    res.json({
      progress: {
        completed: progress.completed,
        completedAt: progress.completedAt
      },
      xpUpdate,
      achievements
    });
  } catch (error) {
    console.error('Algoritma tamamlama hatası:', error);
    res.status(500).json({
      error: 'Algoritma tamamlama işlemi sırasında bir hata oluştu'
    });
  }
});

// Öğrenme yolları listesini getir
app.get('/api/learning-paths', async (req, res) => {
  try {
    const learningPaths = await LearningPath.find({ isPublished: true }, 
      'title description category difficulty coverImage totalSteps totalXP estimatedHours completionsCount');
    res.json(learningPaths);
  } catch (error) {
    console.error('Öğrenme yolları listesi hatası:', error);
    res.status(500).json({
      error: 'Öğrenme yolları listelenirken bir hata oluştu'
    });
  }
});

// Öğrenme yolu detaylarını getir
app.get('/api/learning-paths/:pathId', async (req, res) => {
  try {
    const { pathId } = req.params;
    const learningPath = await LearningPath.findById(pathId);
    
    if (!learningPath) {
      return res.status(404).json({ error: 'Öğrenme yolu bulunamadı' });
    }
    
    // Steps içindeki entityId referanslarını dolduralım
    const populatedSteps = await Promise.all(
      learningPath.steps.map(async (step) => {
        let entityDetails = null;
        
        if (step.type === 'ALGORITHM') {
          entityDetails = await Algorithm.findById(step.entityId, 'title description complexity');
        } else if (step.type === 'QUIZ') {
          entityDetails = await Quiz.findById(step.entityId, 'title description difficulty totalPoints');
        }
        
        return {
          ...step.toObject(),
          entityDetails
        };
      })
    );
    
    const result = learningPath.toObject();
    result.steps = populatedSteps;
    
    res.json(result);
  } catch (error) {
    console.error('Öğrenme yolu detayı hatası:', error);
    res.status(500).json({
      error: 'Öğrenme yolu detayları alınırken bir hata oluştu'
    });
  }
});

// Öğrenme yolunu başlat veya ilerleme güncelle
app.post('/api/users/:userId/learning-paths/:pathId/progress', async (req, res) => {
  try {
    const { userId, pathId } = req.params;
    const { currentStep, stepCompleted } = req.body;
    
    // Kullanıcının ve öğrenme yolunun var olup olmadığını kontrol et
    const [user, learningPath] = await Promise.all([
      User.findById(userId),
      LearningPath.findById(pathId)
    ]);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (!learningPath) {
      return res.status(404).json({ error: 'Öğrenme yolu bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir, yoksa oluştur
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
    }
    
    // Öğrenme yolu ilerlemesini hesapla
    const pathIdStr = pathId.toString();
    const isFirstStep = !userProgress.learningPathProgress.has(pathIdStr);
    const totalSteps = learningPath.steps.length;
    
    // Yeni ilerleme yüzdesini hesapla
    const pathProgress = {
      currentStep: currentStep || 0
    };
    
    if (stepCompleted) {
      pathProgress.currentStep += 1;
    }
    
    pathProgress.progress = Math.floor((pathProgress.currentStep / totalSteps) * 100);
    
    // İlerlemeyi güncelle
    const updatedProgress = userProgress.updateLearningPathProgress(pathId, pathProgress);
    
    // XP ve rozet güncellemeleri
    let xpUpdate = { gained: 0, levelUp: false };
    let achievements = [];
    
    if (stepCompleted) {
      // Adım tamamlandığında XP ver
      const completedStep = learningPath.steps[currentStep];
      xpUpdate = userProgress.addXP(completedStep.xpReward);
    }
    
    // İlk kez yol tamamlandıysa
    if (updatedProgress.progress >= 100 && updatedProgress.completedAt) {
      // Öğrenme yolunu tamamlama sayısını artır
      await LearningPath.findByIdAndUpdate(pathId, { $inc: { completionsCount: 1 } });
      
      // GRADUATE rozeti kontrolü yap
      const graduateBadge = await Badge.findOne({ type: 'GRADUATE' });
      
      if (graduateBadge && !userProgress.achievements.some(a => a.type === 'GRADUATE')) {
        const badgeAdded = userProgress.addAchievement({
          type: 'GRADUATE',
          name: graduateBadge.name,
          description: graduateBadge.description,
          icon: graduateBadge.icon,
          relatedEntity: pathId,
          relatedEntityModel: 'LearningPath'
        });
        
        if (badgeAdded) {
          xpUpdate = userProgress.addXP(graduateBadge.xpReward);
          achievements.push({
            type: 'GRADUATE',
            name: graduateBadge.name,
            icon: graduateBadge.icon,
            xpReward: graduateBadge.xpReward
          });
        }
      }
    }
    
    await userProgress.save();
    
    // Güncellenmiş ilerleme bilgisini döndür
    res.json({
      progress: updatedProgress,
      xpUpdate,
      achievements
    });
  } catch (error) {
    console.error('Öğrenme yolu ilerleme hatası:', error);
    res.status(500).json({
      error: 'Öğrenme yolu ilerleme güncelleme sırasında bir hata oluştu'
    });
  }
});

// Kullanıcının tüm rozetlerini getir
app.get('/api/users/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir
    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.json([]);
    }
    
    // Tüm rozetleri getir (kazanılmış ve kazanılmamış)
    const allBadges = await Badge.find({});
    
    // Kullanıcının kazandığı ve kazanmadığı rozetleri hazırla
    const achievements = allBadges.map(badge => {
      const earnedAchievement = userProgress.achievements.find(a => a.type === badge.type);
      
      return {
        type: badge.type,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        level: badge.level,
        xpReward: badge.xpReward,
        earned: !!earnedAchievement,
        earnedAt: earnedAchievement ? earnedAchievement.earnedAt : null
      };
    });
    
    res.json(achievements);
  } catch (error) {
    console.error('Kullanıcı rozetleri hatası:', error);
    res.status(500).json({
      error: 'Kullanıcı rozetleri alınırken bir hata oluştu'
    });
  }
});

// Kullanıcı ön paneli (dashboard) verilerini getir
app.get('/api/users/:userId/dashboard', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir
    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.json({
        level: 1,
        totalXP: 0,
        progress: {
          algorithms: { completed: 0, total: 0 },
          quizzes: { completed: 0, total: await Quiz.countDocuments() },
          learningPaths: { completed: 0, inProgress: 0, total: await LearningPath.countDocuments() }
        },
        recentActivity: [],
        streak: { current: 0, highest: 0 }
      });
    }
    
    // Quiz istatistiklerini getir
    const quizStats = await QuizAttempt.find(
      { userId, completed: true },
      'quizId score passed endTime'
    ).sort({ endTime: -1 }).limit(5).populate('quizId', 'title');
    
    // Toplam algoritma sayısını getir
    const totalAlgorithms = await Algorithm.countDocuments();
    
    // Öğrenme yollarını getir
    const learningPaths = await LearningPath.find({}, 'title');
    const pathProgress = Array.from(userProgress.learningPathProgress.values());
    
    // Kullanıcı ön panel verilerini hazırla
    const dashboard = {
      level: userProgress.level,
      totalXP: userProgress.totalXP,
      nextLevelXP: Math.ceil(100 * Math.pow(userProgress.level + 1, 1.5)),
      progress: {
        algorithms: { 
          completed: userProgress.completedAlgorithmsCount, 
          total: totalAlgorithms 
        },
        quizzes: { 
          completed: userProgress.completedQuizzesCount, 
          total: await Quiz.countDocuments() 
        },
        learningPaths: { 
          completed: userProgress.completedLearningPathsCount,
          inProgress: pathProgress.filter(p => p.progress > 0 && p.progress < 100).length,
          total: learningPaths.length
        }
      },
      recentActivity: [
        // Son görüntülenen algoritmalar
        ...Array.from(userProgress.algorithmProgress.entries())
          .map(([id, progress]) => ({
            type: 'algorithm_viewed',
            entityId: id,
            date: progress.lastViewed,
            viewCount: progress.viewCount
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3),
        
        // Son quiz denemeleri
        ...quizStats.map(q => ({
          type: 'quiz_completed',
          entityId: q.quizId._id,
          title: q.quizId.title,
          date: q.endTime,
          score: q.score,
          passed: q.passed
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
      streak: {
        current: userProgress.streakDays,
        highestAchievement: userProgress.achievements.find(a => a.type === 'STREAK_HERO')?.name
      },
      recentAchievements: userProgress.achievements
        .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
        .slice(0, 3)
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Kullanıcı dashboard hatası:', error);
    res.status(500).json({
      error: 'Kullanıcı dashboard verileri alınırken bir hata oluştu'
    });
  }
});

// Algoritma favoriye ekleme/çıkarma
app.post('/api/users/:userId/favorites/:algorithmId', async (req, res) => {
  try {
    const { userId, algorithmId } = req.params;
    const { isFavorite } = req.body;
    
    // Kullanıcının ve algoritmanın var olup olmadığını kontrol et
    const [user, algorithm] = await Promise.all([
      User.findById(userId),
      Algorithm.findById(algorithmId)
    ]);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (!algorithm) {
      return res.status(404).json({ error: 'Algoritma bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir, yoksa oluştur
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
    }
    
    // Algoritma ilerlemesini güncelle
    const algorithmIdStr = algorithmId.toString();
    const progress = userProgress.algorithmProgress.get(algorithmIdStr) || {
      algorithmId,
      viewCount: 0,
      lastViewed: new Date(),
      completed: false
    };
    
    progress.isFavorite = !!isFavorite;
    userProgress.algorithmProgress.set(algorithmIdStr, progress);
    
    await userProgress.save();
    
    res.json({ isFavorite: progress.isFavorite });
  } catch (error) {
    console.error('Favori işlemi hatası:', error);
    res.status(500).json({
      error: 'Favori işlemi sırasında bir hata oluştu'
    });
  }
});

// Kullanıcının favori algoritmalarını getir
app.get('/api/users/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir
    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress || userProgress.algorithmProgress.size === 0) {
      return res.json([]);
    }
    
    // Favori algoritma ID'lerini bul
    const favoriteIds = Array.from(userProgress.algorithmProgress.entries())
      .filter(([_, progress]) => progress.isFavorite)
      .map(([id, _]) => mongoose.Types.ObjectId(id));
    
    if (favoriteIds.length === 0) {
      return res.json([]);
    }
    
    // Favori algoritmaları getir
    const favorites = await Algorithm.find(
      { _id: { $in: favoriteIds } },
      'title description complexity'
    );
    
    res.json(favorites);
  } catch (error) {
    console.error('Favori algoritmaları getirme hatası:', error);
    res.status(500).json({
      error: 'Favori algoritmaları getirirken bir hata oluştu'
    });
  }
});

// Algoritma notları ekleme/güncelleme
app.post('/api/users/:userId/notes/:algorithmId', async (req, res) => {
  try {
    const { userId, algorithmId } = req.params;
    const { notes } = req.body;
    
    // Kullanıcının ve algoritmanın var olup olmadığını kontrol et
    const [user, algorithm] = await Promise.all([
      User.findById(userId),
      Algorithm.findById(algorithmId)
    ]);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (!algorithm) {
      return res.status(404).json({ error: 'Algoritma bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir, yoksa oluştur
    let userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
    }
    
    // Algoritma ilerlemesini güncelle
    const algorithmIdStr = algorithmId.toString();
    const progress = userProgress.algorithmProgress.get(algorithmIdStr) || {
      algorithmId,
      viewCount: 0,
      lastViewed: new Date(),
      completed: false
    };
    
    progress.notes = notes;
    userProgress.algorithmProgress.set(algorithmIdStr, progress);
    
    await userProgress.save();
    
    res.json({ notes: progress.notes });
  } catch (error) {
    console.error('Not güncelleme hatası:', error);
    res.status(500).json({
      error: 'Not güncelleme sırasında bir hata oluştu'
    });
  }
});

// İlgili bir algoritma için kullanıcı notunu getir
app.get('/api/users/:userId/notes/:algorithmId', async (req, res) => {
  try {
    const { userId, algorithmId } = req.params;
    
    // Kullanıcının ve algoritmanın var olup olmadığını kontrol et
    const [user, algorithm] = await Promise.all([
      User.findById(userId),
      Algorithm.findById(algorithmId)
    ]);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (!algorithm) {
      return res.status(404).json({ error: 'Algoritma bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir
    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress) {
      return res.json({ notes: '' });
    }
    
    // Algoritma notunu getir
    const algorithmIdStr = algorithmId.toString();
    const progress = userProgress.algorithmProgress.get(algorithmIdStr);
    
    res.json({ notes: progress?.notes || '' });
  } catch (error) {
    console.error('Not getirme hatası:', error);
    res.status(500).json({
      error: 'Not getirirken bir hata oluştu'
    });
  }
});

// Kullanıcının tüm notlarını getir
app.get('/api/users/:userId/notes', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Kullanıcının ilerleme bilgisini getir
    const userProgress = await UserProgress.findOne({ userId });
    
    if (!userProgress || userProgress.algorithmProgress.size === 0) {
      return res.json([]);
    }
    
    // Not içeren algoritma ID'lerini bul
    const notesEntries = Array.from(userProgress.algorithmProgress.entries())
      .filter(([_, progress]) => progress.notes && progress.notes.trim() !== '')
      .map(([id, progress]) => ({ 
        algorithmId: id, 
        notes: progress.notes,
        lastViewed: progress.lastViewed
      }));
    
    if (notesEntries.length === 0) {
      return res.json([]);
    }
    
    // İlgili algoritmaları getir
    const algorithmIds = notesEntries.map(entry => mongoose.Types.ObjectId(entry.algorithmId));
    const algorithms = await Algorithm.find(
      { _id: { $in: algorithmIds } },
      'title'
    );
    
    // Algoritma başlıklarını notlarla birleştir
    const userNotes = notesEntries.map(entry => {
      const algorithm = algorithms.find(a => a._id.toString() === entry.algorithmId);
      return {
        algorithmId: entry.algorithmId,
        title: algorithm ? algorithm.title : 'Bilinmeyen Algoritma',
        notes: entry.notes,
        lastViewed: entry.lastViewed
      };
    }).sort((a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime());
    
    res.json(userNotes);
  } catch (error) {
    console.error('Tüm notları getirme hatası:', error);
    res.status(500).json({
      error: 'Tüm notları getirirken bir hata oluştu'
    });
  }
});

// Server'ı başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});