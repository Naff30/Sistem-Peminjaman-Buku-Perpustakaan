import { describe, expect, it } from "vitest";
import {
  STATUS,
  addBook,
  borrowBook,
  computeStats,
  createSampleData,
  deleteBook,
  loadFromStorage,
  returnBook,
  updateBook,
} from "./library";

const TODAY = "2026-11-07";
const book = (overrides = {}) => ({
  id: "BK001",
  title: "Laskar Pelangi",
  author: "Andrea Hirata",
  category: "Novel",
  year: 2005,
  stock: 2,
  ...overrides,
});
const newBookInput = {
  id: "BK002",
  title: "Bumi Manusia",
  author: "Pramoedya Ananta Toer",
  category: "Novel",
  year: "1980",
  stock: "3",
};
const borrowInput = (overrides = {}) => ({
  borrowerName: "Siti Rahmawati",
  bookId: "BK001",
  borrowDate: TODAY,
  dueDate: "2026-11-14",
  ...overrides,
});

describe("Manajemen data buku", () => {
  it("menambahkan buku baru", () => {
    const r = addBook([book()], newBookInput);
    expect(r.ok).toBe(true);
    expect(r.books).toHaveLength(2);
    expect(r.books[1]).toMatchObject({ id: "BK002", year: 1980, stock: 3 });
  });

  it("menolak input kosong", () => {
    const r = addBook([], { id: "", title: "", author: "", category: "", year: "", stock: "" });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(
      ["author", "category", "id", "stock", "title", "year"].sort(),
    );
  });

  it("menolak stok negatif", () => {
    const r = addBook([], { ...newBookInput, stock: "-1" });
    expect(r.ok).toBe(false);
    expect(r.errors.stock).toBe("Jumlah stok tidak boleh negatif.");
  });

  it("menolak stok desimal / bukan angka", () => {
    expect(addBook([], { ...newBookInput, stock: "1.5" }).ok).toBe(false);
    expect(addBook([], { ...newBookInput, stock: "abc" }).ok).toBe(false);
  });

  it("menolak buku duplikat (judul + penulis sama, beda huruf besar/kecil)", () => {
    const r = addBook([book()], { ...newBookInput, title: "laskar  pelangi", author: "ANDREA HIRATA" });
    expect(r.ok).toBe(false);
    expect(r.errors.title).toMatch(/sudah terdaftar/);
  });

  it("menolak ID buku duplikat", () => {
    const r = addBook([book()], { ...newBookInput, id: "bk001" });
    expect(r.ok).toBe(false);
    expect(r.errors.id).toMatch(/sudah digunakan/);
  });

  it("mengedit buku tanpa dianggap duplikat dengan dirinya sendiri", () => {
    const r = updateBook([book()], "BK001", { ...book(), stock: "10" });
    expect(r.ok).toBe(true);
    expect(r.books[0].stock).toBe(10);
  });

  it("menghapus buku", () => {
    const r = deleteBook([book()], [], "BK001");
    expect(r.ok).toBe(true);
    expect(r.books).toHaveLength(0);
  });

  it("tidak menghapus buku yang sedang dipinjam", () => {
    const borrowed = borrowBook([book()], [], borrowInput());
    const r = deleteBook(borrowed.books, borrowed.transactions, "BK001");
    expect(r.ok).toBe(false);
  });
});

describe("Peminjaman buku", () => {
  it("mengurangi stok sebanyak 1 ketika dipinjam", () => {
    const r = borrowBook([book({ stock: 2 })], [], borrowInput());
    expect(r.ok).toBe(true);
    expect(r.books[0].stock).toBe(1);
    expect(r.transactions[0]).toMatchObject({ status: STATUS.BORROWED, bookTitle: "Laskar Pelangi" });
  });

  it("menolak peminjaman jika stok habis", () => {
    const r = borrowBook([book({ stock: 0 })], [], borrowInput());
    expect(r.ok).toBe(false);
    expect(r.errors.bookId).toMatch(/habis/);
  });

  it("menolak input wajib yang kosong", () => {
    const r = borrowBook([book()], [], { borrowerName: "", bookId: "", borrowDate: "", dueDate: "" });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(["bookId", "borrowDate", "borrowerName", "dueDate"]);
  });

  it("menolak tanggal kembali sebelum tanggal pinjam", () => {
    const r = borrowBook([book()], [], borrowInput({ dueDate: "2026-11-01" }));
    expect(r.ok).toBe(false);
    expect(r.errors.dueDate).toBeDefined();
  });
});

describe("Pengembalian buku", () => {
  it("mengubah status menjadi Dikembalikan dan menambah stok", () => {
    const borrowed = borrowBook([book({ stock: 1 })], [], borrowInput());
    expect(borrowed.books[0].stock).toBe(0);
    const txId = borrowed.transactions[0].id;
    const r = returnBook(borrowed.books, borrowed.transactions, txId, TODAY);
    expect(r.ok).toBe(true);
    expect(r.books[0].stock).toBe(1);
    expect(r.transactions[0]).toMatchObject({ status: "Dikembalikan", returnDate: TODAY });
  });

  it("mencegah buku yang sama dikembalikan dua kali", () => {
    const borrowed = borrowBook([book({ stock: 1 })], [], borrowInput());
    const txId = borrowed.transactions[0].id;
    const first = returnBook(borrowed.books, borrowed.transactions, txId, TODAY);
    const second = returnBook(first.books, first.transactions, txId, TODAY);
    expect(second.ok).toBe(false);
    expect(second.message).toMatch(/sudah dikembalikan/);
  });
});

describe("Dashboard & penyimpanan", () => {
  it("menghitung statistik dari data contoh", () => {
    const { books, transactions } = createSampleData(TODAY);
    const stats = computeStats(books, transactions, TODAY);
    expect(stats.borrowed).toBe(2);
    expect(stats.totalTransactions).toBe(3);
    expect(stats.totalCollection).toBe(stats.available + stats.borrowed);
  });

  it("memuat data contoh saat localStorage kosong", () => {
    const storage = { getItem: () => null };
    const r = loadFromStorage(storage, TODAY);
    expect(r.seeded).toBe(true);
    expect(r.books.length).toBeGreaterThan(0);
  });

  it("memuat ulang data contoh jika data tersimpan rusak", () => {
    const storage = { getItem: () => "{rusak" };
    const r = loadFromStorage(storage, TODAY);
    expect(r.error).toBeDefined();
    expect(r.books.length).toBeGreaterThan(0);
  });
});
