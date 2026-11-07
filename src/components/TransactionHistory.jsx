import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { STATUS, formatDate, isOverdue, todayISO } from "../lib/library";
import StatusBadge from "./StatusBadge";

const FILTERS = [
  { value: "semua", label: "Semua status" },
  { value: STATUS.BORROWED, label: "Dipinjam" },
  { value: "terlambat", label: "Terlambat" },
  { value: STATUS.RETURNED, label: "Dikembalikan" },
];

/** Riwayat seluruh transaksi peminjaman & pengembalian. */
export default function TransactionHistory() {
  const { transactions } = useLibrary();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("semua");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = todayISO();
    return [...transactions]
      .filter((t) => {
        if (status === "semua") return true;
        if (status === "terlambat") return isOverdue(t, today);
        return t.status === status;
      })
      .filter(
        (t) =>
          !q ||
          t.borrowerName.toLowerCase().includes(q) ||
          t.bookTitle.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q),
      )
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [transactions, query, status]);

  return (
    <section className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Riwayat Transaksi</h2>
          <p className="panel-subtitle">
            Menampilkan {filtered.length} dari {transactions.length} transaksi
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari peminjam, judul, atau ID…"
              className="input pl-9"
              aria-label="Cari transaksi"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input sm:w-44"
            aria-label="Filter status"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {transactions.length === 0 ? "Belum ada transaksi." : "Tidak ada transaksi yang cocok."}
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
                <th>Tgl Kembali</th>
                <th>Dikembalikan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs text-muted-foreground">{tx.id}</td>
                  <td className="min-w-[130px] font-medium">{tx.borrowerName}</td>
                  <td className="min-w-[180px]">{tx.bookTitle}</td>
                  <td className="whitespace-nowrap">{formatDate(tx.borrowDate)}</td>
                  <td className="whitespace-nowrap">{formatDate(tx.dueDate)}</td>
                  <td className="whitespace-nowrap">{formatDate(tx.returnDate)}</td>
                  <td>
                    <StatusBadge transaction={tx} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
