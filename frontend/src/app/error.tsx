"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="panel mx-auto max-w-xl p-6"><div className="tech-label">Connection interrupted</div><h1 className="mt-2 text-lg font-semibold">The data service is unavailable.</h1><p className="mt-2 text-[12px] text-[var(--text-secondary)]">We could not retrieve this view from the configured data source. Check the backend connection and retry.</p><button onClick={reset} className="control mt-5 border-[var(--accent)] bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent-strong)]">Retry</button></div>;
}
