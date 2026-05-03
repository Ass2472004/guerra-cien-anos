import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('/banner.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/40 to-stone-950 pointer-events-none" />
      <div className="relative max-w-2xl text-center space-y-7">
        <div className="text-6xl">🌑</div>
        <h1 className="font-display text-5xl md:text-6xl title-gold leading-tight">
          Mundo Nahkor
        </h1>
        <p className="font-display text-sm text-violet-300 tracking-widest uppercase">Crónicas del Mundo Oscuro</p>
        <div className="border-t border-b border-bronze py-4 mx-auto max-w-md">
          <p className="text-parchment-aged text-lg italic">
            «Las espadas Nahkor son fragmentos de divinidad.<br />
            Solo los puros de corazón<br />
            sobreviven a la Gran Inundación.»
          </p>
          <p className="text-ink-soft text-xs mt-2">— Teontélos, pasaje 4º</p>
        </div>
        <p className="text-parchment-dark text-lg">
          Elige tu facción: Portadores, Imperio o Federación.<br />
          Forja tu ejército. Conquista el mundo Nahkor.
        </p>
        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <Link href="/login" className="btn-medieval">🌑 Entrar al mundo</Link>
          <Link href="/register" className="btn-blood">📜 Forjar nueva crónica</Link>
        </div>
      </div>
    </main>
  );
}
