import { useState } from "react";
import { AlertTriangle, ArrowLeftRight, BookCheck, BookCopy, BookUp, RotateCcw } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { computeStats, formatDate } from "../lib/library";
import Modal from "./Modal";
import StatusBadge, { StockBadge } from "./StatusBadge";

function StatCard({ icon: Icon, label, value, hint, tone }) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    warning: "bg-warning-soft text-warning-foreground",
    success: "bg-success-soft text-success",
    info: "bg-accent text-accent-foreground",
  };
  return (
    <div className="panel flex items-start gap-4 p-5">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { books, transactions, resetData } = useLibrary();
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = computeStats(books, transactions);

  const recent = [...transactions].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  const lowStock = [...books].filter((b) => b.stock <= 1).sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookCopy}
          label="Total Koleksi Buku"
          value={stats.totalCollection}
          hint={`${stats.titles} judul buku`}
          tone="primary"
        />
        <StatCard
          icon={BookUp}
          label="Sedang Dipinjam"
          value={stats.borrowed}
          hint={stats.overdue > 0 ? `${stats.overdue} terlambat dikembalikan` : "Tidak ada yang terlambat"}
          tone="warning"
        />
        <StatCard
          icon={BookCheck}
          label="Buku Tersedia"
          value={stats.available}
          hint="Siap untuk dipinjam"
          tone="success"
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Total Transaksi"
          value={stats.totalTransactions}
          hint={`${stats.returned} sudah dikembalikan`}
          tone="info"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="panel overflow-hidden xl:col-span-2">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Transaksi Terbaru</h2>
              <p className="panel-subtitle">5 transaksi peminjaman terakhir</p>
            </div>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Belum ada transaksi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Peminjam</th>
                    <th>Judul Buku</th>
                    <th>Tgl Pinjam</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((tx) => (
                    <tr key={tx.id}>
                      <td className="font-medium">{tx.borrowerName}</td>
                      <td className="max-w-[220px] truncate">{tx.bookTitle}</td>
                      <td className="whitespace-nowrap">{formatDate(tx.borrowDate)}</td>
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

        <section className="panel overflow-hidden">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Stok Menipis</h2>
              <p className="panel-subtitle">Buku dengan stok 1 atau habis</p>
            </div>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Semua stok aman.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((book) => (
                <li key={book.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                  </div>
                  <StockBadge stock={book.stock} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmReset(true)}>
          <RotateCcw />
          Reset ke data contoh
        </button>
      </div>

      <Modal
        open={confirmReset}
        size="sm"
        title="Reset data?"
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setConfirmReset(false)}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                resetData();
                setConfirmReset(false);
              }}
            >
              Ya, reset data
            </button>
          </>
        }
      >
        <div className="flex gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <p>Semua data buku dan transaksi akan diganti dengan data contoh. Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      </Modal>
    </div>
  );
}
