<div align="center">

<img src="apps/web/public/images/logo_bidtik.png" alt="Logo Bidtik" height="80" />

# 🛡️ HelpdeskPolda

**Sistem Helpdesk IT terpadu untuk Kepolisian Daerah**

Platform manajemen tiket IT berbasis monorepo — lengkap dengan real-time chat, role management, observability, dan pipeline CI/CD siap produksi.

[![CI/CD](https://img.shields.io/github/actions/workflow/status/USERNAME/projectpolda/backend-ci.yml?label=CI%2FCD&logo=github-actions&style=flat-square)](https://github.com/USERNAME/projectpolda/actions)
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](./VERSION)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

---

[✨ Fitur](#-fitur-utama) · [🏗️ Arsitektur](#️-arsitektur) · [🚀 Instalasi](#-instalasi) · [⚙️ Konfigurasi](#️-konfigurasi) · [🧪 Testing](#-testing--quality) · [🔐 Keamanan](#-keamanan)

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🎫 **Manajemen Tiket** | Buat, assign, tracking, dan riwayat tiket IT secara penuh |
| 💬 **Real-time Chat** | Komunikasi langsung antara user dan teknisi via Socket.IO |
| 👥 **Multi-role** | Panel terpisah untuk User, Teknisi, dan Admin |
| 📊 **Dashboard & Insight** | Visualisasi statistik tiket, aktivitas, dan performa teknisi |
| 🔔 **Notifikasi** | Toast notification dan update status real-time |
| 🔐 **Keamanan Enterprise** | JWT + Cookie auth, CSRF protection, rate limiting, Helmet.js |
| 📈 **Observability** | Prometheus metrics, health check endpoint, audit logger |
| 🐳 **Docker Ready** | Build & deploy siap container |
| 🔄 **CI/CD Pipeline** | GitHub Actions: lint → test → build image → staging deploy |

---

## 🏗️ Arsitektur

```
projectpolda/                   # Monorepo root
├── apps/
│   └── web/                    # Frontend — React 18 + Vite + Tailwind
│       ├── src/
│       │   ├── pages/          # User, Technician, Admin views
│       │   ├── components/     # UI components (shadcn/ui + custom)
│       │   ├── contexts/       # AuthContext
│       │   └── i18n/           # Internationalization
│       └── plugins/            # Vite plugins kustom (visual editor, selection mode)
│
├── backend/                    # API Server — Node.js + Express
│   ├── src/
│   │   ├── routes/             # REST endpoints (auth, tickets, chats, users, ...)
│   │   ├── services/           # Business logic (TicketService, ChatService, ...)
│   │   ├── middleware/         # Auth, CSRF, validation, error handler
│   │   ├── socket/             # Socket.IO event handlers
│   │   └── utils/              # Logger, cache, metrics, Swagger, audit
│   └── scripts/                # Ops scripts: deploy, rollback, backup, SBOM, load test
│
└── .github/workflows/          # CI/CD pipelines
```

### Stack Teknologi

**Frontend**
- ⚛️ React 18 + Vite 7
- 🎨 Tailwind CSS + shadcn/ui + Radix UI
- 🗺️ React Router DOM v7
- 📡 Socket.IO Client
- 📊 Recharts
- 🌐 i18next (internasionalisasi)
- ✅ React Hook Form + Zod

**Backend**
- 🟢 Node.js 20 + Express 4
- 🗄️ MySQL 8 + Redis
- 🔌 Socket.IO
- 🔑 JWT + bcryptjs
- 📋 Winston (logging) + Prometheus (metrics)
- 📖 Swagger UI (API docs)
- 🐳 Docker

---

## 🚀 Instalasi

### Prasyarat

- **Node.js** `>= 18` (disarankan 20, lihat [`.nvmrc`](.nvmrc))
- **npm** `>= 9`
- **MySQL** `8+`
- **Redis** _(opsional — backend memiliki fallback jika tidak tersedia)_

### 1. Clone & Install

```bash
git clone https://github.com/USERNAME/projectpolda.git
cd projectpolda

# Install semua dependency (root + frontend + backend)
npm install
npm install --prefix apps/web
npm install --prefix backend
```

### 2. Setup Database

```bash
npm run db:setup --prefix backend
npm run db:migrate --prefix backend
```

### 3. Konfigurasi Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

Lihat bagian [⚙️ Konfigurasi](#️-konfigurasi) untuk detail variabel.

### 4. Jalankan

```bash
# Development — jalankan frontend & backend bersamaan
npm run dev
```

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:3000 |
| 🔌 Backend API | http://localhost:3001 |
| 📖 API Docs (Swagger) | http://localhost:3001/api-docs |
| 📊 Metrics | http://localhost:3001/api/health/metrics |

#### Jalankan Terpisah

```bash
# Frontend saja
npm run dev --prefix apps/web

# Backend saja
npm run dev --prefix backend
```

#### Menggunakan Docker

```bash
npm run docker:build --prefix backend
npm run docker:run --prefix backend
```

---

## ⚙️ Konfigurasi

Salin file contoh dan sesuaikan nilainya:

```bash
cp backend/.env.example backend/.env
```

| Variabel | Deskripsi |
|---|---|
| `DB_HOST` | Host MySQL |
| `DB_NAME` | Nama database |
| `DB_USER` / `DB_PASS` | Kredensial MySQL |
| `REDIS_URL` | URL Redis (opsional) |
| `JWT_SECRET` | Secret key JWT |
| `PORT` | Port backend (default `3001`) |

> **Staging?** Gunakan `backend/.env.staging.example` sebagai referensi.

---

## 🧪 Testing & Quality

```bash
# Lint frontend
npm run lint

# Unit test backend
npm run test --prefix backend

# Coverage report
npm run test:coverage --prefix backend

# Integration test
npm run test:integration --prefix backend

# Smoke test (post-deploy check)
npm run smoke:test --prefix backend

# Load test
npm run load:test --prefix backend
```

---

## 🔐 Keamanan

Pipeline keamanan terintegrasi dalam proses rilis:

```bash
# Audit dependency
npm run security:audit --prefix backend

# Generate Software Bill of Materials (SBOM)
npm run security:sbom --prefix backend

# Supply chain readiness check
npm run phase7:readiness --prefix backend
```

Middleware keamanan yang aktif:
- `helmet` — HTTP security headers
- `express-rate-limit` — rate limiting
- CSRF protection kustom
- JWT httpOnly cookie
- API versioning

---

## 📋 Operasional

```bash
# Health check
npm run health:check --prefix backend

# Metrics (Prometheus format)
npm run health:metrics --prefix backend

# Release readiness check
npm run release:readiness --prefix backend

# Deploy ke staging
npm run deploy:staging --prefix backend

# Rollback staging
npm run rollback:staging --prefix backend

# Backup database
npm run db:backup --prefix backend
```

---

## 🔄 CI/CD Pipeline

Pipeline GitHub Actions aktif pada branch `main` dan `develop`:

```
Push / PR
    │
    ▼
┌─────────────────┐
│  Lint + Test    │  ← ESLint, Jest (unit & integration)
└────────┬────────┘
         │ ✅
    ▼
┌─────────────────┐
│  Build & Push   │  ← Docker image → GitHub Container Registry
│  Docker Image   │
└────────┬────────┘
         │ ✅
    ▼
┌─────────────────┐
│ Release         │  ← Governance & supply chain check
│ Governance      │
└─────────────────┘
```

Workflow tersedia di [`.github/workflows/`](.github/workflows/).

---

## 👤 Role & Akses

| Role | Akses |
|---|---|
| **User** | Buat tiket, pantau status, chat dengan teknisi |
| **Teknisi** | Lihat antrian, ambil & kerjakan tiket, chat dengan user |
| **Admin** | Kelola semua tiket, user, teknisi, log aktivitas, pengaturan sistem |

---

## 📁 Struktur Halaman

<details>
<summary>Klik untuk expand</summary>

```
User
├── /user/dashboard         — Dashboard ringkasan tiket
├── /user/tickets           — Daftar tiket saya
├── /user/tickets/create    — Buat tiket baru
├── /user/tickets/:id       — Detail tiket
├── /user/chats             — Daftar chat
├── /user/chats/:id         — Chat detail
└── /user/settings          — Pengaturan akun

Teknisi
├── /technician/dashboard   — Dashboard teknisi
├── /technician/queue       — Antrian tiket masuk
├── /technician/tickets     — Tiket yang dikerjakan
├── /technician/chats       — Chat dengan user
└── /technician/settings    — Pengaturan akun

Admin
├── /admin/dashboard        — Overview sistem
├── /admin/tickets          — Semua tiket
├── /admin/tickets/history  — Riwayat tiket
├── /admin/users            — Manajemen user
├── /admin/technicians      — Manajemen teknisi
├── /admin/chats            — Monitoring chat
├── /admin/logs             — Activity logs
└── /admin/settings         — Pengaturan sistem
```

</details>

---

## 📖 Dokumentasi

Dokumentasi teknis dan fase implementasi tersimpan di [`documentations/`](documentations/).

API docs tersedia saat server berjalan di: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

---

## 🤝 Kontribusi

1. Fork repositori ini
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feat/nama-fitur`
5. Buka Pull Request ke branch `develop`

---

<div align="center">

Dibangun untuk **Polda Kalimantan Selatan** — Bidang Teknologi Informasi

</div>
