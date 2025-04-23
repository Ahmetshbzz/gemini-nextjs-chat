# Gemini NextJS Chat Uygulaması

Next.js 15.3 ve Google Gemini AI kullanarak geliştirilmiş, çoklu modlu (multimodal) bir sohbet uygulaması.

## Özellikler

- Gerçek zamanlı kamera görüntüsü analizi
- Çoklu modlu yapay zeka iletişimi
- Modern UI tasarımı (shadcn/ui bileşenleri)
- Emoji tepkileri
- Mesaj arama
- Zustand ile durum yönetimi

## Teknoloji Stack'i

- **Frontend**: Next.js 15.3, React 19, Tailwind CSS
- **Yapay Zeka**: Google Generative AI (Gemini)
- **Durum Yönetimi**: Zustand
- **Paket Yöneticisi**: Bun

## Kurulum

```bash
# Bağımlılıkları yükleyin
bun install

# Geliştirme sunucusunu başlatın
bun run dev
```

## Yapılandırma

Bu uygulama için bir Google Generative AI API anahtarı gereklidir. `.env.local` dosyasını oluşturun ve gerekli değişkenleri ekleyin:

```env
GOOGLE_AI_API_KEY=your_api_key_here
```

## Turbopack Kullanımı

Bu proje, Next.js 15.3'ün sağladığı Turbopack'i kullanmaktadır. Geliştirme sürecinde daha hızlı bir deneyim için Turbopack'i kullanıyoruz.

## Lisans

MIT


