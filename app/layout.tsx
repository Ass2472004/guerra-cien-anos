import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Guerra de los Cien Años",
  description: "Juego de estrategia medieval — España, Francia e Inglaterra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} bg-stone-950 text-stone-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
