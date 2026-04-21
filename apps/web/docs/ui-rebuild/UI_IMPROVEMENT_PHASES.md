# UI Improvement Phases (Execution Plan)

Tanggal: 2026-04-21
Tujuan: Menyediakan fase eksekusi UI yang terstruktur, terukur, dan siap dikerjakan bertahap.

## Status Eksekusi

- Fase 1 (Design Foundation): Completed
- Fase 2-7: Not Started

## Prinsip Prioritas

1. Perbaiki fondasi visual dan konsistensi terlebih dahulu.
2. Stabilkan UX form, state loading/error/empty, lalu dashboard insight.
3. Lakukan polish dan optimasi setelah alur utama solid.

## Fase 1 - Design Foundation (Paling Penting)

Fokus:
- Rework visual identity (token warna utama, aksen, chart, status, urgency).
- Typography system (headline + body + skala teks per level).
- Spacing/radius/shadow baseline agar komponen terasa konsisten.

Deliverable:
- Token tema final untuk light/dark.
- Guideline tipografi dan hierarchy teks.
- Preview 3 halaman acuan (Login, Dashboard, Tickets) dengan style baru.

Definition of Done:
- Tidak ada raw color hardcode untuk area utama.
- Semua komponen inti memakai token semantik.
- Kontras teks utama lolos standar aksesibilitas dasar.

Estimasi:
- 2-3 hari.

## Fase 2 - App Shell & Navigation Consistency

Fokus:
- Konsistensi header/sidebar lintas role.
- Breadcrumb, quick actions, user context, language/theme controls.
- Struktur layout mobile-first agar tidak terasa sempit di layar kecil.

Deliverable:
- Header dan sidebar konsisten untuk user/teknisi/admin.
- Pola page title + subtitle + action bar yang seragam.
- Navigasi mobile stabil (open/close, overlay, scroll behavior).

Definition of Done:
- Semua halaman utama mengikuti pola shell yang sama.
- Tidak ada layout jump saat pindah halaman.
- Navigasi role-based jelas dan minim klik.

Estimasi:
- 2 hari.

## Fase 3 - Form System & Validation UX

Fokus:
- Standarisasi form dengan pola komponen yang konsisten.
- Error/help text/disabled/loading state seragam.
- Perbaikan UX input sensitif (password, upload, select options).

Deliverable:
- Form pattern baku (label, description, error, helper).
- Refactor halaman prioritas: Login, Signup, Create Ticket, Settings, modal edit user/teknisi.
- Validasi visual konsisten untuk semua skenario gagal/sukses.

Definition of Done:
- Tidak ada form ad-hoc pada halaman prioritas.
- Error state terlihat jelas dan informatif.
- Alur submit form tidak membingungkan user.

Estimasi:
- 3 hari.

## Fase 4 - Data Surfaces (Table, Empty, Loading, Error)

Fokus:
- Konsistensi tabel, filter, search, badge status, row action.
- Empty state dan skeleton state yang informatif.
- Error panel inline untuk fetch failure + retry action.

Deliverable:
- Template tabel baku untuk semua halaman data-heavy.
- Empty state + skeleton + error state reusable.
- Pola pagination/filter/search seragam.

Definition of Done:
- Tidak ada halaman tabel tanpa loading/empty/error state.
- Semua status/urgency ditampilkan dengan pola badge konsisten.
- Waktu pemahaman halaman oleh user menurun (lebih cepat memahami konteks).

Estimasi:
- 3 hari.

## Fase 5 - Dashboard Insight Upgrade

Fokus:
- Ubah dashboard dari sekadar list menjadi insight-driven.
- Tambahkan trend, SLA indicator, aging buckets, prioritas harian.
- Konsistensi visual chart dan summary cards.

Deliverable:
- Dashboard role-based dengan card insight yang relevan.
- Komponen chart dan legend yang seragam.
- Section "Perlu perhatian hari ini" untuk action cepat.

Definition of Done:
- User bisa mengambil keputusan prioritas tanpa membuka banyak halaman.
- Ringkasan performa dan anomali terlihat dalam 5-10 detik pertama.
- Chart dan card memiliki teks penjelas yang jelas.

Estimasi:
- 3 hari.

## Fase 6 - Conversation UX (Chat & Ticket Detail)

Fokus:
- Perbaikan bubble chat, composer, attachment preview, read status.
- Ticket detail hierarchy (timeline, status, notes, action area).
- Responsivitas panel chat/detail di mobile.

Deliverable:
- Chat UI lebih terbaca untuk percakapan panjang.
- Ticket detail mudah di-scan (ringkasan, metadata, aksi).
- Empty/loading/error state spesifik untuk area chat.

Definition of Done:
- Percakapan panjang tetap nyaman dibaca.
- Action utama pada ticket detail selalu terlihat.
- Tidak ada tumpang tindih elemen pada viewport kecil.

Estimasi:
- 2 hari.

## Fase 7 - Final Polish, Accessibility, and QA UI

Fokus:
- Micro-interaction seperlunya (bukan berlebihan).
- Keyboard/focus state/accessibility labels.
- Konsolidasi style debt dan cleanup class yang tidak konsisten.

Deliverable:
- UI polish pass lintas halaman utama.
- Checklist accessibility dasar selesai.
- Daftar bug visual ditutup.

Definition of Done:
- Tidak ada blocker visual di desktop/mobile.
- Focus ring, keyboard nav, dan label penting berjalan baik.
- UI regression checklist hijau.

Estimasi:
- 2 hari.

## Gate Kualitas per Fase

Setiap fase dianggap selesai jika:
- Scope fase selesai minimal 90% sesuai deliverable.
- Tidak ada blocker/high bug yang tersisa dari fase tersebut.
- Halaman prioritas fase lolos smoke test UI desktop + mobile.
- Dokumentasi hasil fase diperbarui ringkas (apa yang berubah, apa yang masih open).

## Urutan Eksekusi Disarankan

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5
6. Fase 6
7. Fase 7

Total estimasi: 17-18 hari kerja efektif.
