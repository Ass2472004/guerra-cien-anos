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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al registrar"); return; }
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-sm bg-stone-900 rounded-xl p-8 border border-stone-800 space-y-6">
        <h1 className="text-2xl font-bold text-amber-400 text-center">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1">Nombre</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
              required minLength={6}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
        <p className="text-stone-500 text-sm text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-amber-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
