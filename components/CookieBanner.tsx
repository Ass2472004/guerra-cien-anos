"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-2xl parchment border border-bronze/60 shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-sm"
        style={{ boxShadow: "0 -4px 30px rgba(0,0,0,0.6)" }}
      >
        <div className="flex-1 space-y-1">
          <p className="font-display text-sm text-ink flex items-center gap-2">
            <span>🍪</span> Aviso de cookies
          </p>
          <p className="text-xs text-ink-soft leading-snug">
            Usamos cookies de sesión esenciales para que el juego funcione. No empleamos
            publicidad ni rastreo.{" "}
            <Link href="/privacidad" className="underline text-blood hover:text-bronze transition-colors">
              Política de privacidad
            </Link>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="text-xs px-4 py-2 border border-bronze/60 text-ink-soft hover:text-ink hover:border-bronze transition-colors rounded-sm font-display"
          >
            Rechazar
          </button>
          <button
            onClick={accept}
            className="btn-medieval text-xs px-5 py-2"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
