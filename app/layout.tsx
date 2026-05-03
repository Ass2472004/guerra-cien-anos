import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Nahkor — Crónicas del Mundo Oscuro",
  description: "Juego de estrategia en el Mundo Nahkor — Portadores, Imperio Matriarcal y la Federación de Rha'miras",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${cormorant.variable}`}>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
