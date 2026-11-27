# Seno Magang Portal

Aplikasi web untuk Kapten mengelola lamaran magang dari eksplorasi lowongan sampai dapat offer.
Praktikum Pemrograman Web Modul 5 (React 19 + TypeScript + Vite), tampilan "SENO" dari desain Figma.

## Menjalankan

```bash
npm install
npm run dev        # buka http://localhost:5173
npx tsc --noEmit   # cek tipe
npm run build      # build produksi
npm run lint       # oxlint
```

Login: buat akun lewat tile `> Daftar`, atau klik "coba demo tanpa akun" untuk langsung memakai data contoh.

## Pembagian tugas

| Anggota | Bagian | File utama |
| --- | --- | --- |
| Marvel | Setup project, service Remotive + fallback, `useDebounce`, Profil Skill, Eksplorasi Lowongan, Form tambah lamaran, filter & sort War Room | `services/jobService.ts`, `hooks/useDebounce.ts`, `components/SkillProfile.tsx`, `components/JobExplorer.tsx`, `components/ApplicationForm.tsx`, filter/sort di `pages/WarRoomPage.tsx` |
| Al | Tipe data, `useLocalStorage`, state machine, validasi, ghosting, cek bentrok, logika undo | `types/`, `hooks/useLocalStorage.ts`, `hooks/useUndoDelete.ts`, `utils/stateMachine.ts`, `utils/application.ts`, `utils/ghosting.ts`, `utils/interviewConflict.ts` |
| Sakti | UI/UX dan layout SENO, Interview Timer, toast Undo, dashboard statistik, Offer Comparator, login, fitur bonus | `components/seno/`, `pages/`, `components/seno/InterviewTimer.tsx`, `utils/dashboardStats.ts`, `utils/offerScore.ts`, `styles/seno.css` |

## Di mana fitur ada

| Fitur soal | Lokasi |
| --- | --- |
| 1. Profil Skill & Eksplorasi Lowongan (fetch + AbortController, loading/error/kosong, debounce 400 ms, filter kategori, sort match, badge warna, Sudah Dilamar) | Halaman Eksplorasi (klik logo SENO): `components/JobExplorer.tsx`, `components/SkillProfile.tsx` |
| 2. Form tambah lamaran (controlled, input APPLIED kondisional, anti-duplikat, fokus ke input error via `useRef`) | War Room > `+ Tambah lamaran`: `components/ApplicationForm.tsx` |
| 3. War Room (filter gabungan, sort, Simulasi +15 Hari, banner bentrok) | `pages/WarRoomPage.tsx`, `components/seno/ConflictTile.tsx` |
| 4. Detail lamaran (transisi status sah, input kondisional, checklist immutable, activity log + catatan) | `pages/DetailPage.tsx` memakai `utils/stateMachine.ts` |
| 5. Interview Prep Timer (5 soal, 02:00, Start/Pause/Reset/Lanjut, cleanup `clearInterval`) | Detail > `Buka latihan interview`: `components/seno/InterviewTimer.tsx` |
| 6. Undo Delete 5 detik + localStorage | `hooks/useUndoDelete.ts`, `components/seno/Popups.tsx` (`UndoToast`), `hooks/useLocalStorage.ts` |
| 7. 5 kartu statistik + Offer Comparator | Kiri War Room (`utils/dashboardStats.ts`), halaman Compare-Offer (`pages/OfferPage.tsx`, `utils/offerScore.ts`) |

Bonus: Export/Import JSON dan mode gelap (halaman Profil), shortcut `/` ke kolom cari War Room, halaman Agenda + unduh `.ics`, login lokal (password disimpan sebagai hash SHA-256), pagination tile.

## Catatan teknis

- Tanpa library state/form. Semua state memakai hooks bawaan dan custom hooks (`useLocalStorage`, `useDebounce`, `useUndoDelete`, `useAuth`, `useCursorLight`).
- Data setiap akun disimpan terpisah di localStorage (`<username>:applications`, `<username>:kaptenSkills`).
- Tile background digambar sekali ke `<canvas>` (`components/seno/TileCanvas.tsx`) supaya tidak lag; efek mouse hanya memakai `transform`.

## Catatan Remotive API

Remotive kadang lambat dan memblokir request yang lebih sering dari 2x per menit. Supaya tetap stabil, `services/jobService.ts`:

- menyimpan hasil di localStorage (`remotiveCache`). Selama 30 menit data ini dipakai langsung tanpa request.
- memakai satu request bersama untuk semua komponen (StrictMode dan pindah halaman tidak membuat request baru).
- menjaga maksimal 2 request per menit (`remotiveHits`). Kalau jatah habis, layar Memuat menampilkan hitung mundur.
- mencoba ulang sampai 3 kali (timeout 20 detik). Kalau gagal karena jaringan/CORS, percobaan berikutnya lewat proxy Vite `/remotive-api` (ada saat `npm run dev` dan `npm run preview`).
- kalau semua gagal, memakai data Remotive terakhir yang berhasil (maksimal 7 hari) dan tile Sumber Data menulis "data tersimpan".
- kalau tidak ada data tersimpan atau sedang offline, menampilkan error dengan tombol "Coba Lagi" dan "Pakai Data Lokal". Data lokal ada di `public/magang-fallback.json` (60 lowongan).
