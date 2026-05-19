export function Footer() {
  return (
    <footer
      className="border-t py-6 text-center text-xs"
      style={{
        borderColor: 'var(--pb-border)',
        color: 'var(--pb-text-tertiary)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p>
          Compatible with fifth edition. Includes material from the{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--pb-accent)' }}
          >
            SRD 5.2 (CC BY 4.0)
          </a>
          . Party Buff is unofficial fan content, not endorsed by Wizards of the Coast.
        </p>
      </div>
    </footer>
  );
}
