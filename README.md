AF-GROOVE - Basit Ana Sayfa

Bu küçük statik site örneği `index.html`, `styles.css` ve `script.js` içerir.

Özellikler:
- Üstte merkezde AF-GROOVE başlığı ve yanında kalem logosu.
- Sağda yuvarlak tema (gece/gündüz) butonu; dark/light temasını değiştirir.
- Ana bölümde sallanan 2D hayalet animasyonu.
- "Af-Groove'a hoş geldiniz." yazısı, farklı noktalama dönüşümleriyle yazılır ve silinir.
- İki buton: birincisi "Hadi! Başlayalım." ikincisi "Zaten bir hesabım var". Hover efektleri var.

Firebase entegrasyonu:
- Basit e-posta/parola ile kayıt ve giriş desteği eklendi (client-side).
- Yeni dosyalar: `firebase-config.example.js` (kopyala -> `firebase-config.js` ve kendi config'ini doldur), `firebase-auth.js`.

Firebase Kurulum:
1. Firebase Console'da yeni bir proje oluştur.
2. Projede Authentication -> Sign-in method bölümünden "Email/Password"'u etkinleştir.
3. Project settings -> Your apps altında bir web uygulaması ekle ve config nesnesini kopyala.
4. `firebase-config.example.js` dosyasını `firebase-config.js` olarak kopyala ve kendi değerlerinle değiştir.
5. `index.html`'i tarayıcıda aç; sağ üstteki kullanıcı alanından giriş/kayıt modalını açabilirsin.

Nasıl çalıştırılır:
1. Bu klasörde `index.html` dosyasını tarayıcıda açın.
2. Tema, sayfada sağ üstteki butonla değiştirilebilir. Tercih localStorage'de saklanır.

Notlar:
- Tasarım modern ve minimal tutuldu. Renkler tema bazlı değişir.
