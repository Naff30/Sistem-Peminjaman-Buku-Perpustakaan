import { STATUS, diffDays, isOverdue, todayISO } from "../lib/library";

/** Label status transaksi: Dipinjam, Terlambat, atau Dikembalikan. */
export default function StatusBadge({ transaction }) {
  if (transaction.status === STATUS.RETURNED) {
    return <span className="badge badge-success">Dikembalikan</span>;
  }
  const today = todayISO();
  if (isOverdue(transaction, today)) {
    return (
      <span className="badge badge-danger">
        Terlambat {diffDays(transaction.dueDate, today)} hari
      </span>
    );
  }
  return <span className="badge badge-warning">Dipinjam</span>;
}

/** Label stok buku. */
export function StockBadge({ stock }) {
  if (stock <= 0) return <span className="badge badge-danger">Habis</span>;
  if (stock <= 1) return <span className="badge badge-warning">{stock} tersedia</span>;
  return <span className="badge badge-success">{stock} tersedia</span>;
}
