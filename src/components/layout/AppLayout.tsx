import type { ReactNode } from 'react';
import { Sidebar, type Page } from './Sidebar';

interface AppLayoutProps {
  page: Page;
  onNavigate: (page: Page) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  ghostingCount: number;
  banner?: ReactNode; // banner bentrok jadwal (dari logic Al) tampil di atas semua halaman
  toast?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ page, onNavigate, theme, onToggleTheme, ghostingCount, banner, toast, children }: AppLayoutProps) {
  return (
    <div className="app" data-theme={theme}>
      <Sidebar current={page} onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} ghostingCount={ghostingCount} />
      <main className="main">
        {banner}
        {children}
      </main>
      <div className="toast-region">{toast}</div>
    </div>
  );
}
