import React from 'react';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary fallback={<div className="p-4 text-warning">Header failed to load</div>}>
        <Header />
      </ErrorBoundary>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;