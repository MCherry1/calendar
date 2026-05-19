import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import type { ReactNode } from 'react';

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--pb-bg-deep)] text-[var(--pb-text-primary)]">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
