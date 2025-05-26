import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Algorithm descriptions type
interface AlgorithmDescription {
  name: string;
  description: string;
  complexity: {
    time: string;
    space: string;
  };
  steps: string[];
  pros?: string[];
  cons?: string[];
}

// Default algorithm info for when type isn't found
interface DefaultAlgorithmInfo {
  name: string;
  description: string;
  complexity: {
    time: string;
    space: string;
  };
  steps: string[];
  pros: string[];
  cons: string[];
}

// Algoritma açıklamaları - kullanıcı için bilgi ve yardım
export const algorithmDescriptions: Record<string, AlgorithmDescription> = {
  'q-learning': {
    name: 'Q-Learning Algoritması',
    description: 'Q-Learning, ortamla etkileşimlerinden öğrenen bir model-free pekiştirmeli öğrenme algoritmasıdır. Belirli bir durumda belirli bir eylemi gerçekleştirmenin beklenen faydasını tahmin eden bir Q-tablo oluşturur.',
    complexity: {
      time: 'O(durumlar × eylemler)',
      space: 'O(durumlar × eylemler)',
    },
    steps: [
      'Her durum-eylem çifti için Q-değerlerini 0 veya rastgele değerlerle başlat',
      'Bir durum gözlemle',
      'Epsilon-greedy stratejisi kullanarak bir eylem seç (keşfetme-sömürme dengesi)',
      'Eylemi gerçekleştir ve ödül/ceza al',
      'Yeni duruma geç',
      'Q-değerini Bellman denklemi ile güncelle: Q(s,a) ← Q(s,a) + α × (r + γ × max Q(s\',a\') - Q(s,a))',
      'Yeni durum hedef durumsa veya terminal ise, yeni bir episode başlat',
    ],
    pros: [
      'Model-free: Ortamın dinamiklerini bilmeye gerek yok',
      'Off-policy: Mevcut politika dışında eylemlerle de öğrenebilir',
      'Çevrimiçi öğrenme yapabilir ve kademeli olarak iyileştirebilir',
      'Küçük durum uzayları için uygulaması basit ve etkili',
      'Deterministik optimal politika garantisi',
    ],
    cons: [
      'Büyük durum-eylem uzaylarında ölçeklenebilirlik sorunları',
      'Sürekli durum uzaylarında doğrudan kullanılamaz (işlev yaklaşımları gerekir)',
      'Yavaş yakınsama gerektiren aç gözlü keşif-sömürü dengesi',
      'Markov Karar Süreci varsayımlarına dayanır',
      'Büyük ortamlarda yüksek bellek gereksinimi',
    ],
  },
  'pca': {
    name: 'Temel Bileşen Analizi (Principal Component Analysis)',
    description: 'PCA, yüksek boyutlu verileri daha düşük boyutlu bir uzaya yansıtarak boyut indirgemesi yapan bir algoritma ve istatistiksel yöntemdir. Veri setindeki maksimum varyansı yakalayan ortogonal bileşenleri (temel bileşenler) bulur.',
    complexity: {
      time: 'O(min(n²p, np²))',
      space: 'O(np)',
    },
    steps: [
      'Veriyi standardize et (her özelliğin ortalaması 0, varyansı 1 olacak şekilde)',
      'Kovaryans matrisini hesapla',
      'Kovaryans matrisinin özdeğer ve özvektörlerini hesapla',
      'Özvektörleri özdeğerlerine göre sırala (büyükten küçüğe)',
      'En büyük k özdeğere karşılık gelen özvektörleri seç',
      'Bu özvektörlerden bir projeksiyon matrisi oluştur',
      'Orijinal veriyi bu matris ile çarparak boyut indirgeme işlemini gerçekleştir',
    ],
    pros: [
      'Veri boyutunu azaltarak hesaplama karmaşıklığını düşürür',
      'Görselleştirme için yüksek boyutlu verileri 2D veya 3D\'ye indirger',
      'Gürültüyü azaltarak veri kalitesini artırabilir',
      'Çok değişkenli verilerdeki korelasyonları analiz etmeye yardımcı olur',
      'Özellik çıkarımı için kullanılabilir',
      'Sıkıştırma uygulamalarında kullanılabilir',
    ],
    cons: [
      'Doğrusal olmayan ilişkileri yakalayamaz',
      'Varyans her zaman en önemli özellik olmayabilir',
      'Özvektör hesaplaması büyük veri setlerinde hesaplama açısından pahalı olabilir',
      'Veri standardizasyonu gerektirir',
      'Özelliklerin yorumlanabilirliği azalabilir',
      'Varyans azaltmak her zaman bilgi kaybına neden olur',
    ],
  },
  'hierarchical': {
    name: 'Hiyerarşik Kümeleme (Hierarchical Clustering)',
    description: 'Hiyerarşik kümeleme, veri noktalarını benzerliklerine göre hiyerarşik bir yapıda gruplayan bir kümeleme algoritmasıdır. Aglomeratif (birleştirici, aşağıdan yukarıya) ve bölücü (yukarıdan aşağıya) olmak üzere iki temel yaklaşım vardır. En yaygın olarak kullanılan aglomeratif yaklaşım, başlangıçta her veri noktasını ayrı bir küme olarak ele alır ve ardından en yakın kümeleri kademeli olarak birleştirir.',
    complexity: {
      time: 'O(n³) aglomeratif yaklaşım için',
      space: 'O(n²)',
    },
    steps: [
      'Her veri noktasını kendi kümesi olarak başlat',
      'Tüm kümeler arasındaki mesafeleri hesapla',
      'En yakın iki kümeyi bul ve birleştir',
      'Mesafe matrisini güncelle (yeni küme ve diğer tüm kümeler arasındaki mesafeleri yeniden hesapla)',
      'İstenen küme sayısına veya bir eşik değerine ulaşılana kadar 2-4 adımlarını tekrarla',
      'Dendrogram ile sonuçları görselleştir',
    ],
    pros: [
      'Küme sayısının önceden belirlenmesi gerekmez (dendrogram üzerinden seçilebilir)',
      'Kümelerin hiyerarşik ilişkisini gösterir',
      'Farklı veri türlerine uygulanabilir',
      'Veri dağılımı hakkında varsayım gerektirmez',
      'Dendrogramlar yorumlanması kolay görselleştirme sağlar',
    ],
    cons: [
      'Büyük veri setleri için hesaplama maliyeti yüksektir (O(n³))',
      'Gürültüye ve aykırı değerlere duyarlıdır',
      'Birleştirilmiş kümeler daha sonra ayrılamaz (aglomeratif yaklaşımda)',
      'Küme sayısı için net bir kural yoktur',
      'Farklı bağlantı kriterleri farklı sonuçlar verebilir (tekli bağlantı, tam bağlantı, ortalama bağlantı, Ward yöntemi vb.)',
    ],
  },
  'association-rules': {
    name: 'Birliktelik Kuralları Öğrenimi (Association Rule Learning)',
    description: 'Birliktelik Kuralları Öğrenimi, büyük veri kümelerinde öğeler arasındaki ilginç ilişkileri keşfetmek için kullanılan bir veri madenciliği tekniğidir. Müşteri sepeti analizi, ürün öneri sistemleri ve satış stratejileri geliştirme gibi alanlarda yaygın olarak kullanılır. En yaygın algoritmaları Apriori, FP-Growth ve Eclat\'tır.',
    complexity: {
      time: 'O(2^d) (en kötü durumda, d = farklı öğe sayısı)',
      space: 'O(2^d)',
    },
    steps: [
      'Minimum destek (support) ve güven (confidence) eşik değerlerini belirle',
      'Sık geçen tekli öğe kümelerini (L1) bul',
      'Tekrarlı olarak, k-1 uzunluktaki sık öğe kümelerinden k uzunluktaki aday öğe kümelerini oluştur',
      'Aday kümelerin destek değerlerini hesapla',
      'Minimum destek değerinden yüksek olan aday kümeleri seçerek sık öğe kümelerini (Lk) belirle',
      'Tüm sık öğe kümelerinden birliktelik kurallarını oluştur',
      'Minimum güven değerini sağlayan kuralları seç'
    ],
    pros: [
      'Kolay anlaşılır ve yorumlanabilir kurallar üretir',
      'Büyük veri kümelerinde gizli ilişkileri keşfedebilir',
      'Müşteri davranışlarını anlama ve ürün tavsiye sistemleri için etkilidir',
      'Sezgisel olarak anlamlı sonuçlar sağlar',
      'Çeşitli optimizasyonlarla ölçeklenebilir hale getirilebilir'
    ],
    cons: [
      'Büyük veri kümelerinde hesaplama maliyeti yüksektir (özellikle düşük destek değerleri için)',
      'Çok sayıda kural üretebilir, bu da analizde zorluk yaratabilir',
      'Nadir görülen ancak önemli ilişkileri kaçırabilir',
      'Negatif ilişkileri doğrudan yakalayamaz',
      'Veri kalitesine duyarlıdır, gürültülü veride yanıltıcı sonuçlar verebilir'
    ],
  },
  'autoencoder': {
    name: 'Otokodlayıcı (Autoencoder)',
    description: 'Otokodlayıcılar, giriş verisini önce daha düşük boyutlu bir temsile sıkıştıran (kodlama) ve ardından bu temsilden giriş verisini yeniden oluşturmaya (kod çözme) çalışan bir tür yapay sinir ağıdır. Temel amaçları, veri sıkıştırma, boyut indirgeme, gürültü giderme ve özellik çıkarımıdır.',
    complexity: {
      time: 'O(n × m × e) eğitim için (n = örnek sayısı, m = model parametreleri, e = epoch sayısı)',
      space: 'O(m) model için (m = model parametreleri)',
    },
    steps: [
      'Giriş verisini alarak başla',
      'Kodlayıcı (encoder) ile veriyi daha düşük boyutlu gizli temsile dönüştür',
      'Kod çözücü (decoder) ile gizli temsili kullanarak giriş verisini yeniden oluşturmaya çalış',
      'Yeniden oluşturma hatası (rekonstrüksiyon hatası) hesapla',
      'Geriye yayılım algoritması ile ağ parametrelerini güncelle',
      'Belirli bir sayıda epoch veya hedef hataya ulaşılana kadar tekrarla',
      'Eğitim tamamlandığında, kodlayıcı boyut indirgeme için, tüm ağ ise gürültü giderme için kullanılabilir'
    ],
    pros: [
      'Etiketlenmemiş verilerle denetlenmemiş öğrenme yapabilir',
      'Veri sıkıştırma ve boyut indirgeme için etkilidir',
      'Gürültü giderme ve eksik veri tamamlama için kullanılabilir',
      'Üretken modellerin temelini oluşturur (VAE gibi)',
      'Karmaşık veri yapılarında anlamlı özellikler öğrenebilir',
      'Doğrusal olmayan dönüşümleri yakalayabilir'
    ],
    cons: [
      'Karmaşık veri setleri için derin mimariler gerekebilir',
      'Hiperparametre ayarı hassas olabilir',
      'Eğitim işlemi hesaplamalı olarak maliyetli olabilir',
      'Çok düşük boyutlu gizli temsiller önemli bilgi kaybına neden olabilir',
      'Yeterince derin veya geniş olmayan mimariler veriyi iyi öğrenemeyebilir',
      'Aşırı uyum (overfitting) riski vardır'
    ],
  },
  'linear-search': {
    name: 'Doğrusal Arama (Linear Search)',
    description: 'Doğrusal arama, bir veri yapısı içinde belirli bir değeri bulmak için her elemanı sırayla kontrol eden basit bir arama algoritmasıdır. Dizinin başından başlayarak, hedef değer bulunana kadar veya tüm dizi taranana kadar her bir eleman kontrol edilir.',
    complexity: {
      time: 'En iyi: O(1), Ortalama: O(n/2), En kötü: O(n)',
      space: 'O(1)',
    },
    steps: [
      'Dizinin ilk elemanından başla',
      'Mevcut eleman hedef değerle eşleşiyorsa, arama başarılı oldu ve elemanın indeksini döndür',
      'Eşleşmiyorsa, bir sonraki elemana geç',
      'Dizinin sonuna kadar tüm elemanlar için 2. ve 3. adımları tekrarla',
      'Tüm elemanlar kontrol edilip eşleşme bulunamadıysa, arama başarısız oldu'
    ],
    pros: [
      'Basit ve anlaşılması kolay bir algoritma',
      'Küçük diziler için etkili',
      'Ek bellek gerektirmez',
      'Dizinin sıralanmış olmasını gerektirmez',
      'Her türlü veri yapısında çalışabilir',
      'Sık kullanılan veya başta bulunan öğeler için verimli olabilir'
    ],
    cons: [
      'Büyük veri kümeleri için verimsiz',
      'Ortalama ve en kötü durumda tüm elemanları taramak gerekebilir',
      'Binary Search gibi daha hızlı algoritmalarla karşılaştırıldığında yavaş kalır',
      'Sıralanmış veriler için optimal değil',
      'Veri büyüklüğü arttıkça arama süresi doğrusal olarak artar'
    ],
  },
  'linear search': {
    name: 'Doğrusal Arama (Linear Search)',
    description: 'Doğrusal arama, bir veri yapısı içinde belirli bir değeri bulmak için her elemanı sırayla kontrol eden basit bir arama algoritmasıdır. Dizinin başından başlayarak, hedef değer bulunana kadar veya tüm dizi taranana kadar her bir eleman kontrol edilir.',
    complexity: {
      time: 'En iyi: O(1), Ortalama: O(n/2), En kötü: O(n)',
      space: 'O(1)',
    },
    steps: [
      'Dizinin ilk elemanından başla',
      'Mevcut eleman hedef değerle eşleşiyorsa, arama başarılı oldu ve elemanın indeksini döndür',
      'Eşleşmiyorsa, bir sonraki elemana geç',
      'Dizinin sonuna kadar tüm elemanlar için 2. ve 3. adımları tekrarla',
      'Tüm elemanlar kontrol edilip eşleşme bulunamadıysa, arama başarısız oldu'
    ],
    pros: [
      'Basit ve anlaşılması kolay bir algoritma',
      'Küçük diziler için etkili',
      'Ek bellek gerektirmez',
      'Dizinin sıralanmış olmasını gerektirmez',
      'Her türlü veri yapısında çalışabilir',
      'Sık kullanılan veya başta bulunan öğeler için verimli olabilir'
    ],
    cons: [
      'Büyük veri kümeleri için verimsiz',
      'Ortalama ve en kötü durumda tüm elemanları taramak gerekebilir',
      'Binary Search gibi daha hızlı algoritmalarla karşılaştırıldığında yavaş kalır',
      'Sıralanmış veriler için optimal değil',
      'Veri büyüklüğü arttıkça arama süresi doğrusal olarak artar'
    ],
  },
  'doğrusal arama': {
    name: 'Doğrusal Arama (Linear Search)',
    description: 'Doğrusal arama, bir veri yapısı içinde belirli bir değeri bulmak için her elemanı sırayla kontrol eden basit bir arama algoritmasıdır. Dizinin başından başlayarak, hedef değer bulunana kadar veya tüm dizi taranana kadar her bir eleman kontrol edilir.',
    complexity: {
      time: 'En iyi: O(1), Ortalama: O(n/2), En kötü: O(n)',
      space: 'O(1)',
    },
    steps: [
      'Dizinin ilk elemanından başla',
      'Mevcut eleman hedef değerle eşleşiyorsa, arama başarılı oldu ve elemanın indeksini döndür',
      'Eşleşmiyorsa, bir sonraki elemana geç',
      'Dizinin sonuna kadar tüm elemanlar için 2. ve 3. adımları tekrarla',
      'Tüm elemanlar kontrol edilip eşleşme bulunamadıysa, arama başarısız oldu'
    ],
    pros: [
      'Basit ve anlaşılması kolay bir algoritma',
      'Küçük diziler için etkili',
      'Ek bellek gerektirmez',
      'Dizinin sıralanmış olmasını gerektirmez',
      'Her türlü veri yapısında çalışabilir',
      'Sık kullanılan veya başta bulunan öğeler için verimli olabilir'
    ],
    cons: [
      'Büyük veri kümeleri için verimsiz',
      'Ortalama ve en kötü durumda tüm elemanları taramak gerekebilir',
      'Binary Search gibi daha hızlı algoritmalarla karşılaştırıldığında yavaş kalır',
      'Sıralanmış veriler için optimal değil',
      'Veri büyüklüğü arttıkça arama süresi doğrusal olarak artar'
    ],
  },
  'binary-search': {
    name: 'İkili Arama (Binary Search)',
    description: 'İkili arama, sıralanmış bir dizide belirli bir değeri bulmak için kullanılan verimli bir arama algoritmasıdır. Her adımda, arama aralığını ikiye bölerek hedef değerin dizinin hangi yarısında olduğunu belirler ve arama alanını sürekli olarak daraltır.',
    complexity: {
      time: 'En iyi: O(1), Ortalama: O(log n), En kötü: O(log n)',
      space: 'O(1)',
    },
    steps: [
      'Sıralanmış dizinin ortasındaki elemana bak',
      'Eğer hedef değer bu elemana eşitse, arama tamamlandı',
      'Eğer hedef değer ortadaki elemandan küçükse, dizinin sol yarısında aramaya devam et',
      'Eğer hedef değer ortadaki elemandan büyükse, dizinin sağ yarısında aramaya devam et',
      'Arama aralığı boş olana kadar yukarıdaki adımları tekrarla',
      'Arama aralığı boşsa, hedef değer dizide yoktur'
    ],
    pros: [
      'Doğrusal aramadan çok daha hızlıdır, özellikle büyük dizilerde',
      'Zaman karmaşıklığı logaritmiktir, büyük veri kümeleri için idealdir',
      'Az bellek kullanır',
      'Tekrarlamalı (recursive) veya yinelemeli (iterative) olarak uygulanabilir',
      'Öngörülebilir performans sunar'
    ],
    cons: [
      'Yalnızca sıralanmış dizilerde çalışır',
      'Sıralama ek maliyet gerektirir',
      'Bağlantılı listeler gibi ardışıl erişim veri yapıları için uygun değildir',
      'Sık güncellenen dizilerde verimsiz olabilir (her güncellemeden sonra sıralamak gerekir)',
      'Doğrusal aramadan daha karmaşık bir algoritma yapısına sahiptir'
    ],
  },
  'binary search': {
    name: 'İkili Arama (Binary Search)',
    description: 'İkili arama, sıralanmış bir dizide belirli bir değeri bulmak için kullanılan verimli bir arama algoritmasıdır. Her adımda, arama aralığını ikiye bölerek hedef değerin dizinin hangi yarısında olduğunu belirler ve arama alanını sürekli olarak daraltır.',
    complexity: {
      time: 'En iyi: O(1), Ortalama: O(log n), En kötü: O(log n)',
      space: 'O(1)',
    },
    steps: [
      'Sıralanmış dizinin ortasındaki elemana bak',
      'Eğer hedef değer bu elemana eşitse, arama tamamlandı',
      'Eğer hedef değer ortadaki elemandan küçükse, dizinin sol yarısında aramaya devam et',
      'Eğer hedef değer ortadaki elemandan büyükse, dizinin sağ yarısında aramaya devam et',
      'Arama aralığı boş olana kadar yukarıdaki adımları tekrarla',
      'Arama aralığı boşsa, hedef değer dizide yoktur'
    ],
    pros: [
      'Doğrusal aramadan çok daha hızlıdır, özellikle büyük dizilerde',
      'Zaman karmaşıklığı logaritmiktir, büyük veri kümeleri için idealdir',
      'Az bellek kullanır',
      'Tekrarlamalı (recursive) veya yinelemeli (iterative) olarak uygulanabilir',
      'Öngörülebilir performans sunar'
    ],
    cons: [
      'Yalnızca sıralanmış dizilerde çalışır',
      'Sıralama ek maliyet gerektirir',
      'Bağlantılı listeler gibi ardışıl erişim veri yapıları için uygun değildir',
      'Sık güncellenen dizilerde verimsiz olabilir (her güncellemeden sonra sıralamak gerekir)',
      'Doğrusal aramadan daha karmaşık bir algoritma yapısına sahiptir'
    ],
  },
  'ikili arama': {
    name: 'İkili Arama (Binary Search)',
    description: 'İkili arama, sıralanmış bir dizide belirli bir değeri bulmak için kullanılan verimli bir arama algoritmasıdır. Her adımda, arama aralığını ikiye bölerek hedef değerin dizinin hangi yarısında olduğunu belirler ve arama alanını sürekli olarak daraltır.',
    complexity: {
      time: 'En iyi: O(1), Ortalama: O(log n), En kötü: O(log n)',
      space: 'O(1)',
    },
    steps: [
      'Sıralanmış dizinin ortasındaki elemana bak',
      'Eğer hedef değer bu elemana eşitse, arama tamamlandı',
      'Eğer hedef değer ortadaki elemandan küçükse, dizinin sol yarısında aramaya devam et',
      'Eğer hedef değer ortadaki elemandan büyükse, dizinin sağ yarısında aramaya devam et',
      'Arama aralığı boş olana kadar yukarıdaki adımları tekrarla',
      'Arama aralığı boşsa, hedef değer dizide yoktur'
    ],
    pros: [
      'Doğrusal aramadan çok daha hızlıdır, özellikle büyük dizilerde',
      'Zaman karmaşıklığı logaritmiktir, büyük veri kümeleri için idealdir',
      'Az bellek kullanır',
      'Tekrarlamalı (recursive) veya yinelemeli (iterative) olarak uygulanabilir',
      'Öngörülebilir performans sunar'
    ],
    cons: [
      'Yalnızca sıralanmış dizilerde çalışır',
      'Sıralama ek maliyet gerektirir',
      'Bağlantılı listeler gibi ardışıl erişim veri yapıları için uygun değildir',
      'Sık güncellenen dizilerde verimsiz olabilir (her güncellemeden sonra sıralamak gerekir)',
      'Doğrusal aramadan daha karmaşık bir algoritma yapısına sahiptir'
    ],
  },
  'merge-sort': {
    name: 'Birleştirmeli Sıralama (Merge Sort)',
    description: 'Merge Sort, böl ve yönet stratejisine dayanan etkili bir karşılaştırma temelli sıralama algoritmasıdır. Diziyi tekrar tekrar iki parçaya böler, her bir parçayı sıralar ve ardından bu parçaları birleştirir.',
    complexity: {
      time: 'En iyi: O(n log n), Ortalama: O(n log n), En kötü: O(n log n)',
      space: 'O(n)'
    },
    steps: [
      'Diziyi ortadan ikiye böl',
      'Sol yarıyı özyinelemeli olarak sırala',
      'Sağ yarıyı özyinelemeli olarak sırala',
      'İki sıralı yarıyı birleştir',
      'Birleştirme işlemi sırasında, her iki yarıdan elemanları karşılaştır ve daha küçük olanı yeni diziye yerleştir',
      'Bir yarı tükendiğinde, diğer yarının kalan tüm elemanlarını yeni diziye ekle'
    ],
    pros: [
      'Kararlı bir sıralama algoritmasıdır (eşit değerli elemanların göreceli sırası korunur)',
      'Garantili O(n log n) zaman karmaşıklığı',
      'Büyük listeler için verimli',
      'Bağlı listeler için uygun',
      'Paralel programlama için uygun'
    ],
    cons: [
      'Yerinde (in-place) bir algoritma değildir, ek bellek gerektirir',
      'Küçük dizilerde Quick Sort gibi diğer algoritmalara göre daha yavaş olabilir',
      'O(n) ek bellek gerektirir',
      'Basit uygulamalarda yazması ve anlaması karmaşık olabilir',
      'Diziler için ekstra bellek gerektirdiğinden performansı etkileyebilir'
    ]
  },
  'merge sort': {
    name: 'Birleştirmeli Sıralama (Merge Sort)',
    description: 'Merge Sort, böl ve yönet stratejisine dayanan etkili bir karşılaştırma temelli sıralama algoritmasıdır. Diziyi tekrar tekrar iki parçaya böler, her bir parçayı sıralar ve ardından bu parçaları birleştirir.',
    complexity: {
      time: 'En iyi: O(n log n), Ortalama: O(n log n), En kötü: O(n log n)',
      space: 'O(n)'
    },
    steps: [
      'Diziyi ortadan ikiye böl',
      'Sol yarıyı özyinelemeli olarak sırala',
      'Sağ yarıyı özyinelemeli olarak sırala',
      'İki sıralı yarıyı birleştir',
      'Birleştirme işlemi sırasında, her iki yarıdan elemanları karşılaştır ve daha küçük olanı yeni diziye yerleştir',
      'Bir yarı tükendiğinde, diğer yarının kalan tüm elemanlarını yeni diziye ekle'
    ],
    pros: [
      'Kararlı bir sıralama algoritmasıdır (eşit değerli elemanların göreceli sırası korunur)',
      'Garantili O(n log n) zaman karmaşıklığı',
      'Büyük listeler için verimli',
      'Bağlı listeler için uygun',
      'Paralel programlama için uygun'
    ],
    cons: [
      'Yerinde (in-place) bir algoritma değildir, ek bellek gerektirir',
      'Küçük dizilerde Quick Sort gibi diğer algoritmalara göre daha yavaş olabilir',
      'O(n) ek bellek gerektirir',
      'Basit uygulamalarda yazması ve anlaması karmaşık olabilir',
      'Diziler için ekstra bellek gerektirdiğinden performansı etkileyebilir'
    ]
  },
  'birleştirme sıralaması': {
    name: 'Birleştirmeli Sıralama (Merge Sort)',
    description: 'Merge Sort, böl ve yönet stratejisine dayanan etkili bir karşılaştırma temelli sıralama algoritmasıdır. Diziyi tekrar tekrar iki parçaya böler, her bir parçayı sıralar ve ardından bu parçaları birleştirir.',
    complexity: {
      time: 'En iyi: O(n log n), Ortalama: O(n log n), En kötü: O(n log n)',
      space: 'O(n)'
    },
    steps: [
      'Diziyi ortadan ikiye böl',
      'Sol yarıyı özyinelemeli olarak sırala',
      'Sağ yarıyı özyinelemeli olarak sırala',
      'İki sıralı yarıyı birleştir',
      'Birleştirme işlemi sırasında, her iki yarıdan elemanları karşılaştır ve daha küçük olanı yeni diziye yerleştir',
      'Bir yarı tükendiğinde, diğer yarının kalan tüm elemanlarını yeni diziye ekle'
    ],
    pros: [
      'Kararlı bir sıralama algoritmasıdır (eşit değerli elemanların göreceli sırası korunur)',
      'Garantili O(n log n) zaman karmaşıklığı',
      'Büyük listeler için verimli',
      'Bağlı listeler için uygun',
      'Paralel programlama için uygun'
    ],
    cons: [
      'Yerinde (in-place) bir algoritma değildir, ek bellek gerektirir',
      'Küçük dizilerde Quick Sort gibi diğer algoritmalara göre daha yavaş olabilir',
      'O(n) ek bellek gerektirir',
      'Basit uygulamalarda yazması ve anlaması karmaşık olabilir',
      'Diziler için ekstra bellek gerektirdiğinden performansı etkileyebilir'
    ]
  },
  'quick-sort': {
    name: 'Hızlı Sıralama (Quick Sort)',
    description: 'Quick Sort, böl ve yönet stratejisine dayanan etkili bir karşılaştırma temelli sıralama algoritmasıdır. Pivot adı verilen bir eleman seçerek, dizideki diğer elemanları pivottan küçük olanlar ve büyük olanlar olarak iki alt diziye ayırır.',
    complexity: {
      time: 'En iyi: O(n log n), Ortalama: O(n log n), En kötü: O(n²)',
      space: 'En iyi: O(log n), En kötü: O(n)'
    },
    steps: [
      'Diziden bir pivot eleman seç (genellikle ilk, son veya ortadaki eleman)',
      'Diziyi yeniden düzenle: Pivottan küçük elemanları sola, büyük elemanları sağa yerleştir',
      'Pivotun solundaki alt diziyi özyinelemeli olarak sırala',
      'Pivotun sağındaki alt diziyi özyinelemeli olarak sırala',
      'Sıralama işlemi, alt dizilerin boyutu 1 veya 0 olana kadar devam eder',
      'Sonuçta, tüm dizi sıralanmış olur'
    ],
    pros: [
      'Genellikle pratik uygulamalarda çok hızlıdır',
      'Ortalama durumda O(n log n) zaman karmaşıklığı',
      'Yerinde (in-place) sıralama yapabilir, çok az ek bellek gerektirir',
      'Bellek hiyerarşisini iyi kullanır, bu da cache performansını artırır',
      'Sıralama karşılaştırması fazla olan büyük dizilerde etkilidir'
    ],
    cons: [
      'En kötü durumda O(n²) zaman karmaşıklığı (zaten sıralı veya tersine sıralı dizilerde)',
      'Kararlı bir sıralama algoritması değildir (eşit değerli elemanların sırası değişebilir)',
      'Pivot seçimi algoritmanın performansını önemli ölçüde etkiler',
      'Bağlı listeler üzerinde verimsizdir',
      'Özyinelemeli uygulama, büyük dizilerde yığın taşmasına neden olabilir'
    ]
  },
  'quick sort': {
    name: 'Hızlı Sıralama (Quick Sort)',
    description: 'Quick Sort, böl ve yönet stratejisine dayanan etkili bir karşılaştırma temelli sıralama algoritmasıdır. Pivot adı verilen bir eleman seçerek, dizideki diğer elemanları pivottan küçük olanlar ve büyük olanlar olarak iki alt diziye ayırır.',
    complexity: {
      time: 'En iyi: O(n log n), Ortalama: O(n log n), En kötü: O(n²)',
      space: 'En iyi: O(log n), En kötü: O(n)'
    },
    steps: [
      'Diziden bir pivot eleman seç (genellikle ilk, son veya ortadaki eleman)',
      'Diziyi yeniden düzenle: Pivottan küçük elemanları sola, büyük elemanları sağa yerleştir',
      'Pivotun solundaki alt diziyi özyinelemeli olarak sırala',
      'Pivotun sağındaki alt diziyi özyinelemeli olarak sırala',
      'Sıralama işlemi, alt dizilerin boyutu 1 veya 0 olana kadar devam eder',
      'Sonuçta, tüm dizi sıralanmış olur'
    ],
    pros: [
      'Genellikle pratik uygulamalarda çok hızlıdır',
      'Ortalama durumda O(n log n) zaman karmaşıklığı',
      'Yerinde (in-place) sıralama yapabilir, çok az ek bellek gerektirir',
      'Bellek hiyerarşisini iyi kullanır, bu da cache performansını artırır',
      'Sıralama karşılaştırması fazla olan büyük dizilerde etkilidir'
    ],
    cons: [
      'En kötü durumda O(n²) zaman karmaşıklığı (zaten sıralı veya tersine sıralı dizilerde)',
      'Kararlı bir sıralama algoritması değildir (eşit değerli elemanların sırası değişebilir)',
      'Pivot seçimi algoritmanın performansını önemli ölçüde etkiler',
      'Bağlı listeler üzerinde verimsizdir',
      'Özyinelemeli uygulama, büyük dizilerde yığın taşmasına neden olabilir'
    ]
  },
  'hızlı sıralama': {
    name: 'Hızlı Sıralama (Quick Sort)',
    description: 'Quick Sort, böl ve yönet stratejisine dayanan etkili bir karşılaştırma temelli sıralama algoritmasıdır. Pivot adı verilen bir eleman seçerek, dizideki diğer elemanları pivottan küçük olanlar ve büyük olanlar olarak iki alt diziye ayırır.',
    complexity: {
      time: 'En iyi: O(n log n), Ortalama: O(n log n), En kötü: O(n²)',
      space: 'En iyi: O(log n), En kötü: O(n)'
    },
    steps: [
      'Diziden bir pivot eleman seç (genellikle ilk, son veya ortadaki eleman)',
      'Diziyi yeniden düzenle: Pivottan küçük elemanları sola, büyük elemanları sağa yerleştir',
      'Pivotun solundaki alt diziyi özyinelemeli olarak sırala',
      'Pivotun sağındaki alt diziyi özyinelemeli olarak sırala',
      'Sıralama işlemi, alt dizilerin boyutu 1 veya 0 olana kadar devam eder',
      'Sonuçta, tüm dizi sıralanmış olur'
    ],
    pros: [
      'Genellikle pratik uygulamalarda çok hızlıdır',
      'Ortalama durumda O(n log n) zaman karmaşıklığı',
      'Yerinde (in-place) sıralama yapabilir, çok az ek bellek gerektirir',
      'Bellek hiyerarşisini iyi kullanır, bu da cache performansını artırır',
      'Sıralama karşılaştırması fazla olan büyük dizilerde etkilidir'
    ],
    cons: [
      'En kötü durumda O(n²) zaman karmaşıklığı (zaten sıralı veya tersine sıralı dizilerde)',
      'Kararlı bir sıralama algoritması değildir (eşit değerli elemanların sırası değişebilir)',
      'Pivot seçimi algoritmanın performansını önemli ölçüde etkiler',
      'Bağlı listeler üzerinde verimsizdir',
      'Özyinelemeli uygulama, büyük dizilerde yığın taşmasına neden olabilir'
    ]
  },
  'insertion-sort': {
    name: 'Eklemeli Sıralama (Insertion Sort)',
    description: 'Insertion Sort, basit bir karşılaştırma temelli sıralama algoritmasıdır. Dizi üzerinde bir kez ilerlenir ve her eleman, kendisinden önce gelen sıralı alt dizideki doğru konuma yerleştirilir.',
    complexity: {
      time: 'En iyi: O(n), Ortalama: O(n²), En kötü: O(n²)',
      space: 'O(1)'
    },
    steps: [
      'Dizinin ilk elemanını sıralanmış olarak kabul et',
      'Dizinin geri kalanında (ikinci elemandan itibaren) ilerle',
      'Mevcut elemanı sıralanmış kısımdaki doğru konuma yerleştir',
      'Bunun için, mevcut elemanı kendisinden önceki elemanlarla karşılaştır',
      'Kendisinden büyük olan elemanları bir pozisyon sağa kaydır',
      'Doğru pozisyonu bulduğunda, mevcut elemanı oraya yerleştir',
      'Tüm dizi işlenene kadar bu adımları tekrarla'
    ],
    pros: [
      'Basit ve anlaşılması kolay bir algoritma',
      'Küçük veri setleri için verimli',
      'Yerinde (in-place) çalışır, çok az ek bellek kullanır',
      'Kararlı bir sıralama algoritmasıdır (eşit değerli elemanların sırası korunur)',
      'Çevrimiçi bir algoritma olduğundan, veri geldikçe sıralama yapabilir',
      'Neredeyse sıralı dizilerde çok etkilidir (en iyi durumda O(n))'
    ],
    cons: [
      'Büyük veri setlerinde verimsizdir (ortalama ve en kötü durumda O(n²))',
      'Her adımda muhtemelen birçok veri kaydırması gerektirir',
      'Yüksek hesaplama karmaşıklığı nedeniyle büyük dizilerde Selection Sort veya Bubble Sort kadar yavaş olabilir',
      'Sıralanmış diziye eleman eklemesi hariç, Merge Sort ve Quick Sort gibi algoritmalara göre daha yavaştır'
    ]
  },
  'insertion sort': {
    name: 'Eklemeli Sıralama (Insertion Sort)',
    description: 'Insertion Sort, basit bir karşılaştırma temelli sıralama algoritmasıdır. Dizi üzerinde bir kez ilerlenir ve her eleman, kendisinden önce gelen sıralı alt dizideki doğru konuma yerleştirilir.',
    complexity: {
      time: 'En iyi: O(n), Ortalama: O(n²), En kötü: O(n²)',
      space: 'O(1)'
    },
    steps: [
      'Dizinin ilk elemanını sıralanmış olarak kabul et',
      'Dizinin geri kalanında (ikinci elemandan itibaren) ilerle',
      'Mevcut elemanı sıralanmış kısımdaki doğru konuma yerleştir',
      'Bunun için, mevcut elemanı kendisinden önceki elemanlarla karşılaştır',
      'Kendisinden büyük olan elemanları bir pozisyon sağa kaydır',
      'Doğru pozisyonu bulduğunda, mevcut elemanı oraya yerleştir',
      'Tüm dizi işlenene kadar bu adımları tekrarla'
    ],
    pros: [
      'Basit ve anlaşılması kolay bir algoritma',
      'Küçük veri setleri için verimli',
      'Yerinde (in-place) çalışır, çok az ek bellek kullanır',
      'Kararlı bir sıralama algoritmasıdır (eşit değerli elemanların sırası korunur)',
      'Çevrimiçi bir algoritma olduğundan, veri geldikçe sıralama yapabilir',
      'Neredeyse sıralı dizilerde çok etkilidir (en iyi durumda O(n))'
    ],
    cons: [
      'Büyük veri setlerinde verimsizdir (ortalama ve en kötü durumda O(n²))',
      'Her adımda muhtemelen birçok veri kaydırması gerektirir',
      'Yüksek hesaplama karmaşıklığı nedeniyle büyük dizilerde Selection Sort veya Bubble Sort kadar yavaş olabilir',
      'Sıralanmış diziye eleman eklemesi hariç, Merge Sort ve Quick Sort gibi algoritmalara göre daha yavaştır'
    ]
  },
  'ekleme sıralaması': {
    name: 'Eklemeli Sıralama (Insertion Sort)',
    description: 'Insertion Sort, basit bir karşılaştırma temelli sıralama algoritmasıdır. Dizi üzerinde bir kez ilerlenir ve her eleman, kendisinden önce gelen sıralı alt dizideki doğru konuma yerleştirilir.',
    complexity: {
      time: 'En iyi: O(n), Ortalama: O(n²), En kötü: O(n²)',
      space: 'O(1)'
    },
    steps: [
      'Dizinin ilk elemanını sıralanmış olarak kabul et',
      'Dizinin geri kalanında (ikinci elemandan itibaren) ilerle',
      'Mevcut elemanı sıralanmış kısımdaki doğru konuma yerleştir',
      'Bunun için, mevcut elemanı kendisinden önceki elemanlarla karşılaştır',
      'Kendisinden büyük olan elemanları bir pozisyon sağa kaydır',
      'Doğru pozisyonu bulduğunda, mevcut elemanı oraya yerleştir',
      'Tüm dizi işlenene kadar bu adımları tekrarla'
    ],
    pros: [
      'Basit ve anlaşılması kolay bir algoritma',
      'Küçük veri setleri için verimli',
      'Yerinde (in-place) çalışır, çok az ek bellek kullanır',
      'Kararlı bir sıralama algoritmasıdır (eşit değerli elemanların sırası korunur)',
      'Çevrimiçi bir algoritma olduğundan, veri geldikçe sıralama yapabilir',
      'Neredeyse sıralı dizilerde çok etkilidir (en iyi durumda O(n))'
    ],
    cons: [
      'Büyük veri setlerinde verimsizdir (ortalama ve en kötü durumda O(n²))',
      'Her adımda muhtemelen birçok veri kaydırması gerektirir',
      'Yüksek hesaplama karmaşıklığı nedeniyle büyük dizilerde Selection Sort veya Bubble Sort kadar yavaş olabilir',
      'Sıralanmış diziye eleman eklemesi hariç, Merge Sort ve Quick Sort gibi algoritmalara göre daha yavaştır'
    ]
  },
  'actor-critic': {
    name: 'Actor-Critic Algoritması',
    description: 'Actor-Critic, hem politika (Actor) hem de değer fonksiyonu (Critic) öğrenmesini birleştiren hibrit bir pekiştirmeli öğrenme algoritmasıdır.',
    complexity: {
      time: 'Değişken',
      space: 'O(|S| + |A|)',
    },
    steps: [
      'Actor ağı, mevcut durumda hangi eylemi yapacağına karar verir (politika)',
      'Eylemi gerçekleştir ve ödül/ceza al',
      'Critic ağı mevcut durumun değerini tahmin eder (değer fonksiyonu)',
      'Temporal-Difference (TD) hatası hesaplanır',
      'Actor ağı, TD hatası yönünde güncellenir',
      'Critic ağı, gerçek değere yaklaşacak şekilde güncellenir',
    ],
    pros: [
      'REINFORCE\'a göre daha düşük varyans',
      'Q-Learning\'e göre sürekli eylem uzaylarında daha etkili',
      'Hem değer hem de politika öğreniminin avantajlarını birleştirir',
      'Online öğrenme yapabilir (her adımda güncellenir)',
    ],
    cons: [
      'İki ağ eğitimi gerektirdiği için hesaplama maliyeti yüksek olabilir',
      'Hiperparametrelere duyarlı (Actor ve Critic öğrenme oranları ayrı ayarlanmalı)',
      'Q-Learning\'e göre daha kararsız olabilir',
    ],
  },
  'ppo': {
    name: 'PPO (Proximal Policy Optimization)',
    description: 'PPO, pekiştirmeli öğrenmede güvenli politika optimizasyonu sağlayan modern bir algoritmadır. Trust region policy optimization (TRPO) yaklaşımını basitleştirerek, surrogate objective function üzerinde clipping uygulaması yaparak aşırı büyük policy güncellemelerini önler.',
    complexity: {
      time: 'Değişken (ortama bağlı)',
      space: 'O(batch_size + network_parameters)',
    },
    steps: [
      'Policy ve value function için neural networkler oluştur',
      'Çevreyle etkileşime girerek trajectory/rollout topla',
      'Advantage tahminlerini hesapla (GAE - Generalized Advantage Estimation kullanılabilir)',
      'Policy network için clipped surrogate objective ile optimizasyon yap',
      'Value function loss hesapla ve minimize et',
      'Belirli sayıda epoch için bu adımları tekrarla',
      'Policy değişimini sınırlamak için clipping ile aşırı güncellemeleri engelle'
    ],
    pros: [
      'TRPO\'ya göre daha basit implementasyon',
      'Kararlı ve güvenli politika güncellemeleri',
      'Sample efficiency yüksek',
      'Multiple epoch training ile veri kullanımı verimli',
      'Continuous ve discrete action space\'lerde çalışabilir',
      'State-of-the-art performans'
    ],
    cons: [
      'Hiperparametrelere hassas (özellikle clipping parameter)',
      'Büyük batch\'ler gerektirebilir',
      'On-policy doğası gereği off-policy yöntemlerden daha az sample efficient',
      'Exploration-exploitation dengesini sağlamak için ek stratejiler gerekebilir',
      'Kompleks ortamlarda çok fazla veri gerektirebilir'
    ],
  },
  'reinforce': {
    name: 'REINFORCE (Monte Carlo Policy Gradient)',
    description: 'REINFORCE, episodic pekiştirmeli öğrenme için basit ama güçlü bir policy gradient algoritmasıdır. Stochastic policy üzerinde gradient ascent kullanarak beklenen geri dönüşü maksimize eder. Her episode sonunda toplam geri dönüşleri kullanarak policy parametrelerini günceller.',
    complexity: {
      time: 'Değişken (ortama bağlı)',
      space: 'O(trajectory_length + policy_parameters)',
    },
    steps: [
      'Policy parametreleri (θ) ile başla',
      'Mevcut policy π(a|s,θ) ile bir tam episode çalıştır',
      'Her zaman adımında alınan eylemleri ve ödülleri kaydet (trajectory)',
      'Episode bittikten sonra, her zaman adımındaki geri dönüşleri (returns) hesapla: G_t',
      'Policy gradientini hesapla: ∇θ J(θ) = Σt [G_t ∇θ log π(a_t|s_t,θ)]',
      'Parametreleri güncelle: θ ← θ + α∇θ J(θ)',
      'Variance azaltmak için baseline (örn. state-value function) kullanılabilir'
    ],
    pros: [
      'Basit ve anlaşılması kolay policy gradient algoritması',
      'Doğrudan policy optimizasyonu yapar, value function gerektirmez',
      'Sürekli eylem uzaylarında doğal olarak çalışır',
      'Policy yapısı üzerinde az kısıtlama (herhangi bir differentiable function olabilir)',
      'Convergence garantisi vardır (doğru parametre güncellemeleriyle)',
      'Stochastic policy öğrenir (exploration-exploitation dengesi için faydalı)'
    ],
    cons: [
      'Yüksek variance sorununa sahiptir (baseline kullanımı bunu azaltabilir)',
      'Örnek verimliliği düşüktür (yalnızca episode sonunda öğrenir)',
      'On-policy algoritma olduğundan offline öğrenme yapamaz',
      'Büyük problemlerde yavaş yakınsama gösterebilir',
      'Hiperparametrelere (özellikle öğrenme oranına) duyarlıdır',
      'Actor-Critic veya PPO gibi modern yaklaşımlar genellikle daha iyi performans gösterir'
    ]
  },
  'sac': {
    name: 'SAC (Soft Actor-Critic)',
    description: 'SAC, ortamla etkileşiminden sürekli öğrenen ve maximum entropy reinforcement learning framework kullanan bir off-policy algoritmasıdır. Entropy maksimizasyonu ile exploration ve exploitation arasında dengeyi iyileştirir.',
    complexity: {
      time: 'O(action_space) her adımda',
      space: 'O(parameters) model parametreleri için',
    },
    steps: [
      'Twin Q-Networks parametreleri (θ1, θ2) ve Policy parametreleri (φ) ile başla',
      'Ortamla etkileşime geçerek veri topla',
      'Belirsizliği yansıtan stochastic policy\'den action sample et',
      'Twin Q-Networks ile off-policy değerlendirme yap (minimum Q değerini kullan)',
      'Soft value function\'ı hesapla: V(s) = E[Q(s,a) - α*log(π(a|s))]',
      'Temperature parameter (α) ile entropy regularization uygula',
      'Kritik (Q-Networks) ve Aktör (Policy) güncellemelerini yap',
      'Maximum entropy objective ile policy güncelle: J(π) = E[Q(s,a) - α*log(π(a|s))]',
    ],
  },
  'bubble sort': {
    name: 'Kabarcık Sıralama (Bubble Sort)',
    description: 'Kabarcık sıralama, her adımda yanyana duran elemanları karşılaştırıp, sıralamaya aykırı olanları yer değiştiren basit bir sıralama algoritmasıdır.',
    complexity: {
      time: 'O(n²)', 
      space: 'O(1)'
    },
    steps: [
      'Dizinin başından başlayarak her bir elemanı bir sonraki eleman ile karşılaştır',
      'Eğer eleman sıralamaya aykırı ise yer değiştir',
      'Dizinin sonuna geldiğinde, başa dön ve aynı süreci tekrarla',
      'Her bir geçişte en büyük eleman dizinin sonuna yerleşir',
      'Hiçbir değişiklik yapılmayan bir geçiş gerçekleşene kadar devam et'
    ]
  },
  'selection sort': {
    name: 'Seçim Sıralama (Selection Sort)',
    description: 'Seçim sıralama, her adımda sırasız kısımda en küçük elemanı bulup sıralı kısımın sonuna yerleştiren basit bir sıralama algoritmasıdır.',
    complexity: {
      time: 'O(n²)', 
      space: 'O(1)'
    },
    steps: [
      'Dizinin ilk elemanını başlangıç minimum değeri olarak kabul et',
      'Kalan tüm elemanları tarayarak gerçek minimum değeri bul',
      'Minimum değeri dizinin başındaki eleman ile yer değiştir',
      'Sıralanan kısmı bir eleman genişlet ve bir sonraki pozisyon için tekrarla',
      'Sırasız kısım bitene kadar bu adımları tekrarla'
    ]
  },
  'red-black tree': {
    name: 'Kırmızı-Siyah Ağaç (Red-Black Tree)',
    description: 'Kırmızı-Siyah Ağaç, kendi kendini dengeleyen ikili arama ağacı türüdür. Her düğüm kırmızı veya siyah olarak işaretlenir ve belirli özellikleri koruyarak ağacın dengeli kalmasını sağlar. Bu ağaç yapısı, ekleme, silme ve arama işlemlerini O(log n) zaman karmaşıklığında gerçekleştirir ve dengeli kalması için rotasyonlar ve renk değişimleri kullanır.',
    complexity: {
      time: 'O(log n)',
      space: 'O(n)'
    },
    steps: [
      'Her düğüm ya kırmızı ya da siyahtır.',
      'Kök düğüm her zaman siyahtır.',
      'Bütün yaprak (null) düğümler siyahtır.',
      'Kırmızı bir düğümün çocukları siyah olmalıdır (kırmızı düğümler art arda gelemez).',
      'Herhangi bir düğümden, o düğümün alt ağacındaki yaprak düğümlere kadar olan yollardaki siyah düğüm sayısı aynıdır (siyah yükseklik).'
    ],
    pros: [
      'Garanti edilmiş O(log n) zaman karmaşıklığı ile tüm işlemlerde yüksek performans',
      'Dengeli bir veri yapısı olarak arama işlemlerinde hızlı',
      'Ekleme ve silme işlemlerinden sonra otomatik dengelenir',
      'AVL ağaçlarına göre daha az rotasyon gerektirir',
      'B-ağaçları ve 2-3-4 ağaçlarıyla ilişkilidir ve benzer özelliklere sahiptir'
    ],
    cons: [
      'Ekleme ve silme işlemleri karmaşık algoritma gerektirir',
      'AVL ağaçlarına göre daha fazla alan kullanabilir (renk bilgisi için)',
      'Dengeli ağaç yapısı nedeniyle her zaman en uygun düzen olmayabilir',
      'İmplementasyon karmaşıklığı yüksektir',
      'Renk değişimleri ve rotasyonlar anlaması zor olabilir'
    ]
  },
  'avl tree': {
    name: 'AVL Ağacı (Adelson-Velsky-Landis Tree)',
    description: 'AVL ağacı, ilk kendi kendini dengeleyen ikili arama ağacıdır. 1962 yılında Adelson-Velsky ve Landis tarafından geliştirilmiştir. Her düğümde, sol ve sağ alt ağaçlarının yükseklikleri arasındaki fark (balance factor) en fazla 1\'dir. Bu sayede ağaç her zaman dengeli kalır ve tüm işlemlerde O(log n) zaman karmaşıklığı garantilenir. Dengesizlik durumunda otomatik rotasyonlar yapılarak denge korunur.',
    complexity: {
      time: 'O(log n)',
      space: 'O(n)'
    },
    steps: [
      'Her düğüm için balance factor hesaplanır: BF = Sol Alt Ağaç Yüksekliği - Sağ Alt Ağaç Yüksekliği',
      'Balance factor değeri -1, 0 veya 1 olmalıdır.',
      'BF > 1 ise sol ağır durum - sağ rotasyon gereklidir.',
      'BF < -1 ise sağ ağır durum - sol rotasyon gereklidir.',
      'Ekleme/silme sonrası balance factor kontrol edilir.',
      'Gerekirse rotasyonlar (LL, LR, RL, RR) yapılarak denge sağlanır.',
      'Rotasyon sonrası yükseklikler ve balance factor\'lar güncellenir.'
    ],
    pros: [
      'Garanti edilmiş O(log n) zaman karmaşıklığı ile her durumda optimal performans',
      'Sıkı dengeli yapı - yükseklik farkı en fazla 1 olduğundan en dengeli ağaç yapılarından biridir',
      'Arama işlemleri için Red-Black ağaçlardan daha iyi performans',
      'Balance factor ile kolay dengesizlik tespiti',
      'Yükseklik bilgisi sayesinde ağaç hakkında daha fazla bilgi sunar'
    ],
    cons: [
      'Ekleme ve silme işlemleri karmaşık rotasyonlar gerektirir',
      'Red-Black ağaçlara göre daha sık rotasyon gerçekleşir (denge kriteri daha katıdır)',
      'Her düğümde yükseklik bilgisi saklanmalıdır (ek bellek kullanımı)',
      'Bellek kullanımı biraz daha fazladır',
      'Implementasyon karmaşıklığı yüksektir'
    ]
  },
  'kırmızı-siyah ağaç': {
    name: 'Kırmızı-Siyah Ağaç (Red-Black Tree)',
    description: 'Kırmızı-Siyah Ağaç, kendi kendini dengeleyen ikili arama ağacı türüdür. Her düğüm kırmızı veya siyah olarak işaretlenir ve belirli özellikleri koruyarak ağacın dengeli kalmasını sağlar. Bu ağaç yapısı, ekleme, silme ve arama işlemlerini O(log n) zaman karmaşıklığında gerçekleştirir ve dengeli kalması için rotasyonlar ve renk değişimleri kullanır.',
    complexity: {
      time: 'O(log n)',
      space: 'O(n)'
    },
    steps: [
      'Her düğüm ya kırmızı ya da siyahtır.',
      'Kök düğüm her zaman siyahtır.',
      'Bütün yaprak (null) düğümler siyahtır.',
      'Kırmızı bir düğümün çocukları siyah olmalıdır (kırmızı düğümler art arda gelemez).',
      'Herhangi bir düğümden, o düğümün alt ağacındaki yaprak düğümlere kadar olan yollardaki siyah düğüm sayısı aynıdır (siyah yükseklik).'
    ],
    pros: [
      'Garanti edilmiş O(log n) zaman karmaşıklığı ile tüm işlemlerde yüksek performans',
      'Dengeli bir veri yapısı olarak arama işlemlerinde hızlı',
      'Ekleme ve silme işlemlerinden sonra otomatik dengelenir',
      'AVL ağaçlarına göre daha az rotasyon gerektirir',
      'B-ağaçları ve 2-3-4 ağaçlarıyla ilişkilidir ve benzer özelliklere sahiptir'
    ],
    cons: [
      'Ekleme ve silme işlemleri karmaşık algoritma gerektirir',
      'AVL ağaçlarına göre daha fazla alan kullanabilir (renk bilgisi için)',
      'Dengeli ağaç yapısı nedeniyle her zaman en uygun düzen olmayabilir',
      'İmplementasyon karmaşıklığı yüksektir',
      'Renk değişimleri ve rotasyonlar anlaması zor olabilir'
    ]
  },
  'avl ağacı': {
    name: 'AVL Ağacı (Adelson-Velsky-Landis Tree)',
    description: 'AVL ağacı, ilk kendi kendini dengeleyen ikili arama ağacıdır. 1962 yılında Adelson-Velsky ve Landis tarafından geliştirilmiştir. Her düğümde, sol ve sağ alt ağaçlarının yükseklikleri arasındaki fark (balance factor) en fazla 1\'dir. Bu sayede ağaç her zaman dengeli kalır ve tüm işlemlerde O(log n) zaman karmaşıklığı garantilenir. Dengesizlik durumunda otomatik rotasyonlar yapılarak denge korunur.',
    complexity: {
      time: 'O(log n)',
      space: 'O(n)'
    },
    steps: [
      'Her düğüm için balance factor hesaplanır: BF = Sol Alt Ağaç Yüksekliği - Sağ Alt Ağaç Yüksekliği',
      'Balance factor değeri -1, 0 veya 1 olmalıdır.',
      'BF > 1 ise sol ağır durum - sağ rotasyon gereklidir.',
      'BF < -1 ise sağ ağır durum - sol rotasyon gereklidir.',
      'Ekleme/silme sonrası balance factor kontrol edilir.',
      'Gerekirse rotasyonlar (LL, LR, RL, RR) yapılarak denge sağlanır.',
      'Rotasyon sonrası yükseklikler ve balance factor\'lar güncellenir.'
    ],
    pros: [
      'Garanti edilmiş O(log n) zaman karmaşıklığı ile her durumda optimal performans',
      'Sıkı dengeli yapı - yükseklik farkı en fazla 1 olduğundan en dengeli ağaç yapılarından biridir',
      'Arama işlemleri için Red-Black ağaçlardan daha iyi performans',
      'Balance factor ile kolay dengesizlik tespiti',
      'Yükseklik bilgisi sayesinde ağaç hakkında daha fazla bilgi sunar'
    ],
    cons: [
      'Ekleme ve silme işlemleri karmaşık rotasyonlar gerektirir',
      'Red-Black ağaçlara göre daha sık rotasyon gerçekleşir (denge kriteri daha katıdır)',
      'Her düğümde yükseklik bilgisi saklanmalıdır (ek bellek kullanımı)',
      'Bellek kullanımı biraz daha fazladır',
      'Implementasyon karmaşıklığı yüksektir'
    ]
  },
  'decision tree': {
    name: 'Karar Ağacı Algoritması',
    description: 'Karar ağaçları, veriyi özyinelemeli olarak bölümlere ayırarak sınıflandırma veya regresyon yapmak için kullanılan bir denetimli öğrenme algoritmasıdır. Kök düğümden başlayarak, her bir düğümde veri, belirlenen bir özelliğe göre dallanır ve yaprak düğümlerde sınıf etiketleri veya tahmin değerleri bulunur. Karar ağaçları, veriden öğrenilen kuralları görselleştirmesi ve yorumlanabilir olması açısından güçlüdür.',
    complexity: {
      time: 'O(n * log(n))', 
      space: 'O(n)'
    },
    steps: [
      'Veri kümesi için en iyi ayrım sağlayan özelliği ve eşik değerini bul (Gini indeksi veya Entropy kullanarak)',
      'Veriyi bu özellik ve eşik değerine göre ikiye ayır (sol alt ağaç ve sağ alt ağaç)',
      'Her alt küme için özyinelemeli olarak aynı işlemi tekrarla',
      'Durma koşullarına ulaşıldığında (maksimum derinlik, minimum örnek sayısı veya homojen sınıf dağılımı) yaprak düğümler oluştur',
      'Yaprak düğümlerde çoğunluk sınıfını (sınıflandırma) veya ortalama değeri (regresyon) tahmin olarak kullan'
    ],
    pros: [
      'Yorumlanabilirliği yüksek, insanlar için anlaşılması kolay ve sonuçlar açıklanabilir',
      'Veri ön işleme gerektirmez (normalleştirme/standartlaştırma gerekli değildir)',
      'Hem kategorik hem de sayısal verileri işleyebilir',
      'Özellik önemini belirleyebilir ve ilgisiz özellikleri otomatik olarak filtreler',
      'Doğrusal olmayan ilişkileri yakalayabilir',
      'Eksik değerlerle başa çıkabilir'
    ],
    cons: [
      'Aşırı öğrenmeye (overfitting) yatkındır, özellikle derinlik sınırlaması yoksa',
      'Kararsızdır - veri kümesindeki küçük değişiklikler ağaç yapısını tamamen değiştirebilir',
      'Optimum ağacı bulmak NP-complete problem olduğundan greedy yaklaşım kullanılır',
      'Karmaşık karar sınırlarını modellemekte zorluk yaşar',
      'Dengesiz veri setlerinde doğruluk sorunları olabilir',
      'Genellikle ensemble yöntemlerle birlikte kullanılması gerekir (Random Forest, Gradient Boosting gibi)'
    ],
  },
  'karar ağacı': {
    name: 'Karar Ağacı Algoritması',
    description: 'Karar ağaçları, veriyi özyinelemeli olarak bölümlere ayırarak sınıflandırma veya regresyon yapmak için kullanılan bir denetimli öğrenme algoritmasıdır. Kök düğümden başlayarak, her bir düğümde veri, belirlenen bir özelliğe göre dallanır ve yaprak düğümlerde sınıf etiketleri veya tahmin değerleri bulunur. Karar ağaçları, veriden öğrenilen kuralları görselleştirmesi ve yorumlanabilir olması açısından güçlüdür.',
    complexity: {
      time: 'O(n * log(n))', 
      space: 'O(n)'
    },
    steps: [
      'Veri kümesi için en iyi ayrım sağlayan özelliği ve eşik değerini bul (Gini indeksi veya Entropy kullanarak)',
      'Veriyi bu özellik ve eşik değerine göre ikiye ayır (sol alt ağaç ve sağ alt ağaç)',
      'Her alt küme için özyinelemeli olarak aynı işlemi tekrarla',
      'Durma koşullarına ulaşıldığında (maksimum derinlik, minimum örnek sayısı veya homojen sınıf dağılımı) yaprak düğümler oluştur',
      'Yaprak düğümlerde çoğunluk sınıfını (sınıflandırma) veya ortalama değeri (regresyon) tahmin olarak kullan'
    ],
    pros: [
      'Yorumlanabilirliği yüksek, insanlar için anlaşılması kolay ve sonuçlar açıklanabilir',
      'Veri ön işleme gerektirmez (normalleştirme/standartlaştırma gerekli değildir)',
      'Hem kategorik hem de sayısal verileri işleyebilir',
      'Özellik önemini belirleyebilir ve ilgisiz özellikleri otomatik olarak filtreler',
      'Doğrusal olmayan ilişkileri yakalayabilir',
      'Eksik değerlerle başa çıkabilir'
    ],
    cons: [
      'Aşırı öğrenmeye (overfitting) yatkındır, özellikle derinlik sınırlaması yoksa',
      'Kararsızdır - veri kümesindeki küçük değişiklikler ağaç yapısını tamamen değiştirebilir',
      'Optimum ağacı bulmak NP-complete problem olduğundan greedy yaklaşım kullanılır',
      'Karmaşık karar sınırlarını modellemekte zorluk yaşar',
      'Dengesiz veri setlerinde doğruluk sorunları olabilir',
      'Genellikle ensemble yöntemlerle birlikte kullanılması gerekir (Random Forest, Gradient Boosting gibi)'
    ],
  },
  'dqn': {
    name: 'Deep Q-Network (DQN)',
    description: 'DQN, Q-learning ve derin öğrenmenin birleştirildiği, pekiştirmeli öğrenmenin temel algoritmalarından biridir. Durum-eylem değerlerini yaklaşık olarak hesaplamak için derin sinir ağları kullanır.',
    complexity: {
      time: 'Değişken (ortama bağlı), Tahmin: O(action_space)',
      space: 'O(buffer_size + network_parameters)'
    },
    steps: [
      'Experience Replay: geçmiş deneyimleri depolar ve rastgele örneklerle öğrenir',
      'Target Network: öğrenme stabilitesini artırmak için kullanılır',
      'ε-greedy yaklaşımı ile keşif-sömürü dengesi sağlar',
      'Yüksek boyutlu durum uzaylarında (örneğin görüntüler) etkilidir',
      'Oyunlar ve robotik gibi alanlarda başarıyla uygulanmıştır'
    ],
    pros: [
      'Karmaşık ve yüksek boyutlu problemlerde etkili',
      'Deneyim yeniden kullanımı ile öğrenme verimliliği',
      'Sabit hedef ağ sayesinde stabilite',
      'End-to-end öğrenme (ham girişten çıkışa)',
      'Sürekli durum uzaylarında bile çalışabilir'
    ],
    cons: [
      'Hesaplama ve bellek gereksinimleri yüksek',
      'Hiperparametre ayarı hassas ve zor',
      'Aşırı tahmin (overestimation) sorununa yatkın',
      'Sürekli eylem uzaylarında doğrudan kullanılamaz',
      'Derin ağ eğitiminin zorluklarını taşır'
    ]
  },
  'linear regression': {
    name: 'Lineer Regresyon (Linear Regression)',
    description: 'Lineer Regresyon, bağımsız değişkenler ile bağımlı değişken arasındaki ilişkiyi doğrusal bir fonksiyon olarak modelleyen denetimli öğrenme algoritmasıdır. Algoritma, veri noktalarına en iyi uyan doğruyu bulmayı amaçlar.',
    complexity: {
      time: 'Eğitim: O(n×d²), Tahmin: O(d)',
      space: 'O(d)'
    },
    steps: [
      'Veri kümesini analiz et ve bağımsız/bağımlı değişkenleri belirle',
      'Hedef fonksiyonu (genellikle MSE - Ortalama Kare Hata) tanımla',
      'Model parametrelerini (ağırlıklar ve bias) başlangıç değerleri ile başlat',
      'Gradient Descent algoritması kullanarak parametreleri güncelle',
      'Hata metriklerini (MSE, R²) hesapla ve modeli değerlendir',
      'İstenilen performansa ulaşılana kadar veya belirli bir iterasyon sayısına kadar tekrarla'
    ],
    pros: [
      'Basit, anlaşılır ve yorumlanabilir bir model',
      'Küçük veri setlerinde bile iyi çalışabilir',
      'Eğitimi ve tahmin işlemi hızlıdır',
      'Model parametreleri (ağırlıklar) özellik önemini gösterir',
      'Regresyon problemi için iyi bir başlangıç noktasıdır',
      'Çok değişkenli problemlere kolayca genişletilebilir'
    ],
    cons: [
      'Sadece doğrusal ilişkileri modelleyebilir',
      'Aykırı değerlere (outliers) karşı hassastır',
      'Çoklu doğrusallık (multicollinearity) sorunu yaşayabilir',
      'Karmaşık ilişkileri yakalamakta yetersiz kalır',
      'Bağımsız değişkenler arasındaki etkileşimleri modelleyemez',
      'Veri dağılımı hakkında varsayımlar gerektirir'
    ]
  },
  'lineer regresyon': {
    name: 'Lineer Regresyon (Linear Regression)',
    description: 'Lineer Regresyon, bağımsız değişkenler ile bağımlı değişken arasındaki ilişkiyi doğrusal bir fonksiyon olarak modelleyen denetimli öğrenme algoritmasıdır. Algoritma, veri noktalarına en iyi uyan doğruyu bulmayı amaçlar.',
    complexity: {
      time: 'Eğitim: O(n×d²), Tahmin: O(d)',
      space: 'O(d)'
    },
    steps: [
      'Veri kümesini analiz et ve bağımsız/bağımlı değişkenleri belirle',
      'Hedef fonksiyonu (genellikle MSE - Ortalama Kare Hata) tanımla',
      'Model parametrelerini (ağırlıklar ve bias) başlangıç değerleri ile başlat',
      'Gradient Descent algoritması kullanarak parametreleri güncelle',
      'Hata metriklerini (MSE, R²) hesapla ve modeli değerlendir',
      'İstenilen performansa ulaşılana kadar veya belirli bir iterasyon sayısına kadar tekrarla'
    ],
    pros: [
      'Basit, anlaşılır ve yorumlanabilir bir model',
      'Küçük veri setlerinde bile iyi çalışabilir',
      'Eğitimi ve tahmin işlemi hızlıdır',
      'Model parametreleri (ağırlıklar) özellik önemini gösterir',
      'Regresyon problemi için iyi bir başlangıç noktasıdır',
      'Çok değişkenli problemlere kolayca genişletilebilir'
    ],
    cons: [
      'Sadece doğrusal ilişkileri modelleyebilir',
      'Aykırı değerlere (outliers) karşı hassastır',
      'Çoklu doğrusallık (multicollinearity) sorunu yaşayabilir',
      'Karmaşık ilişkileri yakalamakta yetersiz kalır',
      'Bağımsız değişkenler arasındaki etkileşimleri modelleyemez',
      'Veri dağılımı hakkında varsayımlar gerektirir'
    ]
  },
  'naive bayes': {
    name: 'Naive Bayes Algoritması',
    description: 'Naive Bayes, Bayes teoremi temelli olasılıksal bir sınıflandırma algoritmasıdır. "Naive" (saf) olarak adlandırılmasının sebebi, tüm özelliklerin birbirinden bağımsız olduğu varsayımını yapmasıdır. Bu basitleştirme sayesinde hesaplama kolaylığı sağlarken, gerçek hayat problemlerinde bile şaşırtıcı derecede iyi sonuçlar verebilir.',
    complexity: {
      time: 'Eğitim: O(n×d), Tahmin: O(d)',
      space: 'O(c×d)'
    },
    steps: [
      'Eğitim verilerinden her sınıf için prior olasılıkları hesapla: P(C)',
      'Her sınıf için özelliklerin koşullu olasılıklarını hesapla: P(X|C)',
      'Yeni bir veri noktası için tüm sınıfların posterior olasılıklarını hesapla: P(C|X) ∝ P(C) × ∏P(xᵢ|C)',
      'En yüksek posterior olasılığa sahip sınıfı tahmin olarak kullan',
      'Sürekli değişkenler için genellikle Gaussian dağılım varsayımı kullanılır',
      'Kategorik değişkenler için frekans tabanlı olasılıklar hesaplanır'
    ],
    pros: [
      'Basit, hızlı ve eğitimi kolaydır',
      'Küçük veri kümeleriyle bile iyi çalışır',
      'Gürültülü ve eksik verilere karşı dayanıklıdır',
      'Yüksek boyutlu verilerde etkilidir',
      'Çoklu sınıf problemlerinde doğal olarak kullanılabilir',
      'Az parametreye sahip olduğundan aşırı öğrenme riski düşüktür'
    ],
    cons: [
      'Bağımsızlık varsayımı gerçek dünya verilerinde genellikle geçerli değildir',
      'Eğitim verilerinde hiç görülmemiş değerler için sıfır olasılık sorunu yaşanabilir (Laplace düzeltmesi ile çözülebilir)',
      'Sayısal özelliklerde Gaussian dağılım varsayımı her zaman uygun olmayabilir',
      'Özellikler arasındaki ilişkileri modelleyemez',
      'Olasılık tahminleri her zaman doğru olmayabilir (sınıflandırma doğruluğu yüksek olsa bile)',
      'Çok fazla özellik olduğunda bellek kullanımı artabilir'
    ]
  },
  'naif bayes': {
    name: 'Naive Bayes Algoritması',
    description: 'Naive Bayes, Bayes teoremi temelli olasılıksal bir sınıflandırma algoritmasıdır. "Naive" (saf) olarak adlandırılmasının sebebi, tüm özelliklerin birbirinden bağımsız olduğu varsayımını yapmasıdır. Bu basitleştirme sayesinde hesaplama kolaylığı sağlarken, gerçek hayat problemlerinde bile şaşırtıcı derecede iyi sonuçlar verebilir.',
    complexity: {
      time: 'Eğitim: O(n×d), Tahmin: O(d)',
      space: 'O(c×d)'
    },
    steps: [
      'Eğitim verilerinden her sınıf için prior olasılıkları hesapla: P(C)',
      'Her sınıf için özelliklerin koşullu olasılıklarını hesapla: P(X|C)',
      'Yeni bir veri noktası için tüm sınıfların posterior olasılıklarını hesapla: P(C|X) ∝ P(C) × ∏P(xᵢ|C)',
      'En yüksek posterior olasılığa sahip sınıfı tahmin olarak kullan',
      'Sürekli değişkenler için genellikle Gaussian dağılım varsayımı kullanılır',
      'Kategorik değişkenler için frekans tabanlı olasılıklar hesaplanır'
    ],
    pros: [
      'Basit, hızlı ve eğitimi kolaydır',
      'Küçük veri kümeleriyle bile iyi çalışır',
      'Gürültülü ve eksik verilere karşı dayanıklıdır',
      'Yüksek boyutlu verilerde etkilidir',
      'Çoklu sınıf problemlerinde doğal olarak kullanılabilir',
      'Az parametreye sahip olduğundan aşırı öğrenme riski düşüktür'
    ],
    cons: [
      'Bağımsızlık varsayımı gerçek dünya verilerinde genellikle geçerli değildir',
      'Eğitim verilerinde hiç görülmemiş değerler için sıfır olasılık sorunu yaşanabilir (Laplace düzeltmesi ile çözülebilir)',
      'Sayısal özelliklerde Gaussian dağılım varsayımı her zaman uygun olmayabilir',
      'Özellikler arasındaki ilişkileri modelleyemez',
      'Olasılık tahminleri her zaman doğru olmayabilir (sınıflandırma doğruluğu yüksek olsa bile)',
      'Çok fazla özellik olduğunda bellek kullanımı artabilir'
    ]
  },
  'singly-linked-list': {
    name: 'Tek Yönlü Bağlı Liste (Singly Linked List)',
    description: 'Tek yönlü bağlı liste, her düğümün bir veri öğesi ve bir sonraki düğüme işaret eden bir pointer içerdiği doğrusal bir veri yapısıdır. Liste başlangıcı genellikle "head" olarak adlandırılan bir referans ile takip edilir ve listenin sonundaki düğüm NULL değerine işaret eder.',
    complexity: {
      time: 'Erişim: O(n), Arama: O(n), Ekleme: O(1)*, Silme: O(1)*\n* (Eğer pozisyon biliniyorsa)',
      space: 'O(n)',
    },
    steps: [
      'Liste başını (head) takip et',
      'Düğümler arasında "next" pointerını kullanarak ilerle',
      'İşlemleri gerçekleştirmek için genellikle listenin başından başla',
      'Yeni düğüm eklemek için bellek tahsis et ve pointerları güncelle',
      'Düğüm silmek için pointerları yeniden düzenle ve belleği serbest bırak',
      'Liste sonuna ulaşıldığında, son düğümün next pointerı NULL değerini gösterir'
    ],
    pros: [
      'Dinamik boyut - bellek ihtiyaç duyuldukça tahsis edilir',
      'Başa ekleme/silme işlemleri O(1) zaman karmaşıklığına sahiptir',
      'Bellek tahsisi esnek ve verimlidir',
      'Dizilere göre daha az bellek atlaması (memory wastage) yaşanır',
      'Eleman eklemek/silmek için fiziksel yer değiştirme gerekmez'
    ],
    cons: [
      'Rastgele erişim desteklenmez - n. elemana erişmek için O(n) zaman gerekir',
      'İki yönlü traversal (ileri-geri hareket) desteklenmez',
      'Her düğüm için ekstra bellek (pointer) gerektirir',
      'Önbellek uyumluluğu dizilere göre daha zayıftır',
      'İşlemlerde pointer yönetimi dikkat gerektirir'
    ],
  },
  'tek-yönlü-bağlı-liste': {
    name: 'Tek Yönlü Bağlı Liste (Singly Linked List)',
    description: 'Tek yönlü bağlı liste, her düğümün bir veri öğesi ve bir sonraki düğüme işaret eden bir pointer içerdiği doğrusal bir veri yapısıdır. Liste başlangıcı genellikle "head" olarak adlandırılan bir referans ile takip edilir ve listenin sonundaki düğüm NULL değerine işaret eder.',
    complexity: {
      time: 'Erişim: O(n), Arama: O(n), Ekleme: O(1)*, Silme: O(1)*\n* (Eğer pozisyon biliniyorsa)',
      space: 'O(n)',
    },
    steps: [
      'Liste başını (head) takip et',
      'Düğümler arasında "next" pointerını kullanarak ilerle',
      'İşlemleri gerçekleştirmek için genellikle listenin başından başla',
      'Yeni düğüm eklemek için bellek tahsis et ve pointerları güncelle',
      'Düğüm silmek için pointerları yeniden düzenle ve belleği serbest bırak',
      'Liste sonuna ulaşıldığında, son düğümün next pointerı NULL değerini gösterir'
    ],
    pros: [
      'Dinamik boyut - bellek ihtiyaç duyuldukça tahsis edilir',
      'Başa ekleme/silme işlemleri O(1) zaman karmaşıklığına sahiptir',
      'Bellek tahsisi esnek ve verimlidir',
      'Dizilere göre daha az bellek atlaması (memory wastage) yaşanır',
      'Eleman eklemek/silmek için fiziksel yer değiştirme gerekmez'
    ],
    cons: [
      'Rastgele erişim desteklenmez - n. elemana erişmek için O(n) zaman gerekir',
      'İki yönlü traversal (ileri-geri hareket) desteklenmez',
      'Her düğüm için ekstra bellek (pointer) gerektirir',
      'Önbellek uyumluluğu dizilere göre daha zayıftır',
      'İşlemlerde pointer yönetimi dikkat gerektirir'
    ],
  },
  
  // Çift yönlü bağlı liste (Doubly Linked List) açıklaması
  'doubly-linked-list': {
    name: 'Çift Yönlü Bağlı Liste (Doubly Linked List)',
    description: 'Çift yönlü bağlı liste, her düğümün bir veri öğesi, bir önceki düğüme işaret eden bir pointer ve bir sonraki düğüme işaret eden bir pointer içerdiği bir veri yapısıdır. Bu yapı, listenin her iki yönde de dolaşılmasını sağlar.',
    complexity: {
      time: 'Erişim: O(n), Arama: O(n), Ekleme: O(1)*, Silme: O(1)*\n* (Eğer pozisyon biliniyorsa)',
      space: 'O(n)',
    },
    steps: [
      'Liste başını (head) ve sonunu (tail) takip et',
      'Düğümler arasında "next" ve "prev" pointerlarını kullanarak ilerle',
      'İleri ve geri yönde dolaşım yapabilirsin',
      'Yeni düğüm eklemek için bellek tahsis et ve her iki yöndeki pointerları güncelle',
      'Düğüm silmek için her iki yöndeki pointerları yeniden düzenle',
      'Listenin başındaki düğümün prev pointerı ve sonundaki düğümün next pointerı NULL değerini gösterir'
    ],
    pros: [
      'İki yönlü traversal desteklenir - hem ileri hem geri dolaşabilirsin',
      'Son düğümü takip ediyorsan, sona ekleme O(1) zamanda yapılabilir',
      'Bir düğümün kendisine referans varsa, onu O(1) zamanda silebilirsin',
      'Çift yönlü arama yapabilirsin',
      'Tekli bağlı listelere göre daha esnek operasyonlar sunar'
    ],
    cons: [
      'Her düğüm için ekstra bellek (iki pointer) gerektirir',
      'Pointer yönetimi daha karmaşıktır - her operasyonda daha fazla pointer güncellemesi gerekir',
      'Rastgele erişim hala O(n) zaman karmaşıklığına sahiptir',
      'Implementasyon tek yönlü bağlı listeye göre daha karmaşıktır',
      'Önbellek uyumluluğu dizilere göre daha zayıftır'
    ],
  },
  'çift-yönlü-bağlı-liste': {
    name: 'Çift Yönlü Bağlı Liste (Doubly Linked List)',
    description: 'Çift yönlü bağlı liste, her düğümün bir veri öğesi, bir önceki düğüme işaret eden bir pointer ve bir sonraki düğüme işaret eden bir pointer içerdiği bir veri yapısıdır. Bu yapı, listenin her iki yönde de dolaşılmasını sağlar.',
    complexity: {
      time: 'Erişim: O(n), Arama: O(n), Ekleme: O(1)*, Silme: O(1)*\n* (Eğer pozisyon biliniyorsa)',
      space: 'O(n)',
    },
    steps: [
      'Liste başını (head) ve sonunu (tail) takip et',
      'Düğümler arasında "next" ve "prev" pointerlarını kullanarak ilerle',
      'İleri ve geri yönde dolaşım yapabilirsin',
      'Yeni düğüm eklemek için bellek tahsis et ve her iki yöndeki pointerları güncelle',
      'Düğüm silmek için her iki yöndeki pointerları yeniden düzenle',
      'Listenin başındaki düğümün prev pointerı ve sonundaki düğümün next pointerı NULL değerini gösterir'
    ],
    pros: [
      'İki yönlü traversal desteklenir - hem ileri hem geri dolaşabilirsin',
      'Son düğümü takip ediyorsan, sona ekleme O(1) zamanda yapılabilir',
      'Bir düğümün kendisine referans varsa, onu O(1) zamanda silebilirsin',
      'Çift yönlü arama yapabilirsin',
      'Tekli bağlı listelere göre daha esnek operasyonlar sunar'
    ],
    cons: [
      'Her düğüm için ekstra bellek (iki pointer) gerektirir',
      'Pointer yönetimi daha karmaşıktır - her operasyonda daha fazla pointer güncellemesi gerekir',
      'Rastgele erişim hala O(n) zaman karmaşıklığına sahiptir',
      'Implementasyon tek yönlü bağlı listeye göre daha karmaşıktır',
      'Önbellek uyumluluğu dizilere göre daha zayıftır'
    ],
  },
  
  // Dairesel bağlı liste (Circular Linked List) açıklaması
  'circular-linked-list': {
    name: 'Dairesel Bağlı Liste (Circular Linked List)',
    description: 'Dairesel bağlı liste, son düğümün NULL yerine ilk düğüme işaret ettiği özel bir bağlı liste türüdür. Bu yapı, düğümler arasında döngüsel dolaşım sağlar ve sürekli işleme gerektiren uygulamalarda kullanışlıdır.',
    complexity: {
      time: 'Erişim: O(n), Arama: O(n), Ekleme: O(1)*, Silme: O(1)*\n* (Eğer pozisyon biliniyorsa)',
      space: 'O(n)',
    },
    steps: [
      'Liste için bir giriş noktası (head) belirle',
      'Son düğümün next pointerı head düğümüne işaret eder',
      'Çift yönlü dairesel liste ise, head düğümünün prev pointerı da son düğüme işaret eder',
      'Listeyi dolaşırken, başlangıç noktasına geri dönüp dönmediğini kontrol et',
      'Düğüm eklerken/silerken dairesel yapıyı koru',
      'Listeyi dolaşırken sonsuz döngüye girmemek için dikkatli ol'
    ],
    pros: [
      'Listenin herhangi bir noktasından tüm listeye erişebilirsin',
      'Liste başını kaybetsen bile, herhangi bir düğümden tüm listeye erişebilirsin',
      'Döngüsel işlemler için uygundur (sırayla elemanlar üzerinde işlem yapma)',
      'Son düğüme referans tutulmasa bile son düğüme O(n) zamanda erişilebilir',
      'Bazı uygulamalarda bellek kullanımında avantaj sağlar'
    ],
    cons: [
      'Sonsuz döngü riski vardır - dolaşırken dikkatli olmak gerekir',
      'Standart bağlı listelere göre daha karmaşık implementasyon',
      'Listenin sonunu belirlemek için ek kontrol gerekir',
      'Traversal algoritmaları dikkatle yazılmalıdır',
      'Hata ayıklama daha zordur'
    ],
  },
  'dairesel-bağlı-liste': {
    name: 'Dairesel Bağlı Liste (Circular Linked List)',
    description: 'Dairesel bağlı liste, son düğümün NULL yerine ilk düğüme işaret ettiği özel bir bağlı liste türüdür. Bu yapı, düğümler arasında döngüsel dolaşım sağlar ve sürekli işleme gerektiren uygulamalarda kullanışlıdır.',
    complexity: {
      time: 'Erişim: O(n), Arama: O(n), Ekleme: O(1)*, Silme: O(1)*\n* (Eğer pozisyon biliniyorsa)',
      space: 'O(n)',
    },
    steps: [
      'Liste için bir giriş noktası (head) belirle',
      'Son düğümün next pointerı head düğümüne işaret eder',
      'Çift yönlü dairesel liste ise, head düğümünün prev pointerı da son düğüme işaret eder',
      'Listeyi dolaşırken, başlangıç noktasına geri dönüp dönmediğini kontrol et',
      'Düğüm eklerken/silerken dairesel yapıyı koru',
      'Listeyi dolaşırken sonsuz döngüye girmemek için dikkatli ol'
    ],
    pros: [
      'Listenin herhangi bir noktasından tüm listeye erişebilirsin',
      'Liste başını kaybetsen bile, herhangi bir düğümden tüm listeye erişebilirsin',
      'Döngüsel işlemler için uygundur (sırayla elemanlar üzerinde işlem yapma)',
      'Son düğüme referans tutulmasa bile son düğüme O(n) zamanda erişilebilir',
      'Bazı uygulamalarda bellek kullanımında avantaj sağlar'
    ],
    cons: [
      'Sonsuz döngü riski vardır - dolaşırken dikkatli olmak gerekir',
      'Standart bağlı listelere göre daha karmaşık implementasyon',
      'Listenin sonunu belirlemek için ek kontrol gerekir',
      'Traversal algoritmaları dikkatle yazılmalıdır',
      'Hata ayıklama daha zordur'
    ],
  },
};

// Algoritma kompleksitesini görselleştiren bileşen
export const ComplexityVisualizer: React.FC<{
  timeComplexity: string;
  spaceComplexity?: string;
}> = ({ timeComplexity, spaceComplexity }) => {
  // Kompleksite kategorileri ve renkleri
  const getComplexityColor = (complexity: string) => {
    if (complexity.includes('O(1)') || complexity.includes('O(log n)')) {
      return '#27ae60'; // Yeşil - çok iyi
    } else if (complexity.includes('O(n)') || complexity.includes('O(n log n)')) {
      return '#f39c12'; // Turuncu - orta
    } else if (complexity.includes('O(n²)')) {
      return '#e67e22'; // Turuncu kırmızı - kötü
    } else {
      return '#e74c3c'; // Kırmızı - çok kötü
    }
  };

  return (
    <View style={styles.complexityContainer}>
      <View style={styles.complexityItem}>
        <Text style={styles.complexityLabel}>Zaman Karmaşıklığı:</Text>
        <Text style={[styles.complexityValue, { color: getComplexityColor(timeComplexity) }]}>
          {timeComplexity}
        </Text>
      </View>
      
      {spaceComplexity && (
        <View style={styles.complexityItem}>
          <Text style={styles.complexityLabel}>Alan Karmaşıklığı:</Text>
          <Text style={[styles.complexityValue, { color: getComplexityColor(spaceComplexity) }]}>
            {spaceComplexity}
          </Text>
        </View>
      )}
    </View>
  );
};

// Algoritma adımlarını gösteren bileşen
export const StepVisualizer: React.FC<{
  steps: string[];
}> = ({ steps }) => {
  return (
    <View style={styles.stepsContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
};

// Algoritma bilgi kartı
export const AlgorithmInfoCard: React.FC<{
  algorithmType: string;
}> = ({ algorithmType }) => {
  const normalizedType = algorithmType.toLowerCase();
  
  // Web versiyondaki algoritma bilgilerini kullan
  const defaultInfo: DefaultAlgorithmInfo = {
    name: algorithmType,
    description: 'Bu algoritma için detaylı bilgi bulunmamaktadır.',
    complexity: { time: '', space: '' },
    steps: [],
    pros: [],
    cons: []
  };
  
  const algorithmInfo = algorithmDescriptions[normalizedType] || defaultInfo;

  return (
    <ScrollView style={styles.infoCardContainer}>
      <Text style={styles.infoTitle}>{algorithmInfo.name}</Text>
      <Text style={styles.infoText}>{algorithmInfo.description}</Text>
      
      <ComplexityVisualizer 
        timeComplexity={algorithmInfo.complexity.time} 
        spaceComplexity={algorithmInfo.complexity.space}
      />
      
      {algorithmInfo.steps.length > 0 && (
        <>
          <Text style={styles.stepsTitle}>Algoritma Adımları:</Text>
          <StepVisualizer steps={algorithmInfo.steps} />
        </>
      )}
      
      {((algorithmInfo.pros && algorithmInfo.pros.length > 0) || 
         (algorithmInfo.cons && algorithmInfo.cons.length > 0)) && (
        <View style={styles.prosConsContainer}>
          {algorithmInfo.pros && algorithmInfo.pros.length > 0 && (
            <View style={styles.prosContainer}>
              <Text style={styles.prosConsTitle}>Avantajlar:</Text>
              <View style={styles.prosConsList}>
                {algorithmInfo.pros.map((pro: string, index: number) => (
                  <View key={index} style={styles.prosConsItem}>
                    <Text style={styles.prosConsIcon}>✓</Text>
                    <Text style={styles.prosConsText}>{pro}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {algorithmInfo.cons && algorithmInfo.cons.length > 0 && (
            <View style={styles.consContainer}>
              <Text style={styles.prosConsTitle}>Dezavantajlar:</Text>
              <View style={styles.prosConsList}>
                {algorithmInfo.cons.map((con: string, index: number) => (
                  <View key={index} style={styles.prosConsItem}>
                    <Text style={styles.prosConsIcon}>✕</Text>
                    <Text style={styles.prosConsText}>{con}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Complexity Visualizer
  complexityContainer: {
    marginVertical: 10,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    elevation: 1,
  },
  complexityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  complexityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  complexityValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Step Visualizer
  stepsContainer: {
    marginVertical: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  
  // Algorithm Info Card
  infoCardContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginVertical: 10,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  
  // Pros & Cons
  prosConsContainer: {
    marginTop: 16,
  },
  prosContainer: {
    marginBottom: 16,
  },
  consContainer: {
    marginBottom: 8,
  },
  prosConsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  prosConsList: {
    marginLeft: 8,
  },
  prosConsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  prosConsIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#3498db',
    fontWeight: 'bold',
  },
  prosConsText: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
});

export default {
  AlgorithmInfoCard,
  ComplexityVisualizer,
  StepVisualizer,
  algorithmDescriptions
}; 