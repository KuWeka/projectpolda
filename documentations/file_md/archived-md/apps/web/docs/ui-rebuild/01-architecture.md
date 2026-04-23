# UI Rebuild Architecture (From Zero)

Tanggal: 2026-04-18
Scope: Rebuild full presentation layer menggunakan pola komponen dari shadcn docs, tanpa mengubah business logic backend/API.

## 1. Tujuan
- Membangun ulang layer UI secara total (visual, layout, component system).
- Menjaga alur bisnis tetap berjalan: auth, routing, role-based access, API contract.
- Menstandarkan desain agar konsisten, scalable, dan mudah di-maintain.

## 2. Non-Goal
- Tidak mengubah kontrak API backend.
- Tidak mengubah skema database.
- Tidak menambah fitur bisnis baru pada fase rebuild UI.

## 3. Prinsip Arsitektur
- Logic tetap, presentasi diganti.
- UI primitive hanya dari komponen basis shadcn yang ada di src/components/ui.
- Theme berbasis CSS variables (HSL) agar mudah rebrand.
- Setiap page dibangun dari composition layout + section + UI primitive.

## 4. Layering Frontend
1. Core Layer
- src/lib (utils, formatter, helper)
- src/hooks (hook reusable)
- src/contexts (state global, auth)

2. UI Primitive Layer
- src/components/ui (button, input, dialog, tabs, table, toast, dsb)
- Tidak menaruh logic domain di layer ini.

3. Domain Component Layer
- src/components/<domain>
- Contoh: components/tickets, components/chat, components/dashboard

4. Page Layer
- src/pages/*
- Page hanya orchestration data + compose domain component.

5. App Shell Layer
- main layout, sidebar, header, breadcrumb, role switch context.

## 5. Design Token Strategy
Sumber token: CSS variables di root + dark class.

Token minimum:
- Surface: --background, --foreground, --card, --popover
- Brand: --primary, --secondary, --accent
- Feedback: --destructive, --warning, --success, --info
- UI: --border, --input, --ring, --radius
- Sidebar: --sidebar-* (khusus shell)

Kebijakan:
- Semua warna komponen harus lewat token, bukan hardcoded hex.
- Tidak ada class warna yang langsung mengunci brand lama.

## 6. Accessibility Baseline
- Kontras teks minimum WCAG AA.
- Focus state jelas (ring tokenized).
- Semua icon button wajib ada aria-label.
- Form field wajib punya label dan error message terhubung.

## 7. Routing and Role Safety
- Struktur role route dipertahankan:
  - /user/*
  - /technician/*
  - /admin/*
- ProtectedRoute tidak diubah perilakunya.
- Rebuild hanya mengganti page view + component composition.

## 8. Delivery Model
- Incremental cutover per domain page.
- Feature flag opsional per route bila perlu rollback cepat.
- Setiap cutover wajib smoke test role-based flow.

## 9. Definition of Done (Per Page)
- Visual sesuai design direction baru.
- Semua state ter-handle: loading, empty, error, success.
- Responsive: mobile, tablet, desktop.
- A11y baseline lulus.
- Tidak ada regresi API behavior.
