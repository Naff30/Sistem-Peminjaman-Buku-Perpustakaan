import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { LibraryProvider } from "./context/LibraryContext";
import Layout from "./components/Layout";
import { NAV_ITEMS } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import BookList from "./components/BookList";
import BorrowBook from "./components/BorrowBook";
import ReturnBook from "./components/ReturnBook";
import TransactionHistory from "./components/TransactionHistory";

const PAGES = {
  dashboard: Dashboard,
  buku: BookList,
  peminjaman: BorrowBook,
  pengembalian: ReturnBook,
  riwayat: TransactionHistory,
};

/** Menentukan halaman aktif dari URL, misalnya "/buku" -> "buku". */
function pageFromPath(pathname) {
  return NAV_ITEMS.find((item) => item.path === pathname)?.id ?? "dashboard";
}

export default function App() {
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname));

  // Tombol back/forward browser.
  useEffect(() => {
    const onPop = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Judul tab browser mengikuti halaman aktif.
  useEffect(() => {
    const item = NAV_ITEMS.find((i) => i.id === page);
    document.title = `${item?.label ?? "Dashboard"} — Perpustakaan`;
  }, [page]);

  const navigate = (id) => {
    const item = NAV_ITEMS.find((i) => i.id === id);
    if (!item) return;
    window.history.pushState({}, "", item.path);
    setPage(id);
    window.scrollTo(0, 0);
  };

  const Page = PAGES[page] ?? Dashboard;

  return (
    <LibraryProvider>
      <Layout currentPage={page} onNavigate={navigate}>
        <Page />
      </Layout>
      <Toaster richColors position="top-right" closeButton />
    </LibraryProvider>
  );
}
