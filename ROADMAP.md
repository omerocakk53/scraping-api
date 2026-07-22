# Scraping API Roadmap

Bu repo, veri kazıma platformunun backend çekirdeği olacak.

## Bu Oturumda Kurulan Temel

- Ortak adapter kayıt defteri
- Normalize edilmiş sonuç zarfı
- In-memory job queue ve retry akışı
- Structured log formatı
- YouTube, Amazon ve Play Store için adapter iskeletleri
- Adapter ve job listeleme endpointleri
- Proje bazlı kalıcı kayıt katmanı
- Project target ve run history desteği
- Kalıcı job geçmişi
- JSON/CSV dışa aktarma endpointleri

## Hedef

- Birden fazla kaynaktan veri toplamak
- Her kaynağı ayrı bir adapter olarak yönetmek
- Çıkan veriyi tek tip şemada normalize etmek
- Job, retry, timeout ve log tarafını güvenilir hale getirmek

## Öncelik Sırası

1. Scraping çekirdeğini sağlamlaştırmak
   - job queue
   - retry policy
   - timeout / rate limit
   - structured logging
   - çıktı şeması

2. Kaynak adapter mimarisi kurmak
   - YouTube
   - Play Store
   - Amazon
   - diğer review / product kaynakları

3. Veri normalizasyonu
   - yorum
   - ürün
   - puan
   - tarih
   - yazar
   - fiyat
   - kaynak meta verisi

4. Export ve kullanım katmanı
   - JSON
   - CSV
   - geçmiş işler
   - hata kayıtları
   - kayıtlı projeler

5. Ürünleşme katmanı
   - yetkilendirme
   - kullanıcı rolleri
   - plan / kota mantığı
   - dashboard

## Mimari Kural

- Route katmanı sadece giriş noktası olsun.
- Scraping detayları controller içine gömülmesin.
- Her kaynak kendi servisinde yaşasın.
- Ortak veri modeli tek yerde tanımlansın.
- Uzun süren işler request-response içinde değil, job mantığında yürüsün.

## İlk Teknik Kazanımlar

- Mevcut YouTube akışını bozmadan iyileştirmek
- Aynı anda çalışan browser sayısını kontrollü tutmak
- Her scrape işini trace edilebilir hale getirmek
- Kaynak eklemeyi kolaylaştıran bir adapter iskeleti oluşturmak

## Sonraki Somut Adım

- Job kuyruğunu kalıcı depolama ile desteklemek
- Amazon ve Play Store için gerçek dünya selector ince ayarı
- Scrape sonuçlarını proje bazlı organize etmek
- CSV/export ve geçmiş iş ekranını eklemek
- AI tüketimi için analiz/özet katmanı eklemek

## Not

- `README.md` dosyası bu repoda UTF-8 dışı bir içerik taşıyor; bu yüzden şimdilik dokunmadım.

## Not

Frontend tarafı ayrı repo olarak kalabilir, ama backend ile aynı sürümleme döngüsüne girmesi gerekiyorsa monorepo düşünülür.
