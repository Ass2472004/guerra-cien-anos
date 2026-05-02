"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (!acceptPrivacy) { setError("Debes aceptar la política de privacidad"); return; }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Error al registrar"); return; }
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="parchment w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">📜</div>
          <h1 className="font-display text-2xl text-ink">Crear crónica</h1>
          <p className="text-ink-soft text-sm italic">Que el cronista anote tu nombre</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-display">Nombre del noble</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-display">Correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full" required />
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-display">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
                tabIndex={-1}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink-soft mb-1 font-display">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full pr-10 ${confirm && password !== confirm ? "border-red-500 ring-1 ring-red-500" : confirm && password === confirm ? "border-green-600 ring-1 ring-green-600" : ""}`}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {confirm && password !== confirm && (
              <p className="text-[11px] text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
            {confirm && password === confirm && (
              <p className="text-[11px] text-green-600 mt-1">✓ Las contraseñas coinciden</p>
            )}
          </div>

          {/* Privacy checkbox */}
          <label className="flex items-start gap-2 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={e => setAcceptPrivacy(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${acceptPrivacy ? "bg-amber-700 border-amber-700" : "border-bronze bg-transparent group-hover:border-amber-600"}`}>
                {acceptPrivacy && (
                  <svg className="w-2.5 h-2.5 text-parchment" fill="none" viewBox="0 0 12 12" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-ink-soft leading-snug">
              He leído y acepto la{" "}
              <Link href="/privacidad" target="_blank" className="underline text-blood hover:text-bronze transition-colors">
                política de privacidad
              </Link>
            </span>
          </label>

          {error && <p className="text-blood text-sm italic">{error}</p>}
          <button type="submit" disabled={loading} className="btn-medieval w-full">
            {loading ? "Forjando…" : "📜 Sellar el pergamino"}
          </button>
        </form>
        <p className="text-ink-soft text-sm text-center">
          ¿Ya tienes crónica?{" "}
          <Link href="/login" className="underline text-blood font-semibold">Acceder</Link>
        </p>
      </div>
    </main>
  );
}
