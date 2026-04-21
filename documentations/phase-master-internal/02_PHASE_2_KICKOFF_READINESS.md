# Fase 2 - Kickoff Readiness

Tanggal dibuat: 2026-04-20
Status: In Progress

## Tujuan Fase 2

Meningkatkan kualitas integrasi frontend-backend dengan fokus pada kontrak API alur kritikal.

## Scope Fase 2

1. Sinkronisasi kontrak request/response endpoint kritikal.
2. Penambahan integration test untuk auth, tickets, chats, uploads.
3. Standardisasi error response agar konsisten lintas endpoint.

## Entry Checklist dari Fase 1

- [x] Gate teknis pass.
- [ ] UAT lintas role selesai.
- [ ] 0 blocker tersisa.
- [ ] 0 high tersisa.
- [ ] Go/No-Go menyatakan GO.

## Draft Endpoint Prioritas Kontrak

1. POST /api/auth/login
2. POST /api/auth/refresh
3. POST /api/tickets
4. GET /api/tickets/:id
5. PATCH /api/tickets/:id/status
6. POST /api/uploads/ticket/:ticketId
7. GET /api/chats
8. GET /api/messages
9. POST /api/messages

## Deliverable Minimum Fase 2

1. Dokumen matriks kontrak endpoint kritikal. (Done: baseline)
2. Integration tests minimal untuk jalur auth/tickets/chats/uploads. (In Progress)
3. Daftar mismatch kontrak yang sudah ditutup.
4. Laporan hasil pengujian regresi jalur kritikal.

## Progress Baseline

1. Baseline matriks kontrak sudah tersedia.
2. Baseline integration contract tests auth/health sudah pass.
3. Tahap berikutnya adalah ekspansi test kontrak ke tickets/chats/messages/uploads.
