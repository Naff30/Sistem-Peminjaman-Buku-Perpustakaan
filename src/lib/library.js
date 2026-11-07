/**
 * Logika inti Sistem Peminjaman Buku Perpustakaan.
 *
 * Semua fungsi di file ini bersifat "murni" (tidak mengubah data asli dan
 * tidak menyentuh localStorage secara langsung) sehingga mudah diuji.
 * Setiap aksi mengembalikan objek hasil:
 *   { ok: true,  message, books?, transactions? }
 *   { ok: false, message, errors? }
 */

export const STORAGE_KEYS = {
  books: "perpustakaan:books",
  transactions: "perpustakaan:transactions",
};

export const STATUS = {
  BORROWED: "Dipinjam",
  RETURNED: "Dikembalikan",
};

export const CATEGORIES = [
  "Novel",
  "Sains",
  "Teknologi",
  "Sejarah",
  "Pendidikan",
  "Pengembangan Diri",
  "Biografi",
  "Agama",
  "Anak-anak",
  "Lainnya",
];

export const MAX_STOCK = 10000;
export const MIN_YEAR = 1000;

/* ------------------------------------------------------------------ */
/* Utilitas tanggal                                                    */
/* ------------------------------------------------------------------ */

/** Mengubah objek Date menjadi string "YYYY-MM-DD" (waktu lokal). */
export function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Memeriksa apakah string berformat "YYYY-MM-DD" dan merupakan tanggal yang benar. */
export function isValidDateISO(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Menambah (atau mengurangi) sejumlah hari pada tanggal ISO. */
export function addDaysISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  return todayISO(new Date(y, m - 1, d + days));
}

/** Selisih hari antara dua tanggal ISO (to - from). */
export function diffDays(fromISO, toISO) {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  const ms = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
  return Math.round(ms / 86400000);
}

/** Format tanggal untuk tampilan, contoh: "7 Nov 2026". */
export function formatDate(iso) {
  if (!iso) return "-";
  if (!isValidDateISO(iso)) return String(iso);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Utilitas umum                                                       */
/* ------------------------------------------------------------------ */

export function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function sameText(a, b) {
  return normalizeText(a).toLowerCase() === normalizeText(b).toLowerCase();
}

/** Parse angka bulat dari input form (string). */
function parseWholeNumber(value) {
  const text = String(value ?? "").trim();
  if (text === "") return { empty: true };
  if (!/^-?\d+$/.test(text)) return { invalid: true };
  return { value: Number(text) };
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/** Membuat ID buku berikutnya, contoh: BK011. */
export function generateBookId(books) {
  const max = books.reduce((acc, book) => {
    const match = /^BK(\d+)$/i.exec(book.id);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `BK${String(max + 1).padStart(3, "0")}`;
}

/** Membuat ID transaksi berikutnya, contoh: TRX0004. */
export function generateTransactionId(transactions) {
  const max = transactions.reduce((acc, tx) => {
    const match = /^TRX(\d+)$/i.exec(tx.id);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `TRX${String(max + 1).padStart(4, "0")}`;
}

export function isOverdue(tx, today = todayISO()) {
  return tx.status === STATUS.BORROWED && tx.dueDate < today;
}

/* ------------------------------------------------------------------ */
/* Data buku                                                           */
/* ------------------------------------------------------------------ */

/**
 * Validasi data buku.
 * @param input       data mentah dari form
 * @param books       daftar buku saat ini
 * @param originalId  ID buku yang sedang diedit (null jika tambah baru)
 */
export function validateBook(input, books, originalId = null) {
  const currentYear = new Date().getFullYear();
  const errors = {};
  const value = {
    id: normalizeText(input?.id).toUpperCase(),
    title: normalizeText(input?.title),
    author: normalizeText(input?.author),
    category: normalizeText(input?.category),
    year: null,
    stock: null,
  };

  // ID buku
  if (!value.id) errors.id = "ID buku wajib diisi.";
  else if (!/^[A-Z0-9-]{3,20}$/.test(value.id))
    errors.id = "ID hanya boleh berisi huruf, angka, atau tanda hubung (3–20 karakter).";
  else if (books.some((b) => b.id.toUpperCase() === value.id && b.id.toUpperCase() !== (originalId ?? "").toUpperCase()))
    errors.id = `ID buku "${value.id}" sudah digunakan.`;

  // Judul
  if (!value.title) errors.title = "Judul buku wajib diisi.";
  else if (value.title.length > 150) errors.title = "Judul buku maksimal 150 karakter.";

  // Penulis
  if (!value.author) errors.author = "Nama penulis wajib diisi.";
  else if (value.author.length > 100) errors.author = "Nama penulis maksimal 100 karakter.";
  else if (!/\p{L}/u.test(value.author)) errors.author = "Nama penulis tidak valid.";

  // Kategori
  if (!value.category) errors.category = "Kategori wajib dipilih.";

  // Tahun terbit
  const year = parseWholeNumber(input?.year);
  if (year.empty) errors.year = "Tahun terbit wajib diisi.";
  else if (year.invalid) errors.year = "Tahun terbit harus berupa angka bulat.";
  else if (year.value < MIN_YEAR || year.value > currentYear)
    errors.year = `Tahun terbit harus antara ${MIN_YEAR} dan ${currentYear}.`;
  else value.year = year.value;

  // Stok
  const stock = parseWholeNumber(input?.stock);
  if (stock.empty) errors.stock = "Jumlah stok wajib diisi.";
  else if (stock.invalid) errors.stock = "Jumlah stok harus berupa angka bulat.";
  else if (stock.value < 0) errors.stock = "Jumlah stok tidak boleh negatif.";
  else if (stock.value > MAX_STOCK) errors.stock = `Jumlah stok maksimal ${MAX_STOCK}.`;
  else value.stock = stock.value;

  // Duplikat (judul + penulis sama)
  if (
    !errors.title &&
    !errors.author &&
    books.some(
      (b) => b.id !== originalId && sameText(b.title, value.title) && sameText(b.author, value.author),
    )
  ) {
    errors.title = "Buku dengan judul dan penulis yang sama sudah terdaftar.";
  }

  return { valid: !hasErrors(errors), errors, value };
}

export function addBook(books, input) {
  const { valid, errors, value } = validateBook(input, books);
  if (!valid) {
    return { ok: false, errors, message: "Gagal menambahkan buku. Periksa kembali isian form." };
  }
  return {
    ok: true,
    books: [...books, value],
    message: `Buku "${value.title}" berhasil ditambahkan.`,
  };
}

export function updateBook(books, originalId, input) {
  const existing = books.find((b) => b.id === originalId);
  if (!existing) return { ok: false, message: "Buku tidak ditemukan." };

  // ID buku tidak boleh diubah agar riwayat transaksi tetap terhubung.
  const { valid, errors, value } = validateBook({ ...input, id: originalId }, books, originalId);
  if (!valid) {
    return { ok: false, errors, message: "Gagal menyimpan perubahan. Periksa kembali isian form." };
  }
  return {
    ok: true,
    books: books.map((b) => (b.id === originalId ? { ...value, id: originalId } : b)),
    message: `Data buku "${value.title}" berhasil diperbarui.`,
  };
}

export function deleteBook(books, transactions, id) {
  const book = books.find((b) => b.id === id);
  if (!book) return { ok: false, message: "Buku tidak ditemukan atau sudah dihapus." };

  const activeLoans = transactions.filter((t) => t.bookId === id && t.status === STATUS.BORROWED);
  if (activeLoans.length > 0) {
    return {
      ok: false,
      message: `Buku "${book.title}" tidak dapat dihapus karena masih dipinjam (${activeLoans.length} peminjaman aktif).`,
    };
  }
  return {
    ok: true,
    books: books.filter((b) => b.id !== id),
    message: `Buku "${book.title}" berhasil dihapus.`,
  };
}

/* ------------------------------------------------------------------ */
/* Peminjaman                                                          */
/* ------------------------------------------------------------------ */

export function validateBorrow(input, books, transactions) {
  const errors = {};
  const value = {
    borrowerName: normalizeText(input?.borrowerName),
    bookId: normalizeText(input?.bookId),
    borrowDate: normalizeText(input?.borrowDate),
    dueDate: normalizeText(input?.dueDate),
  };

  if (!value.borrowerName) errors.borrowerName = "Nama peminjam wajib diisi.";
  else if (value.borrowerName.length < 3) errors.borrowerName = "Nama peminjam minimal 3 karakter.";
  else if (value.borrowerName.length > 100) errors.borrowerName = "Nama peminjam maksimal 100 karakter.";
  else if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(value.borrowerName))
    errors.borrowerName = "Nama hanya boleh berisi huruf, spasi, titik, apostrof, atau tanda hubung.";

  const book = books.find((b) => b.id === value.bookId);
  if (!value.bookId) errors.bookId = "Judul buku wajib dipilih.";
  else if (!book) errors.bookId = "Buku tidak ditemukan.";
  else if (book.stock <= 0) errors.bookId = `Stok buku "${book.title}" habis. Buku tidak dapat dipinjam.`;
  else if (
    !errors.borrowerName &&
    transactions.some(
      (t) =>
        t.status === STATUS.BORROWED &&
        t.bookId === book.id &&
        sameText(t.borrowerName, value.borrowerName),
    )
  ) {
    errors.bookId = `${value.borrowerName} masih meminjam buku ini dan belum mengembalikannya.`;
  }

  if (!value.borrowDate) errors.borrowDate = "Tanggal peminjaman wajib diisi.";
  else if (!isValidDateISO(value.borrowDate)) errors.borrowDate = "Tanggal peminjaman tidak valid.";

  if (!value.dueDate) errors.dueDate = "Tanggal pengembalian wajib diisi.";
  else if (!isValidDateISO(value.dueDate)) errors.dueDate = "Tanggal pengembalian tidak valid.";
  else if (!errors.borrowDate && value.dueDate < value.borrowDate)
    errors.dueDate = "Tanggal pengembalian tidak boleh sebelum tanggal peminjaman.";

  return { valid: !hasErrors(errors), errors, value, book };
}

export function borrowBook(books, transactions, input) {
  const { valid, errors, value, book } = validateBorrow(input, books, transactions);
  if (!valid) {
    const message = errors.bookId?.includes("habis")
      ? errors.bookId
      : "Peminjaman gagal. Periksa kembali isian form.";
    return { ok: false, errors, message };
  }

  const transaction = {
    id: generateTransactionId(transactions),
    borrowerName: value.borrowerName,
    bookId: book.id,
    bookTitle: book.title,
    borrowDate: value.borrowDate,
    dueDate: value.dueDate,
    returnDate: null,
    status: STATUS.BORROWED,
  };

  return {
    ok: true,
    transaction,
    books: books.map((b) => (b.id === book.id ? { ...b, stock: b.stock - 1 } : b)),
    transactions: [...transactions, transaction],
    message: `"${book.title}" berhasil dipinjam oleh ${value.borrowerName}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Pengembalian                                                        */
/* ------------------------------------------------------------------ */

export function returnBook(books, transactions, transactionId, returnDate = todayISO()) {
  const tx = transactions.find((t) => t.id === transactionId);
  if (!tx) return { ok: false, message: "Transaksi peminjaman tidak ditemukan." };

  if (tx.status === STATUS.RETURNED) {
    return {
      ok: false,
      message: `Buku "${tx.bookTitle}" sudah dikembalikan pada ${formatDate(tx.returnDate)}. Pengembalian tidak dapat diproses dua kali.`,
    };
  }

  if (!isValidDateISO(returnDate)) {
    return { ok: false, message: "Tanggal pengembalian tidak valid." };
  }
  if (returnDate < tx.borrowDate) {
    return { ok: false, message: "Tanggal pengembalian tidak boleh sebelum tanggal peminjaman." };
  }

  return {
    ok: true,
    books: books.map((b) => (b.id === tx.bookId ? { ...b, stock: b.stock + 1 } : b)),
    transactions: transactions.map((t) =>
      t.id === transactionId ? { ...t, status: STATUS.RETURNED, returnDate } : t,
    ),
    message: `Buku "${tx.bookTitle}" dari ${tx.borrowerName} berhasil dikembalikan.`,
  };
}

/* ------------------------------------------------------------------ */
/* Statistik dashboard                                                 */
/* ------------------------------------------------------------------ */

export function computeStats(books, transactions, today = todayISO()) {
  const available = books.reduce((sum, b) => sum + b.stock, 0);
  const borrowed = transactions.filter((t) => t.status === STATUS.BORROWED).length;
  return {
    titles: books.length,
    available,
    borrowed,
    totalCollection: available + borrowed,
    totalTransactions: transactions.length,
    returned: transactions.filter((t) => t.status === STATUS.RETURNED).length,
    overdue: transactions.filter((t) => isOverdue(t, today)).length,
  };
}

/* ------------------------------------------------------------------ */
/* Data contoh & penyimpanan                                           */
/* ------------------------------------------------------------------ */

/** Data contoh yang dimuat saat aplikasi pertama kali dibuka. */
export function createSampleData(today = todayISO()) {
  const books = [
    { id: "BK001", title: "Laskar Pelangi", author: "Andrea Hirata", category: "Novel", year: 2005, stock: 4 },
    { id: "BK002", title: "Bumi Manusia", author: "Pramoedya Ananta Toer", category: "Novel", year: 1980, stock: 3 },
    { id: "BK003", title: "Filosofi Teras", author: "Henry Manampiring", category: "Pengembangan Diri", year: 2018, stock: 4 },
    { id: "BK004", title: "Sapiens: Riwayat Singkat Umat Manusia", author: "Yuval Noah Harari", category: "Sejarah", year: 2017, stock: 1 },
    { id: "BK005", title: "Clean Code", author: "Robert C. Martin", category: "Teknologi", year: 2008, stock: 3 },
    { id: "BK006", title: "Negeri 5 Menara", author: "Ahmad Fuadi", category: "Novel", year: 2009, stock: 4 },
    { id: "BK007", title: "Sejarah Indonesia Modern", author: "M.C. Ricklefs", category: "Sejarah", year: 2008, stock: 2 },
    { id: "BK008", title: "Cantik Itu Luka", author: "Eka Kurniawan", category: "Novel", year: 2002, stock: 0 },
    { id: "BK009", title: "A Brief History of Time", author: "Stephen Hawking", category: "Sains", year: 1988, stock: 3 },
    { id: "BK010", title: "Atomic Habits", author: "James Clear", category: "Pengembangan Diri", year: 2018, stock: 5 },
  ];

  const transactions = [
    {
      id: "TRX0001",
      borrowerName: "Budi Santoso",
      bookId: "BK006",
      bookTitle: "Negeri 5 Menara",
      borrowDate: addDaysISO(today, -14),
      dueDate: addDaysISO(today, -7),
      returnDate: addDaysISO(today, -8),
      status: STATUS.RETURNED,
    },
    {
      id: "TRX0002",
      borrowerName: "Dewi Lestari",
      bookId: "BK004",
      bookTitle: "Sapiens: Riwayat Singkat Umat Manusia",
      borrowDate: addDaysISO(today, -10),
      dueDate: addDaysISO(today, -3),
      returnDate: null,
      status: STATUS.BORROWED,
    },
    {
      id: "TRX0003",
      borrowerName: "Siti Rahmawati",
      bookId: "BK001",
      bookTitle: "Laskar Pelangi",
      borrowDate: addDaysISO(today, -2),
      dueDate: addDaysISO(today, 5),
      returnDate: null,
      status: STATUS.BORROWED,
    },
  ];

  return { books, transactions };
}

function isBookShape(b) {
  return (
    b &&
    typeof b.id === "string" &&
    typeof b.title === "string" &&
    typeof b.author === "string" &&
    Number.isInteger(b.stock) &&
    b.stock >= 0
  );
}

function isTransactionShape(t) {
  return (
    t &&
    typeof t.id === "string" &&
    typeof t.bookId === "string" &&
    typeof t.borrowerName === "string" &&
    (t.status === STATUS.BORROWED || t.status === STATUS.RETURNED)
  );
}

/**
 * Membaca data dari localStorage. Jika belum ada data, memuat data contoh.
 * Jika data rusak, memuat ulang data contoh dan mengembalikan pesan error.
 */
export function loadFromStorage(storage, today = todayISO()) {
  try {
    const rawBooks = storage.getItem(STORAGE_KEYS.books);
    const rawTransactions = storage.getItem(STORAGE_KEYS.transactions);
    if (rawBooks === null && rawTransactions === null) {
      return { ...createSampleData(today), seeded: true };
    }
    const books = JSON.parse(rawBooks ?? "[]");
    const transactions = JSON.parse(rawTransactions ?? "[]");
    if (!Array.isArray(books) || !Array.isArray(transactions)) throw new Error("Format data salah");
    return {
      books: books.filter(isBookShape),
      transactions: transactions.filter(isTransactionShape),
      seeded: false,
    };
  } catch {
    return {
      ...createSampleData(today),
      seeded: true,
      error: "Data tersimpan rusak sehingga aplikasi memuat ulang data contoh.",
    };
  }
}

export function saveToStorage(storage, books, transactions) {
  storage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
  storage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}
