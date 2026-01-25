
// course-data.js
// Bu dosya kurs içeriğini (bölümler, videolar, testler) tutar.

const COURSES = {
  'baglama': {
    id: 'baglama',
    title: "Bağlama Eğitimi",
    description: "Bağlamanın temellerinden ileri düzeye yolculuk.",
    sections: [
      {
        id: 'sec-1',
        title: "Giriş ve Tanışma",
        modules: [
          {
            id: 'mod-1-1',
            title: "Hocayı Tanıyalım",
            type: 'video',
            videoUrl: '',
            poster: 'assets/yeniruh.svg',
            duration: '2:30',
            description: 'Eğitmenimiz ile tanışın ve kursun hedeflerini öğrenin.'
          },
          {
            id: 'mod-1-2',
            title: "Bağlamanın Tarihi",
            type: 'video',
            videoUrl: '',
            poster: 'assets/Bağlama_yatay.png',
            duration: '5:45',
            description: 'Bağlamanın kökeni ve kültürel önemi.'
          },
          {
            id: 'mod-1-3',
            title: "Bağlamanın Bölümleri",
            type: 'video',
            videoUrl: '',
            poster: 'assets/Bağlama_yatay.png',
            duration: '4:20',
            description: 'Tekne, göğüs, sap ve burgular.'
          },
          {
            id: 'mod-1-4',
            title: "Bağlamanın Tutuşu",
            type: 'video',
            videoUrl: '',
            poster: 'assets/Bağlama_yatay.png',
            duration: '6:10',
            description: 'Doğru oturuş ve tutuş pozisyonu.'
          },
          {
            id: 'mod-1-5',
            title: "Bölüm 1 Özeti",
            type: 'video',
            videoUrl: '',
            poster: 'assets/yeniruh.svg',
            duration: '3:00',
            description: 'İlk bölümde öğrendiklerimizin kısa bir özeti.'
          }
        ]
      },
      {
        id: 'sec-2',
        title: "Nota Bilgisi",
        modules: [
          {
            id: 'mod-2-1',
            title: "5 Çizgi",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '5:00',
            description: 'Dizek (porte) ve notaların yerleşimi.'
          },
          {
            id: 'mod-2-2',
            title: "Müzikte Tartımlar",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '4:45',
            description: 'Ritim ve zaman kavramları.'
          },
          {
            id: 'mod-2-3',
            title: "Örnek Tartım: 4'lük",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '3:30',
            description: '4 zamanlı vuruş pratikleri.'
          },
          {
            id: 'mod-2-4',
            title: "Örnek Tartım: 2'lik",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '3:15',
            description: '2 zamanlı vuruş pratikleri.'
          },
          {
            id: 'mod-2-5',
            title: "Bölüm 2 Özeti",
            type: 'video',
            videoUrl: '',
            poster: 'assets/yeniruh.svg',
            duration: '2:50',
            description: 'Nota bilgisi bölümünün özeti.'
          }
        ]
      },
      {
        id: 'sec-3',
        title: "Basit Ezgiler ve İlk Parçalar",
        modules: [
          {
            id: 'mod-3-1',
            title: "Basit Egzersizlerle Nota Okuma",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '5:30',
            description: 'Notaları tanıyalım ve okuma pratiği yapalım.'
          },
          {
            id: 'mod-3-2',
            title: "İlk Ezgi: Uzun İnce Bir Yoldayım",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '8:00',
            description: 'Aşık Veysel\'in ölümsüz eserinin basitleştirilmiş icrası.'
          },
          {
            id: 'mod-3-3',
            title: "Ritimli Çalışma: 4/4’lük Tempo",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '4:15',
            description: '4/4\'lük ritim kalıpları ile çalışma.'
          },
          {
            id: 'mod-3-4',
            title: "Basit Tekrar ve Tempo Egzersizi",
            type: 'video',
            videoUrl: '',
            poster: 'assets/afgroove-full.svg',
            duration: '3:45',
            description: 'Hızlanma ve tekrar çalışmaları.'
          },
          {
            id: 'mod-3-5',
            title: "Ara Etkinlik: Bağlama Ustasını Tanıyalım",
            type: 'video',
            videoUrl: '',
            poster: 'assets/yeniruh.svg',
            duration: '6:10',
            description: 'Büyük ustaların hayatından kesitler.'
          },
          {
            id: 'mod-3-6',
            title: "Bölüm 3 Özeti ve Mini Test",
            type: 'quiz',
            description: 'Öğrendiklerimizi pekiştirme zamanı.',
            questions: [
              {
                text: "Uzun İnce Bir Yoldayım türküsü kime aittir?",
                options: ["Neşet Ertaş", "Aşık Veysel", "Mahzuni Şerif", "Pir Sultan Abdal"],
                correctIndex: 1
              },
              {
                text: "4/4'lük ölçüde bir vuruş değeri hangisidir?",
                options: ["Yarım vuruş", "Çeyrek vuruş", "Tam vuruş (dörtlük)", "İkilik vuruş"],
                correctIndex: 2
              }
            ]
          }
        ]
      }
    ]
  }
};

window.getCourse = (id) => COURSES[id];
