# Website HIMAFOR

Website Himpunan Mahasiswa Informatika (HIMAFOR) UIN Siber Syekh Nurjati Cirebon.
Proyek MPPL Kelompok 2.

- **Frontend:** React (Vite), folder `frontend/`
- **Backend:** Node.js (Express), folder `backend/`
- **Database:** MySQL (TiDB Cloud)

## Kesepakatan Git Kelompok

Berlaku mulai Pertemuan 11 sampai akhir Sprint 4.

### 1. Strategi branching: Feature branch

- Branch `main` selalu berisi kode yang sudah direview dan siap berjalan.
- Dilarang commit langsung ke `main`.
- Setiap card di board dikerjakan di satu cabang sendiri, dibuat dari `main` terbaru.
- Pekerjaan masuk ke `main` hanya lewat pull request.

### 2. Format nama cabang

```
feat/<nomor-card>-<deskripsi-singkat>
fix/<nomor-card>-<deskripsi-singkat>
```

Huruf kecil, kata dipisah tanda hubung.

Contoh: `feat/12-filter-tanggal`, `fix/27-login-gagal-email-kosong`

### 3. Format pesan commit

```
<awalan>(#<nomor-card>): <deskripsi singkat>
```

| Awalan | Dipakai untuk |
|---|---|
| `feat` | Menambah kemampuan baru yang dilihat pengguna |
| `fix` | Memperbaiki defect |
| `docs` | Mengubah dokumentasi atau README |
| `test` | Menambah atau memperbaiki pengujian |
| `refactor` | Merapikan kode tanpa mengubah perilakunya |
| `chore` | Pekerjaan penunjang: dependensi, konfigurasi, pipeline |

Contoh: `feat(#12): tambah filter tanggal pada daftar transaksi`

Commit kecil dan sering. Pesan seperti `.` atau `update` tidak dipakai.

### 4. Aturan pull request

- Setiap pull request butuh **1 persetujuan** dari anggota lain.
- **Developer yang menulis kodenya tidak boleh menyetujui** pull request-nya sendiri.
- Judul pull request memuat nomor dan judul card.
- Reviewer membaca perubahan, bukan hanya menekan Approve. Temuan ditulis sebagai komentar di pull request.
- Pull request yang menunggu lebih dari satu hari dibahas di daily standup.
- Setelah disetujui, pull request digabung ke `main`, lalu cabangnya dihapus.

### 5. GitHub Actions

- Penanggung jawab: **Dimas Faturohman**
- Tenggat: [isi tanggal]
- Statusnya dicatat di card board.

### 6. Tag baseline

| Tag | Menandai |
|---|---|
| `v0.3-sprint3` | Kondisi akhir Sprint 3 |
| `v0.4-sprint4` | Kondisi akhir Sprint 4 |

Tag dibuat dengan:

```bash
git tag -a v0.4-sprint4 -m "Baseline akhir Sprint 4"
git push origin v0.4-sprint4
```
