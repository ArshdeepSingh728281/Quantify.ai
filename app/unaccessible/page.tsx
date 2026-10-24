export default function UnaccessiblePage() {
  return (
    <main className="min-h-screen w-full bg-[#0b0b0f] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 3l9 4v5c0 5.5-3.8 8.5-9 9-5.2-.5-9-3.5-9-9V7l9-4z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold">
          This page is not accessible
        </h1>

        <p className="mt-3 text-sm text-white/60">
          You need to be signed in to access this page.
        </p>

        <a
          href="/"
          className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Go to Home
        </a>
      </div>
    </main>
  );
}