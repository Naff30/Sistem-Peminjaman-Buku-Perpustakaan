import { BookDown, BookOpen, BookUp, History, LayoutDashboard, Library, X } from "lucide-react";

export const NAV_ITEMS = [
  {
    id: "dashboard",
    path: "/",
    label: "Dashboard",
    description: "Ringkasan data perpustakaan",
    icon: LayoutDashboard,
  },
  {
    id: "buku",
    path: "/buku",
    label: "Data Buku",
    description: "Tambah, ubah, hapus, dan cari koleksi buku",
    icon: BookOpen,
  },
  {
    id: "peminjaman",
    path: "/peminjaman",
    label: "Peminjaman",
    description: "Catat peminjaman buku baru",
    icon: BookUp,
  },
  {
    id: "pengembalian",
    path: "/pengembalian",
    label: "Pengembalian",
    description: "Proses buku yang dikembalikan",
    icon: BookDown,
  },
  {
    id: "riwayat",
    path: "/riwayat",
    label: "Riwayat Transaksi",
    description: "Semua riwayat peminjaman dan pengembalian",
    icon: History,
  },
];

/**
 * Menu navigasi di sebelah kiri.
 * Di HP, sidebar tersembunyi dan muncul sebagai laci (drawer) saat `open` = true.
 */
export default function Sidebar({ currentPage, onNavigate, open, onClose }) {
  const handleClick = (e, item) => {
    // Biarkan ctrl/cmd+klik membuka tab baru.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(item.id);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-overlay lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigasi utama"
      >
        <div className="flex items-center justify-between gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-accent">
              <Library className="size-5" />
            </div>
            <div>
              <p className="text-base font-bold leading-tight">Perpustakaan</p>
              <p className="text-xs text-sidebar-muted">Sistem Peminjaman Buku</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === currentPage;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => handleClick(e, item)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-[18px]" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-muted">
          Data tersimpan otomatis di browser ini.
        </div>
      </aside>
    </>
  );
}
