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
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "ACORDE — Aprende, toca y entiende la armonía",
    description: "Laboratorio interactivo de acordes, inversiones, extensiones y teoría musical con conexión MIDI en tiempo real.",
    openGraph: {
      title: "ACORDE — Aprende. Toca. Entiende.",
      description: "Acordes, teoría y feedback MIDI en tiempo real.",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "ACORDE, laboratorio interactivo de armonía" }],
    },
    twitter: { card: "summary_large_image", title: "ACORDE", description: "Aprende. Toca. Entiende.", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
