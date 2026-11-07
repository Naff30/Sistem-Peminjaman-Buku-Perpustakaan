# Perpustakaan — Sistem Peminjaman Buku

Aplikasi web sederhana untuk mengelola data buku, peminjaman, dan pengembalian
buku perpustakaan. Dibuat dengan **React 19**, **Tailwind CSS v4**, dan
**JavaScript**, dijalankan dengan **Vite**. Data disimpan di **localStorage**
sehingga tetap ada meskipun halaman di-refresh.

## Cara Menjalankan

Prasyarat: Node.js 18+ (atau Bun).

```bash
npm install      # pasang dependensi
npm run dev      # jalankan di http://localhost:5173
npm run build    # build produksi ke folder dist/
npm run preview  # coba hasil build
npm test         # jalankan unit test logika aplikasi
```

## Struktur Folder

```
perpustakaan/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx            # Menu navigasi kiri (drawer di HP)
│   │   ├── Dashboard.jsx          # Statistik & transaksi terbaru
│   │   ├── BookList.jsx           # Daftar, cari, tambah, edit, hapus buku
│   │   ├── BookForm.jsx           # Modal form tambah/edit buku
│   │   ├── BorrowBook.jsx         # Form peminjaman buku
│   │   ├── ReturnBook.jsx         # Daftar dipinjam & proses pengembalian
│   │   ├── TransactionHistory.jsx # Riwayat + pencarian + filter status
│   │   ├── Layout.jsx             # Kerangka halaman (sidebar + header)
│   │   ├── Modal.jsx              # Komponen modal yang dipakai ulang
│   │   └── StatusBadge.jsx        # Label status transaksi & stok
│   ├── context/
│   │   └── LibraryContext.jsx     # State global + sinkron localStorage + notifikasi
│   ├── lib/
│   │   ├── library.js             # Logika inti & validasi (fungsi murni)
│   │   └── library.test.js        # Unit test (Vitest)
│   ├── App.jsx                    # Navigasi antar halaman
│   ├── main.jsx                   # Titik masuk React
│   └── index.css                  # Tailwind + design token (biru & putih)
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Fitur

| Halaman | Fitur |
| --- | --- |
| **Dashboard** | Total koleksi, buku dipinjam, buku tersedia, total transaksi, transaksi terbaru, stok menipis, tombol reset ke data contoh |
| **Data Buku** | Tambah, edit, hapus (dengan konfirmasi), daftar dalam tabel, cari berdasarkan judul/penulis |
| **Peminjaman** | Nama peminjam, judul buku, tanggal pinjam, tanggal kembali; stok otomatis berkurang |
| **Pengembalian** | Daftar buku yang sedang dipinjam, tombol *Kembalikan*, status menjadi "Dikembalikan", stok otomatis bertambah |
| **Riwayat Transaksi** | Semua transaksi, pencarian (nama/judul/ID), filter status: Dipinjam, Terlambat, Dikembalikan |

## Aturan & Validasi

- Semua kolom form wajib diisi.
- **Stok tidak boleh negatif**, harus angka bulat (maks. 10.000).
- **Buku duplikat ditolak**: ID yang sama, atau judul + penulis yang sama (tidak peka huruf besar/kecil & spasi).
- Tahun terbit harus antara 1000 dan tahun sekarang.
- **Peminjaman ditolak jika stok habis**; buku stok 0 tidak bisa dipilih.
- Tanggal pengembalian tidak boleh sebelum tanggal peminjaman.
- Peminjam yang sama tidak bisa meminjam judul yang sama dua kali sebelum dikembalikan.
- **Pengembalian dua kali dicegah** (termasuk klik ganda cepat).
- Buku yang masih dipinjam tidak dapat dihapus.
- Data localStorage yang rusak otomatis diganti dengan data contoh.
- Setiap proses menampilkan notifikasi **berhasil** (hijau) atau **gagal** (merah).

## Penyimpanan Data

Data disimpan di localStorage browser dengan kunci:

- `perpustakaan:books` — daftar buku
- `perpustakaan:transactions` — daftar transaksi

Saat pertama kali dibuka, aplikasi memuat 10 buku contoh dan 3 transaksi contoh.
Gunakan tombol **Reset ke data contoh** di Dashboard untuk mengulang.

## Skenario Uji Cepat

1. **Data Buku → Tambah Buku**, klik *Tambah Buku* dengan form kosong → muncul pesan wajib diisi.
2. Isi judul "Laskar Pelangi" & penulis "Andrea Hirata" → ditolak sebagai duplikat.
3. Isi stok `-1` → ditolak "Jumlah stok tidak boleh negatif".
4. Tambah buku baru dengan stok 1 → **Peminjaman**, pinjam buku tersebut → stok menjadi 0 dan tombolnya berubah menjadi "Stok habis".
5. **Pengembalian** → *Kembalikan* → stok kembali 1, status di **Riwayat** menjadi "Dikembalikan".
6. Refresh halaman → semua data tetap ada.
