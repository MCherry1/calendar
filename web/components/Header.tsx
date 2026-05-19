import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header
      className="border-b backdrop-blur"
      style={{
        background: 'rgba(13, 14, 12, 0.85)',
        borderColor: 'var(--pb-border)',
      }}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="font-display text-lg font-semibold tracking-tight"
            style={{ color: 'var(--pb-text-primary)' }}
          >
            Party Buff
          </a>
          <span style={{ color: 'var(--pb-text-tertiary)' }}>/</span>
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-tight"
            style={{ color: 'var(--pb-accent)' }}
          >
            Calendar
          </Link>
        </div>
        <nav className="flex items-center gap-1">
          {/* Reserved for future per-section nav (Today / Year / Events / Settings). */}
        </nav>
      </div>
    </header>
  );
}
