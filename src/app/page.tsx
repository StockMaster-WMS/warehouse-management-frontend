export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Next.js App Router + TypeScript + Tailwind
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
        Khoi tao nen tang cho he thong quan ly kho WMS ben vung
      </h1>
      <p className="max-w-2xl text-lg text-zinc-600">
        Cau truc du an da duoc chia theo huong feature-based voi cac tang app,
        components, hooks, services, store, types va lib de mo rong de dang khi
        he thong lon dan.
      </p>
      <div className="pt-2">
        <a
          href="/inventory"
          className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Mo dashboard mau
        </a>
      </div>
    </main>
  );
}
