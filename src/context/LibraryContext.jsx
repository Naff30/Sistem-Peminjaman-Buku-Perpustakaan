import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as lib from "../lib/library";

const LibraryContext = createContext(null);

/**
 * Menyimpan data buku & transaksi, menyinkronkannya ke localStorage,
 * dan menyediakan aksi (tambah, edit, hapus, pinjam, kembalikan).
 * Setiap aksi menampilkan notifikasi berhasil / gagal.
 */
export function LibraryProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ready, setReady] = useState(false);

  // Ref selalu berisi data terbaru, sehingga klik ganda yang sangat cepat
  // (misalnya tombol "Kembalikan" ditekan dua kali) tetap divalidasi dengan benar.
  const stateRef = useRef({ books: [], transactions: [] });

  const commit = (nextBooks, nextTransactions) => {
    stateRef.current = { books: nextBooks, transactions: nextTransactions };
    setBooks(nextBooks);
    setTransactions(nextTransactions);
  };

  // Muat data dari localStorage saat aplikasi dibuka (hanya di browser).
  useEffect(() => {
    const loaded = lib.loadFromStorage(window.localStorage, lib.todayISO());
    commit(loaded.books, loaded.transactions);
    setReady(true);
    if (loaded.error) toast.error(loaded.error);
  }, []);

  // Simpan otomatis setiap kali data berubah.
  useEffect(() => {
    if (!ready) return;
    try {
      lib.saveToStorage(window.localStorage, books, transactions);
    } catch {
      toast.error("Gagal menyimpan data ke penyimpanan browser.");
    }
  }, [books, transactions, ready]);

  const handle = (result) => {
    if (result.ok) {
      const current = stateRef.current;
      commit(result.books ?? current.books, result.transactions ?? current.transactions);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    return result;
  };

  const actions = {
    addBook: (input) => handle(lib.addBook(stateRef.current.books, input)),
    updateBook: (id, input) => handle(lib.updateBook(stateRef.current.books, id, input)),
    deleteBook: (id) =>
      handle(lib.deleteBook(stateRef.current.books, stateRef.current.transactions, id)),
    borrowBook: (input) =>
      handle(lib.borrowBook(stateRef.current.books, stateRef.current.transactions, input)),
    returnBook: (transactionId, returnDate) =>
      handle(
        lib.returnBook(
          stateRef.current.books,
          stateRef.current.transactions,
          transactionId,
          returnDate,
        ),
      ),
    resetData: () => {
      const sample = lib.createSampleData(lib.todayISO());
      commit(sample.books, sample.transactions);
      toast.success("Data berhasil dikembalikan ke data contoh.");
    },
  };

  return (
    <LibraryContext.Provider value={{ books, transactions, ready, ...actions }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary harus digunakan di dalam <LibraryProvider>.");
  return ctx;
}
