import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Marketing Platform</h1>
      <p className="text-zinc-400 text-center max-w-md">
        All-in-one marketing for local businesses — GBP, content calendar, website.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Log in
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
