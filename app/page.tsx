import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-stone-100 px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-amber-400">
          Guerra de los Cien Años
        </h1>
        <p className="text-stone-400 text-lg">
          Elige tu facción. Construye tu aldea. Comanda tus ejércitos.<br />
          España, Francia e Inglaterra se disputan el control de Europa.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="px-8 py-3 rounded bg-amber-600 hover:bg-amber-500 font-semibold transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded border border-stone-600 hover:border-amber-500 hover:text-amber-400 font-semibold transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </main>
  );
}
