# SESI 1 Cleanup Layout

Tanggal Dokumen: 2026-04-23
Versi Dokumen: V2 Professional
Sumber Asli: promt/SESI_1_cleanup_layout.md

## Tujuan Dokumen

> Tempel prompt ini di Cursor AI / Windsurf / GitHub Copilot Agent > Selesaikan sesi ini dulu, test, baru lanjut ke Sesi 2

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. KONTEKS PROJECT
2. TUGAS SESI INI
3. TUGAS 1 — Update `src/App.jsx`
4. TUGAS 2 — Update `src/main.jsx`
5. TUGAS 3 — Bersihkan `src/index.css`
6. TUGAS 4 — Hapus file layout lama
7. TUGAS 5 — Fix i18n di `src/components/layout/header.jsx`
8. YANG TIDAK BOLEH DIUBAH

## Konten Inti (Disusun Ulang)

> Tempel prompt ini di Cursor AI / Windsurf / GitHub Copilot Agent
> Selesaikan sesi ini dulu, test, baru lanjut ke Sesi 2

---

## KONTEKS PROJECT

Ini adalah aplikasi Helpdesk System (React 18 + Vite + TailwindCSS + shadcn/ui).
Backend: Express.js + MySQL. Auth: JWT via httpOnly Cookie (sudah selesai, jangan disentuh).

Saat ini ada **masalah duplikasi layout** — ada dua sistem layout yang hidup berdampingan:

**LAMA (belum dihapus):**
- `src/components/MainLayout.jsx` — hanya wrapper tipis ke layout baru
- `src/components/Sidebar.jsx` — sidebar lama berbasis NavLink biasa
- `src/components/Header.jsx` — header lama dengan Sheet mobile
- `src/components/Footer.jsx` — footer yang sudah tidak dipakai

**BARU (sudah ada, ini yang benar):**
- `src/components/layout/main-layout.jsx` — pakai shadcn `SidebarProvider`
- `src/components/layout/app-sidebar.jsx` — pakai shadcn `Sidebar` primitives
- `src/components/layout/header.jsx` — pakai `SidebarTrigger` + Breadcrumb
- `src/components/layout/nav-group.jsx` — navigasi per group dengan Collapsible
- `src/components/layout/nav-user.jsx` — user menu di footer sidebar
- `src/components/layout/sidebar-data.js` — konfigurasi menu per role

**Ada juga duplikasi CSS:**
- `src/index.css` — punya CSS variables sendiri (HSL format)
- `src/styles/theme.css` — CSS variables yang benar (OKLCH format + sidebar vars lengkap)

---

## TUGAS SESI INI

### TUGAS 1 — Update `src/App.jsx`

Ganti import MainLayout dari komponen lama ke layout baru:

```jsx
// HAPUS baris ini:
import MainLayout from '@/components/MainLayout.jsx';

// GANTI dengan:
import { MainLayout } from '@/components/layout';
```

Pastikan semua `<MainLayout />` di routing tetap berfungsi — tidak ada perubahan lain di App.jsx.

---

### TUGAS 2 — Update `src/main.jsx`

Pastikan import CSS dalam urutan yang benar:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/theme.css';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

---

### TUGAS 3 — Bersihkan `src/index.css`

File `src/index.css` saat ini memiliki duplikasi CSS variables yang bertabrakan dengan `src/styles/theme.css`.

Hapus seluruh blok `@layer base { :root { ... } }` dan `@layer base { .dark { ... } }` dari `index.css`.

**Pertahankan** di `index.css` hanya bagian ini:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', sans-serif;
    line-height: 1.5;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-bold tracking-tight text-foreground;
  }
  ::placeholder {
    color: hsl(var(--muted-foreground) / 0.7);
    opacity: 1;
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
}
```

Semua CSS variables (`:root` dan `.dark`) sudah ada di `src/styles/theme.css` — tidak perlu duplikat.

---

### TUGAS 4 — Hapus file layout lama

Hapus file-file berikut (sudah tidak dipakai):
- `src/components/MainLayout.jsx`
- `src/components/Sidebar.jsx`
- `src/components/Header.jsx`
- `src/components/Footer.jsx`

---

### TUGAS 5 — Fix i18n di `src/components/layout/header.jsx`

Saat ini `changeLanguage` menggunakan `window.location.reload()` yang buruk untuk UX.
Ganti dengan i18n yang proper:

```jsx
// Tambahkan import:
import { useTranslation } from 'react-i18next';

// Di dalam komponen Header, tambahkan:
const { i18n } = useTranslation();

// Ganti fungsi changeLanguage:
const changeLanguage = (lang) => {
  const lowerLang = lang.toLowerCase();
  i18n.changeLanguage(lowerLang);
  localStorage.setItem('app_language', lang);
  // HAPUS window.location.reload()
};
```

---

## YANG TIDAK BOLEH DIUBAH

```
❌ src/lib/api.js
❌ src/lib/socket.js
❌ src/contexts/AuthContext.jsx
❌ src/components/layout/ (kecuali header.jsx untuk fix i18n)
❌ src/styles/theme.css
❌ src/components/ui/ (semua file)
❌ Semua file pages
```

---

## VERIFIKASI SETELAH SELESAI

Pastikan hal berikut berfungsi sebelum lanjut ke Sesi 2:
- [ ] App bisa dijalankan tanpa error (`npm run dev`)
- [ ] Login berfungsi dan redirect ke dashboard sesuai role
- [ ] Sidebar muncul dan bisa di-collapse (klik icon toggle)
- [ ] Navigasi antar menu berfungsi
- [ ] Dark mode toggle berfungsi dan tersimpan
- [ ] Tidak ada error di console browser terkait CSS variables

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
