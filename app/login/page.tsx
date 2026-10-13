"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Email o contraseña incorrectos"); return; }
    router.push("/dashboard");
  }

  return (
    <main className="auth-shell">
      <Link href="/" className="absolute top-5 left-6 font-display title-gold tracking-widest no-underline">NAHKOR</Link>
      <div className="auth-card mt-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="auth-seal" aria-hidden>⚜</div>
          <h1 className="font-display text-2xl text-ink">Acceso al castillo</h1>
          <p className="text-ink-soft text-sm italic">Identifícate, noble caballero</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-blood text-sm italic">{error}</p>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Entrando…" : "⚔ Entrar"}
          </button>
        </form>
        <p className="text-ink-soft text-sm text-center">
          ¿No tienes crónica?{" "}
          <Link href="/register" className="underline text-blood font-semibold">Crear una</Link>
        </p>
      </div>
    </main>
  );
}
