"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
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
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full" required minLength={6} />
          </div>
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
