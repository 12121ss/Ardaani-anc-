# Arda Nişancı Portfolyo

Full-stack portfolyo uygulaması (Vite + Express).

## Kurulum ve Çalıştırma

1. Bağımlılıkları yükleyin: `npm install`
2. Geliştirme ortamını başlatın: `npm run dev`
3. Üretim build'i alın: `npm run build`

## Deployment (Railway, vb.)

Bu uygulama hem frontend hem de backend içeren bir yapıdır.

### Railway Ayarları:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Environment:** `NODE_ENV=production`

Uygulama `server.ts` üzerinden hem API isteklerini karşılar hem de `dist` klasöründeki statik dosyaları sunar.
Eğer API isteklerinde 405 veya 404 hatası alıyorsanız, `npm start` komutunun Express sunucusunu başarıyla başlattığından emin olun.
