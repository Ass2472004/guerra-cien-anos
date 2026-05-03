import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto parchment p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl">📜</div>
          <h1 className="font-display text-3xl text-ink">Política de privacidad</h1>
          <p className="text-ink-soft text-sm italic">Mundo Nahkor — Crónicas del Mundo Oscuro</p>
        </div>

        <div className="border-t border-bronze pt-4 space-y-5 text-sm text-ink leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">1. Responsable del tratamiento</h2>
            <p className="text-ink-soft">
              Este juego es un proyecto de entretenimiento personal. Los datos recogidos se usan
              exclusivamente para el funcionamiento del juego y no son compartidos con terceros.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">2. Datos que recopilamos</h2>
            <ul className="list-disc list-inside text-ink-soft space-y-1">
              <li>Dirección de correo electrónico (para identificación de cuenta)</li>
              <li>Nombre de usuario elegido libremente</li>
              <li>Datos de progreso del juego (partidas, ejércitos, edificios)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">3. Finalidad del tratamiento</h2>
            <p className="text-ink-soft">
              Los datos se usan únicamente para:
            </p>
            <ul className="list-disc list-inside text-ink-soft space-y-1">
              <li>Gestionar tu cuenta y sesión de juego</li>
              <li>Guardar el progreso de tus partidas</li>
              <li>Garantizar la seguridad de la plataforma</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">4. Cookies y almacenamiento local</h2>
            <p className="text-ink-soft">
              Utilizamos cookies de sesión estrictamente necesarias para mantener tu sesión iniciada.
              También usamos <em>localStorage</em> para guardar preferencias de interfaz (como si has
              aceptado este aviso). No usamos cookies de seguimiento ni publicidad.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">5. Base jurídica</h2>
            <p className="text-ink-soft">
              El tratamiento se basa en el consentimiento que otorgas al crear tu cuenta y aceptar
              esta política. Puedes retirar tu consentimiento eliminando tu cuenta en cualquier momento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">6. Conservación de los datos</h2>
            <p className="text-ink-soft">
              Los datos se conservan mientras tu cuenta esté activa. Al eliminar tu cuenta, todos
              tus datos de juego son borrados permanentemente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">7. Tus derechos</h2>
            <p className="text-ink-soft">
              Conforme al Reglamento General de Protección de Datos (RGPD), tienes derecho a:
              acceder, rectificar, suprimir y portar tus datos personales.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base text-ink">8. Seguridad</h2>
            <p className="text-ink-soft">
              Las contraseñas se almacenan cifradas con bcrypt. La base de datos está alojada en
              Supabase (PostgreSQL) con acceso restringido.
            </p>
          </section>
        </div>

        <div className="border-t border-bronze pt-4 text-center">
          <p className="text-ink-soft text-xs italic mb-3">Última actualización: mayo 2026</p>
          <Link href="/register" className="btn-medieval text-sm px-6 py-2">
            ← Volver al registro
          </Link>
        </div>
      </div>
    </main>
  );
}
