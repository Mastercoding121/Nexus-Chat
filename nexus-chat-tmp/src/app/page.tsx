import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-panel/95 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-500">Nexus Chat</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Your messaging workspace is ready.</h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          This preview now opens the Nexus experience directly. Use the navigation to explore the dashboard, chat, contacts, stories, and settings views.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600">
            Open Dashboard
          </Link>
          <Link href="/chat" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-panel-soft">
            Open Chat
          </Link>
        </div>
      </div>
    </main>
  );
}
