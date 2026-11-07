import { useMemo, useRef, useState } from "react";
import { BookUp, Search } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { addDaysISO, todayISO } from "../lib/library";
import { StockBadge } from "./StatusBadge";

const emptyForm = () => ({
  borrowerName: "",
  bookId: "",
  borrowDate: todayISO(),
  dueDate: addDaysISO(todayISO(), 7),
});

/** Form peminjaman buku + daftar buku yang bisa dipinjam. */
export default function BorrowBook() {
  const { books, borrowBook } = useLibrary();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState("");
  const nameRef = useRef(null);

  const sortedBooks = useMemo(() => [...books].sort((a, b) => a.title.localeCompare(b.title)), [books]);
  const selectedBook = books.find((b) => b.id === form.bookId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedBooks.filter(
      (b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
    );
  }, [sortedBooks, query]);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = borrowBook(form);
    if (result.ok) {
      setForm(emptyForm());
      setErrors({});
    } else {
      setErrors(result.errors ?? {});
    }
  };

  const pickBook = (book) => {
    update("bookId", book.id);
    nameRef.current?.focus();
    nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const invalid = (field) => (errors[field] ? "true" : "false");

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="panel h-fit lg:sticky lg:top-24 lg:col-span-2">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Form Peminjaman</h2>
            <p className="panel-subtitle">Semua kolom wajib diisi.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-4 sm:p-5">
          <div>
            <label htmlFor="borrowerName" className="label">
              Nama Peminjam
            </label>
            <input
              ref={nameRef}
              id="borrowerName"
              className="input"
              value={form.borrowerName}
              onChange={(e) => update("borrowerName", e.target.value)}
              placeholder="Masukkan nama lengkap"
              aria-invalid={invalid("borrowerName")}
            />
            {errors.borrowerName && <p className="field-error">{errors.borrowerName}</p>}
          </div>

          <div>
            <label htmlFor="bookId" className="label">
              Judul Buku
            </label>
            <select
              id="bookId"
              className="input"
              value={form.bookId}
              onChange={(e) => update("bookId", e.target.value)}
              aria-invalid={invalid("bookId")}
            >
              <option value="">— Pilih buku —</option>
              {sortedBooks.map((b) => (
                <option key={b.id} value={b.id} disabled={b.stock <= 0}>
                  {b.title} — {b.stock > 0 ? `stok ${b.stock}` : "stok habis"}
                </option>
              ))}
            </select>
            {errors.bookId ? (
              <p className="field-error">{errors.bookId}</p>
            ) : (
              selectedBook && (
                <p className="field-hint">
                  {selectedBook.author} · Sisa stok setelah dipinjam: {Math.max(selectedBook.stock - 1, 0)}
                </p>
              )
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="borrowDate" className="label">
                Tanggal Peminjaman
              </label>
              <input
                id="borrowDate"
                type="date"
                className="input"
                value={form.borrowDate}
                onChange={(e) => update("borrowDate", e.target.value)}
                aria-invalid={invalid("borrowDate")}
              />
              {errors.borrowDate && <p className="field-error">{errors.borrowDate}</p>}
            </div>
            <div>
              <label htmlFor="dueDate" className="label">
                Tanggal Pengembalian
              </label>
              <input
                id="dueDate"
                type="date"
                className="input"
                min={form.borrowDate || undefined}
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
                aria-invalid={invalid("dueDate")}
              />
              {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            <BookUp />
            Pinjam Buku
          </button>
        </form>
      </section>

      <section className="panel overflow-hidden lg:col-span-3">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Pilih Buku</h2>
            <p className="panel-subtitle">Klik “Pinjam” untuk memilih buku.</p>
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul atau penulis…"
              className="input pl-9"
              aria-label="Cari buku"
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Buku tidak ditemukan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Judul Buku</th>
                  <th>Penulis</th>
                  <th>Stok</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book) => (
                  <tr key={book.id} className={book.id === form.bookId ? "bg-primary-soft" : undefined}>
                    <td className="min-w-[180px] font-medium">{book.title}</td>
                    <td className="min-w-[130px] text-muted-foreground">{book.author}</td>
                    <td>
                      <StockBadge stock={book.stock} />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-soft btn-sm"
                        disabled={book.stock <= 0}
                        onClick={() => pickBook(book)}
                        aria-label={`Pinjam ${book.title}`}
                      >
                        <BookUp />
                        {book.stock <= 0 ? "Stok habis" : "Pinjam"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
