import { useEffect, type ReactNode } from 'react';
import { Sidebar, type Page } from './Sidebar';
import { TileBackground } from './TileBackground';
import { usePointerFx } from '../../hooks/usePointerFx';

interface AppLayoutProps {
  page: Page;
  onNavigate: (page: Page) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  ghostingCount: number;
  banner?: ReactNode; // banner bentrok jadwal tampil di atas semua halaman
  toast?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ page, onNavigate, theme, onToggleTheme, ghostingCount, banner, toast, children }: AppLayoutProps) {
  usePointerFx();

  // Tema dipasang di <html> supaya warna latar memenuhi seluruh halaman.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="app" data-theme={theme}>
      <TileBackground />
      <Sidebar current={page} onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} ghostingCount={ghostingCount} />
      <main className="main">
        {banner}
        {/* key={page}: halaman baru di-mount ulang, jadi animasi masuk jalan tiap pindah menu */}
        <div key={page} className="page">{children}</div>
      </main>
      <div className="toast-region">{toast}</div>
    </div>
  );
}
