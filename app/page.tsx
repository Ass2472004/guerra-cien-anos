import Link from "next/link";

const FACTIONS = [
  {
    crest: "🌑", name: "Los Portadores", sub: "Espadas de la Oscuridad", color: "#9333ea",
    desc: "Portadores de espadas Nahkor, fragmentos de divinidad cuyo filo adopta el color de su alma.",
    strengths: ["Portador Maestro, casi inmortal en combate", "Flecha de Kor, arquero devastador", "Espía Oscuro, invisible en la Nahkor"],
  },
  {
    crest: "👑", name: "El Imperio", sub: "Matriarcado de Rha'en", color: "#d9a847",
    desc: "Disciplina, orden y lealtad a la Emperatriz. Sus jinetes de dragón son temidos en todo el mundo conocido.",
    strengths: ["Jinete de Dragón, caballería suprema", "Guiverno de Asedio, destruye murallas", "Guardia de la Emperatriz, defensa de élite"],
  },
  {
    crest: "⚓", name: "La Federación", sub: "Ciudades Marinas de Rha'miras", color: "#22d3ee",
    desc: "Señores del comercio del Mar Allende. Mercenarios baratos y los jinetes mercantes más rápidos del mapa.",
    strengths: ["Jinete Mercante, el más veloz del mapa", "Mercenario de Merxias, élite de choque", "Espía Comercial, infiltración en cortes"],
  },
];

const FEATURES = [
  { icon: "🏰", title: "Conquista", text: "Mueve tus ejércitos hacia aldeas enemigas o neutrales. Necesitas 15 aldeas para dominar el mundo Nahkor." },
  { icon: "💰", title: "Diplomacia", text: "Paga tributo en plata para ganar aldeas neutrales sin derramar sangre. La plata mueve más que la espada." },
  { icon: "⚔", title: "Nobleza", text: "Gana prestigio en batalla y asciende de Vasallo a Portador de las 256, con bonificaciones en cada título." },
];

const EMBERS = [8, 18, 29, 41, 52, 63, 74, 85, 93];

export default function Home() {
  return (
    <main className="land-main">
      <nav className="land-nav" aria-label="Principal">
        <Link href="/" className="font-display title-gold text-lg tracking-widest no-underline">NAHKOR</Link>
        <div className="flex items-center gap-1">
          <a href="#facciones" className="link hide-sm">Facciones</a>
          <a href="#mundo" className="link hide-sm">El mundo</a>
          <Link href="/login" className="link">Entrar</Link>
        </div>
      </nav>

      <section className="land-hero">
        <div className="land-hero-bg" style={{ backgroundImage: "url('/banner.png')" }} aria-hidden />
        <div className="nh-embers" aria-hidden>
          {EMBERS.map((l, i) => (
            <span key={l} className="nh-ember" style={{ left: `${l}%`, animationDuration: `${9 + (i % 4) * 2}s`, animationDelay: `${i * 1.3}s`, "--dx": `${(i % 2 ? 1 : -1) * 30}px` } as React.CSSProperties} />
          ))}
        </div>
        <div className="relative max-w-3xl text-center">
          <div className="land-moon rise" aria-hidden />
          <h1 className="font-display title-gold rise d1 text-6xl md:text-8xl leading-none mb-4 tracking-wide">Mundo Nahkor</h1>
          <p className="rise d2 font-display text-parchment-aged tracking-[0.3em] uppercase text-sm mb-6">Crónicas del Mundo Oscuro</p>
          <div className="ornament rise d2" aria-hidden>❖</div>
          <blockquote className="rise d3 mx-auto mt-6 max-w-xl text-xl md:text-2xl italic text-parchment leading-relaxed" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            «Las espadas Nahkor son fragmentos de divinidad. Solo los puros de corazón sobreviven a la Gran Inundación.»
            <footer className="mt-2 text-sm not-italic text-parchment-dark tracking-widest">— Teontélos, pasaje 4º</footer>
          </blockquote>
          <div className="rise d4 mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn-hero gold">⚔ Forjar nueva crónica</Link>
            <Link href="/login" className="btn-hero ghost">Entrar al mundo</Link>
          </div>
        </div>
        <div className="scroll-hint" aria-hidden />
      </section>

      <section className="land-section" id="mundo" style={{ paddingBottom: 0 }}>
        <div className="land-wrap">
          <div className="land-stats">
            <div className="land-stat"><b>3</b><span>facciones</span></div>
            <div className="land-stat"><b>15</b><span>aldeas para la victoria</span></div>
            <div className="land-stat"><b>256</b><span>Portadores en la cúspide</span></div>
          </div>
        </div>
      </section>

      <section className="land-section" id="facciones">
        <div className="land-wrap">
          <div className="text-center mb-12">
            <h2 className="font-display title-gold text-4xl md:text-5xl">Tres pueblos, un solo mundo</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FACTIONS.map(f => (
              <article key={f.name} className="fac-card" style={{ "--fc": f.color } as React.CSSProperties}>
                <div className="fac-crest" aria-hidden>{f.crest}</div>
                <h3 className="font-display text-2xl" style={{ color: f.color }}>{f.name}</h3>
                <p className="font-display mt-1 text-xs tracking-[0.18em] uppercase text-parchment-dark">{f.sub}</p>
                <p className="mt-4 text-parchment-aged text-lg leading-snug">{f.desc}</p>
                <ul className="fac-list">{f.strengths.map(s => <li key={s}>{s}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="land-section" style={{ paddingTop: 0 }}>
        <div className="land-wrap">
          <div className="text-center mb-10">
            <h2 className="font-display title-gold text-3xl md:text-4xl">Forja tu legado</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card">
                <div className="feat-icon" aria-hidden>{f.icon}</div>
                <h3 className="font-display text-xl text-gold-bright">{f.title}</h3>
                <p className="mt-2 text-parchment-aged text-lg leading-snug">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <div className="ornament mb-6" aria-hidden>❖</div>
            <p className="font-display text-2xl md:text-3xl text-parchment mb-6">El mundo Nahkor te espera.</p>
            <Link href="/register" className="btn-hero gold">⚔ Comenzar campaña</Link>
          </div>
        </div>
      </section>

      <footer className="px-5 py-8 text-center text-sm text-parchment-dark border-t border-bronze/30">
        <span className="font-display tracking-widest">NAHKOR</span> · <Link href="/privacidad" className="underline hover:text-gold-bright">Política de privacidad</Link>
      </footer>
    </main>
  );
}
