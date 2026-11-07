import { useMemo, useState } from "react";
import { BookDown, CheckCircle2, Search } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { STATUS, formatDate, isOverdue, todayISO } from "../lib/library";
import Modal from "./Modal";
import StatusBadge from "./StatusBadge";

/** Daftar buku yang sedang dipinjam + proses pengembalian. */
export default function ReturnBook() {
  const { transactions, returnBook } = useLibrary();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [returnDate, setReturnDate] = useState(() => todayISO());
  const [error, setError] = useState("");

  const active = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => t.status === STATUS.BORROWED)
      .filter(
        (t) =>
          !q ||
          t.borrowerName.toLowerCase().includes(q) ||
          t.bookTitle.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [transactions, query]);

  const recentlyReturned = useMemo(
    () =>
      transactions
        .filter((t) => t.status === STATUS.RETURNED)
        .sort((a, b) => (b.returnDate ?? "").localeCompare(a.returnDate ?? "") || b.id.localeCompare(a.id))
        .slice(0, 5),
    [transactions],
  );

  const totalActive = transactions.filter((t) => t.status === STATUS.BORROWED).length;
  const overdueCount = transactions.filter((t) => isOverdue(t)).length;

  const openReturn = (tx) => {
    setSelected(tx);
    setReturnDate(todayISO());
    setError("");
  };

  const confirmReturn = () => {
    const result = returnBook(selected.id, returnDate);
    if (result.ok) setSelected(null);
    else setError(result.message);
  };

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Buku Sedang Dipinjam</h2>
            <p className="panel-subtitle">
              {totalActive} peminjaman aktif
              {overdueCount > 0 && <span className="text-destructive"> · {overdueCount} terlambat</span>}
            </p>
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari peminjam, judul, atau ID…"
              className="input pl-9"
              aria-label="Cari peminjaman"
            />
          </div>
        </div>

        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <CheckCircle2 className="size-8 text-success" />
            <p className="text-sm font-medium">
              {totalActive === 0 ? "Tidak ada buku yang sedang dipinjam." : "Tidak ada peminjaman yang cocok."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Peminjam</th>
                  <th>Judul Buku</th>
                  <th>Tgl Pinjam</th>
                  <th>Batas Kembali</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {active.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-mono text-xs text-muted-foreground">{tx.id}</td>
                    <td className="min-w-[130px] font-medium">{tx.borrowerName}</td>
                    <td className="min-w-[180px]">{tx.bookTitle}</td>
                    <td className="whitespace-nowrap">{formatDate(tx.borrowDate)}</td>
                    <td className="whitespace-nowrap">{formatDate(tx.dueDate)}</td>
                    <td>
                      <StatusBadge transaction={tx} />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => openReturn(tx)}
                        aria-label={`Kembalikan ${tx.bookTitle} dari ${tx.borrowerName}`}
                      >
                        <BookDown />
                        Kembalikan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {recentlyReturned.length > 0 && (
        <section className="panel overflow-hidden">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Baru Dikembalikan</h2>
              <p className="panel-subtitle">Transaksi yang sudah selesai tidak bisa dikembalikan lagi.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Peminjam</th>
                  <th>Judul Buku</th>
                  <th>Dikembalikan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentlyReturned.map((tx) => (
                  <tr key={tx.id}>
                    <td className="min-w-[130px] font-medium">{tx.borrowerName}</td>
                    <td className="min-w-[180px]">{tx.bookTitle}</td>
                    <td className="whitespace-nowrap">{formatDate(tx.returnDate)}</td>
                    <td className="text-right">
                      <button type="button" className="btn btn-outline btn-sm" disabled>
                        <CheckCircle2 />
                        Sudah dikembalikan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(selected)}
        size="sm"
        title="Konfirmasi Pengembalian"
        description={selected ? `Transaksi ${selected.id}` : undefined}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-success" onClick={confirmReturn}>
              <BookDown />
              Kembalikan Buku
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-muted p-4">
              <dt className="text-muted-foreground">Peminjam</dt>
              <dd className="font-medium">{selected.borrowerName}</dd>
              <dt className="text-muted-foreground">Judul buku</dt>
              <dd className="font-medium">{selected.bookTitle}</dd>
              <dt className="text-muted-foreground">Tgl pinjam</dt>
              <dd>{formatDate(selected.borrowDate)}</dd>
              <dt className="text-muted-foreground">Batas kembali</dt>
              <dd>{formatDate(selected.dueDate)}</dd>
            </dl>
            <div>
              <label htmlFor="returnDate" className="label">
                Tanggal Dikembalikan
              </label>
              <input
                id="returnDate"
                type="date"
                className="input"
                min={selected.borrowDate}
                value={returnDate}
                onChange={(e) => {
                  setReturnDate(e.target.value);
                  setError("");
                }}
                aria-invalid={error ? "true" : "false"}
              />
              {error && <p className="field-error">{error}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
