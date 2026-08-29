-- Seed data: the 2 real communities VespaKita already worked with, inserted
-- directly as 'published' (skipping the pending queue since these are
-- already-vetted relationships, not new self-service submissions).

INSERT INTO communities (id, status, name, city, description, member_estimate, ig, wa, logo_url, cover_photo_url, submitted_at, reviewed_at, published_at)
VALUES (
  '967c6190-f529-4418-b6cf-a0b36861d3cc', 'published',
  'Vespa 60''s Yogyakarta', 'Yogyakarta',
  'Vespa 60''s Yogyakarta merupakan komunitas pecinta Vespa klasik yang menjunjung tinggi nilai persaudaraan, kebersamaan, dan semangat menjelajah Nusantara. Melalui berbagai kegiatan seperti touring, kopdar, bakti sosial, dan partisipasi dalam event nasional, mereka terus menjaga budaya berkendara yang aman, santun, serta mempererat silaturahmi antar komunitas Vespa di seluruh Indonesia.',
  NULL, '60s_jogja', '',
  'https://www.vespakita.com/60s-yogyakarta/60s-logo.png',
  'https://www.vespakita.com/60s-yogyakarta/gallery-1.jpg',
  '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z'
);

INSERT INTO community_events (id, community_id, status, title, event_date_text, participant_estimate, support_type, description, sponsor_logos, submitted_at, reviewed_at, published_at)
VALUES (
  '7f94c2c5-0b78-4f08-b071-c7fa08d18a9d', '967c6190-f529-4418-b6cf-a0b36861d3cc', 'published',
  'Road to Jakarta — Jamnas Vespa 60''s Indonesia 2026', '20-23 Agustus 2026', 300, 'Kombinasi',
  'Touring lintas provinsi dari Yogyakarta menuju Jambore Nasional Vespa 60''s Indonesia 2026 di Jakarta, melintasi jalur Pantura.',
  '[{"url":"https://www.vespakita.com/60s-yogyakarta/sponsor-hs.jpg"},{"url":"https://www.vespakita.com/60s-yogyakarta/sponsor-kenanga.jpg"},{"url":"https://www.vespakita.com/60s-yogyakarta/sponsor-unlock.png"},{"url":"https://www.vespakita.com/60s-yogyakarta/sponsor-northy.png"}]',
  '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z'
);

INSERT INTO communities (id, status, name, city, description, member_estimate, ig, wa, logo_url, cover_photo_url, submitted_at, reviewed_at, published_at)
VALUES (
  '90f26708-1bfe-4361-9e59-0aed51d07757', 'published',
  'Volkswagen Club Yogyakarta', 'Yogyakarta',
  'Lebih dari tiga puluh tahun silam, lima orang sahabat mahasiswa yang gemar hilir mudik mengaspal di jalanan kota Yogyakarta mendirikan wadah bagi sesama penggemar VW. Pada 16 April 1984, berdirilah Volkswagen Club Yogyakarta (VCY). Kini jumlah anggota VCY telah menyentuh 227 orang, terus aktif mengibarkan panji penggemar VW Indonesia ke tingkat nasional hingga internasional.',
  227, 'vwclubyogyakarta', '628112651405',
  'https://www.vespakita.com/vw-yogyakarta/images/vcy-logo.png',
  'https://www.vespakita.com/vw-yogyakarta/images/hero-bg_poster.jpg',
  '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z'
);

INSERT INTO community_events (id, community_id, status, title, event_date_text, participant_estimate, support_type, description, sponsor_logos, submitted_at, reviewed_at, published_at)
VALUES (
  'e4be7e57-4097-41f4-b9ca-7ec5c9ab6bb1', '90f26708-1bfe-4361-9e59-0aed51d07757', 'published',
  'Swingin'' Summer VDUB 2026', '5-6 September 2026', NULL, 'Kombinasi',
  'Silaturahmi akbar para pecinta Volkswagen klasik se-Jawa & Bali di Bojong Asri & Pantai Depok, Bantul.',
  '[]',
  '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z'
);
