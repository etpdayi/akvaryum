# 🐟 Akvaryum (FishVille Sanat Tasarımı & Canlı Yayın MMO)

> Nostaljik **FishVille** tarzı berrak turkuaz akvaryum grafikleri, derin sanal bebek (Tamagotchi) hayatta kalma mekanikleri, **Resmi Kick OAuth 2.0 Girişi**, **AFK Gold Farming (Pasif Gelir)** ve **Topluluk Akvaryumlarını Ziyaret** sistemiyle donatılmış kolektif dijital akvaryum.

---

## 🔐 Kick OAuth 2.0 Entegrasyonu

Oyun, Kick Developers API OAuth 2.0 PKCE (Proof Key for Code Exchange) standardını kullanır:

- **Client ID:** `01M704E9HN0NWT18M0PSBN6QWJ`
- **Redirect URI:** `https://etpdayi.github.io/akvaryum/`
- **Scopes:** `user:read channel:read`
- **Kullanım:**
  - İzleyici sağ üstteki **"⚡ Kick ile Giriş Yap"** butonuna tıklar.
  - Açılan modal üzerinden doğrudan resmi Kick onay ekranına yönlendirilir (`id.kick.com`).
  - Onay verildikten sonra GitHub Pages sayfasına (`https://etpdayi.github.io/akvaryum/`) geri dönülür.
  - Kod otomatik olarak token'a dönüştürülür, kullanıcının avatarı ve `@kullaniciadi` profil bilgileri çekilerek oyuna kaydedilir.
  - Çizilen tüm balıklar ve topluluk etkileşimleri kullanıcının resmi Kick hesabıyla eşleşir.

---

## 🎨 FishVille Sanat Tasarımı ve Oyun Döngüsü

1. **Berrak Turkuaz Su & Kaya Kemeri:**
   - FishVille'in ikonik sol mağara kemeri, sağ resif kayaları, canlı yeşil deniz yosunları ve sıcak kumlu zemin.
2. **Bölgesel Yosunlaşma:**
   - Sürekli piksel kirlenme yerine, belirli aralıklarla (yaklaşık her 45 saniyede bir) camın üzerinde organik yeşil yosun lekeleri belirir.
   - İzleyici nostaljik sünger imleciyle lekenin üstünü siler ve **+2 Gold** temizlik ödülü kazanır.
3. **10 Dakikada Bir Ana Yem:**
   - 10 yem = 100 dakika yayın izleme emeği ile yavru balık olgun bir yetişkine dönüşür.
4. **🪙 AFK Gold Farming (Pasif Gelir):**
   - Balık sağlıklı yaşadığı her dakika kullanıcıya pasif olarak **+10 Gold** kazandırır.
   - Hastalanırsa (oksijen düşerse veya lekeler silinmezse) altın üretimi durur!
5. **🛍️ Yüzme İzi ve Kozmetik Dükkanı:**
   - Kazandığınız altınlarla balığınıza **Kick Neon Yeşili**, **Sihirli Yıldız Tozu**, **Altın Hazine Tozu** ve **Gökkuşağı Akışı** gibi yüzme izleri satın alabilirsiniz.
6. **👥 Topluluk Akvaryumlarını Ziyaret Et:**
   - Diğer izleyicilerin FishVille tarzı akvaryumları gezilebilir, balıkları sevilerek karşılıklı **+5 Gold** kazanılabilir.
7. **🌊 Ortak Okyanusa Salma:**
   - 10. yeme ulaşan balık okyanusa salınır; tüm izleyicilerin balıkları devasa ortak akvaryumda birlikte yüzer.

---

## 🚀 Dağıtım (GitHub Pages Kurulumu)

Projeyi `https://etpdayi.github.io/akvaryum/` adresinde canlıya almak için:

1. Proje klasöründeki dosyaları GitHub'da `akvaryum` isimli bir depoya (repository) yükleyin:
   ```bash
   git init
   git add .
   git commit -m "Akvaryum FishVille & Kick OAuth Yayında"
   git branch -M main
   git remote add origin https://github.com/etpdayi/akvaryum.git
   git push -u origin main
   ```
2. Depo ayarlarından (**Settings** ➔ **Pages**) `main` dalını seçip kaydedin.
3. Birkaç saniye içinde `https://etpdayi.github.io/akvaryum/` adresinde oyun ve Kick OAuth girişiniz tam uyumlu olarak canlıya geçecektir!
