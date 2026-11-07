import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { generateBookId } from "../lib/library";
import BookForm from "./BookForm";
import Modal from "./Modal";
import { StockBadge } from "./StatusBadge";

/** Manajemen data buku: daftar, cari, tambah, edit, hapus. */
export default function BookList() {
  const { books, addBook, updateBook, deleteBook } = useLibrary();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null); // null | { mode: "add" } | { mode: "edit", book }
  const [toDelete, setToDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...books]
      .filter((b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [books, query]);

  const handleSubmit = (values) => {
    const result = form?.mode === "edit" ? updateBook(form.book.id, values) : addBook(values);
    if (result.ok) setForm(null);
    return result;
  };

  const confirmDelete = () => {
    const result = deleteBook(toDelete.id);
    if (result.ok) setToDelete(null);
  };

  return (
    <section className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Daftar Buku</h2>
          <p className="panel-subtitle">
            {filtered.length} dari {books.length} judul buku
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul atau penulis…"
              className="input pl-9"
              aria-label="Cari buku berdasarkan judul atau penulis"
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setForm({ mode: "add" })}>
            <Plus />
            Tambah Buku
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {books.length === 0 ? "Belum ada data buku." : `Tidak ada buku yang cocok dengan "${query}".`}
          </p>
          <p className="text-xs text-muted-foreground">
            {books.length === 0 ? "Klik “Tambah Buku” untuk menambahkan koleksi." : "Coba kata kunci lain."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Judul Buku</th>
                <th>Penulis</th>
                <th>Kategori</th>
                <th>Tahun</th>
                <th>Stok</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => (
                <tr key={book.id}>
                  <td className="font-mono text-xs text-muted-foreground">{book.id}</td>
                  <td className="min-w-[180px] font-medium">{book.title}</td>
                  <td className="min-w-[140px]">{book.author}</td>
                  <td>
                    <span className="badge badge-info">{book.category}</span>
                  </td>
                  <td>{book.year}</td>
                  <td>
                    <StockBadge stock={book.stock} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        className="btn btn-soft btn-sm"
                        onClick={() => setForm({ mode: "edit", book })}
                        aria-label={`Edit ${book.title}`}
                      >
                        <Pencil />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-soft btn-sm"
                        onClick={() => setToDelete(book)}
                        aria-label={`Hapus ${book.title}`}
                      >
                        <Trash2 />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <BookForm
          book={form.mode === "edit" ? form.book : null}
          suggestedId={generateBookId(books)}
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
        />
      )}

      <Modal
        open={Boolean(toDelete)}
        size="sm"
        title="Hapus buku?"
        onClose={() => setToDelete(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setToDelete(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
              <Trash2 />
              Ya, hapus
            </button>
          </>
        }
      >
        <div className="flex gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <p>
            Buku <span className="font-semibold text-foreground">“{toDelete?.title}”</span> ({toDelete?.id})
            akan dihapus dari koleksi. Buku yang masih dipinjam tidak dapat dihapus.
          </p>
        </div>
      </Modal>
    </section>
  );
}
