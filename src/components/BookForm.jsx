import { useState } from "react";
import { CATEGORIES, MAX_STOCK } from "../lib/library";
import Modal from "./Modal";

/**
 * Form tambah / edit buku di dalam modal.
 * `onSubmit(values)` mengembalikan hasil validasi dari context; jika gagal,
 * pesan kesalahan ditampilkan di bawah setiap kolom.
 */
export default function BookForm({ book, suggestedId, onSubmit, onClose }) {
  const isEdit = Boolean(book);
  const [values, setValues] = useState(() => ({
    id: book?.id ?? suggestedId ?? "",
    title: book?.title ?? "",
    author: book?.author ?? "",
    category: book?.category ?? "",
    year: book ? String(book.year) : "",
    stock: book ? String(book.stock) : "",
  }));
  const [errors, setErrors] = useState({});

  const categories =
    book?.category && !CATEGORIES.includes(book.category) ? [...CATEGORIES, book.category] : CATEGORIES;

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = onSubmit(values);
    if (!result.ok) setErrors(result.errors ?? {});
  };

  const fieldProps = (field) => ({
    id: `book-${field}`,
    name: field,
    value: values[field],
    onChange: update(field),
    className: "input",
    "aria-invalid": errors[field] ? "true" : "false",
  });

  const ErrorText = ({ field }) =>
    errors[field] ? <p className="field-error">{errors[field]}</p> : null;

  return (
    <Modal
      open
      title={isEdit ? "Edit Data Buku" : "Tambah Buku Baru"}
      description={isEdit ? `Mengubah data buku ${book.id}` : "Lengkapi semua kolom di bawah ini."}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="book-form" className="btn btn-primary">
            {isEdit ? "Simpan Perubahan" : "Tambah Buku"}
          </button>
        </>
      }
    >
      <form id="book-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="book-id" className="label">
            ID Buku
          </label>
          <input {...fieldProps("id")} disabled={isEdit} placeholder="Contoh: BK011" />
          {isEdit ? (
            <p className="field-hint">ID buku tidak dapat diubah.</p>
          ) : (
            <ErrorText field="id" />
          )}
        </div>
        <div>
          <label htmlFor="book-category" className="label">
            Kategori
          </label>
          <select {...fieldProps("category")}>
            <option value="">— Pilih kategori —</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ErrorText field="category" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="book-title" className="label">
            Judul Buku
          </label>
          <input {...fieldProps("title")} placeholder="Masukkan judul buku" autoFocus />
          <ErrorText field="title" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="book-author" className="label">
            Penulis
          </label>
          <input {...fieldProps("author")} placeholder="Masukkan nama penulis" />
          <ErrorText field="author" />
        </div>
        <div>
          <label htmlFor="book-year" className="label">
            Tahun Terbit
          </label>
          <input {...fieldProps("year")} type="number" inputMode="numeric" placeholder="Contoh: 2020" />
          <ErrorText field="year" />
        </div>
        <div>
          <label htmlFor="book-stock" className="label">
            Jumlah Stok
          </label>
          <input
            {...fieldProps("stock")}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_STOCK}
            placeholder="0"
          />
          <ErrorText field="stock" />
        </div>
      </form>
    </Modal>
  );
}
