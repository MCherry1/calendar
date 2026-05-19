import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1
        className="font-display text-3xl font-semibold"
        style={{ color: 'var(--pb-text-primary)' }}
      >
        Lost in the planes
      </h1>
      <p style={{ color: 'var(--pb-text-secondary)' }}>
        That page doesn't exist. Try the calendar home.
      </p>
      <Link
        to="/"
        className="rounded-md px-4 py-2 font-medium transition-colors"
        style={{
          background: 'var(--pb-accent)',
          color: 'var(--pb-text-on-accent)',
        }}
      >
        Back to today
      </Link>
    </div>
  );
}
