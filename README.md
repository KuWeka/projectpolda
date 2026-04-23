# HelpdeskPolda

Sistem Helpdesk IT berbasis monorepo untuk manajemen tiket, assignment teknisi, chat real-time, observability, dan readiness operasional.

## Ringkasan

Project ini terdiri dari:

- Frontend web app (React + Vite)
- Backend API (Node.js + Express + MySQL + Redis + Socket.IO)
- Dokumentasi teknis dan fase implementasi

## Struktur Proyek

```text
projectpolda/
	apps/
		web/                 # Frontend (Vite + React)
	backend/               # API server, scripts ops, tests
	documentations/        # Dokumentasi project
	package.json           # Script root monorepo
```

## Prasyarat

- Node.js 18+
- npm 9+
- MySQL 8+
- Redis (opsional, backend punya fallback jika tidak tersedia)

## Instalasi

Install dependency root, frontend, dan backend:

```bash
npm install
npm install --prefix apps/web
npm install --prefix backend
```

## Menjalankan Project

### Mode development (web + backend bersamaan)

```bash
npm run dev
```

Default:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Menjalankan service terpisah

Frontend:

```bash
npm run dev --prefix apps/web
```

Backend:

```bash
npm run dev --prefix backend
```

## Build dan Start

Build frontend:

```bash
npm run build
```

Start backend:

```bash
npm run start
```

## Testing dan Lint

Lint frontend dari root:

```bash
npm run lint
```

Test backend:

```bash
npm run test --prefix backend
```

Coverage backend:

```bash
npm run test:coverage --prefix backend
```

## Konfigurasi Environment

Gunakan file contoh environment di backend:

- `backend/.env.example`
- `backend/.env.staging.example`

Salin ke `.env` sesuai environment lokal/staging dan isi variabel yang diperlukan.

## Operasional dan Security (Backend)

Beberapa script penting:

- `npm run smoke:test --prefix backend`
- `npm run release:readiness --prefix backend`
- `npm run security:sbom --prefix backend`
- `npm run phase7:readiness --prefix backend`

## Dokumentasi

Dokumentasi hasil kerja tersimpan terpusat di:

- `documentations/file_md/`

## Catatan

- Root workspace memakai script orkestrasi monorepo.
- Backend memiliki script deploy/rollback staging dan tooling monitoring.