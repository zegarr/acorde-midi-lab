import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-learning.png`;

  return {
    title: "ACORDE 3 — Tu ruta interactiva de piano moderno",
    description: "Aprende técnica, ritmo, oído, lectura, acordes e improvisación con una ruta diaria, feedback MIDI y seguimiento local.",
    openGraph: {
      title: "ACORDE 3 — Aprende. Toca. Entiende.",
      description: "Una ruta completa de piano moderno con práctica MIDI adaptativa.",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "ACORDE 3, ruta interactiva de piano moderno" }],
    },
    twitter: { card: "summary_large_image", title: "ACORDE 3", description: "Aprende técnica, oído, lectura y armonía con tu teclado MIDI.", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
