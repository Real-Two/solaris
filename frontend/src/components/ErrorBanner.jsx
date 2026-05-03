export default function ErrorBanner() {
  return (
    <div className="w-full px-5 py-2 text-[13px] font-medium z-20 flex items-center gap-2"
      style={{ background: '#fffbeb', color: '#d97706' }}
    >
      <span>⚠</span>
      <span>
        SOLARIS backend offline — run:{' '}
        <code className="font-mono text-[12px] bg-amber-100 px-2 py-0.5 rounded">
          uvicorn backend.server:app --port 8000
        </code>
      </span>
    </div>
  );
}
