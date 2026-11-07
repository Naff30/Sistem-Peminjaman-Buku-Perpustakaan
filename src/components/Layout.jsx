import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar, { NAV_ITEMS } from "./Sidebar";
import { useLibrary } from "../context/LibraryContext";

/** Kerangka halaman: sidebar di kiri, judul halaman di atas, isi di tengah. */
export default function Layout({ currentPage, onNavigate, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { ready } = useLibrary();
  const current = NAV_ITEMS.find((item) => item.id === currentPage) ?? NAV_ITEMS[0];

  const navigate = (id) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            className="btn-icon lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">{current.label}</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{current.description}</p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {ready ? (
            children
          ) : (
            <div className="panel p-10 text-center text-sm text-muted-foreground">Memuat data…</div>
          )}
        </main>
      </div>
    </div>
  );
}
