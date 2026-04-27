export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Setup concluído
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          AppControleDeVidaXen
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
          Projeto iniciado com Next.js 16, App Router, TypeScript strict,
          Tailwind CSS 4 e integração pronta para Supabase.
        </p>
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="font-semibold">Stack base</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Next.js 16.2.1 com aliases `@/*`, Tailwind 4 via PostCSS e
              estrutura inicial em `src/`.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="font-semibold">Serviços</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Cliente browser do Supabase disponível em
              `src/services/supabase/client.ts`.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
