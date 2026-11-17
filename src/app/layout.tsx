import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
// fonte pixelada do jogo
import "@fontsource/press-start-2p/400.css";
// fontes "de crime" para o nome do jogador e da gangue no cabecalho
import "@fontsource/pirata-one/400.css";
import "@fontsource/special-elite/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gangstar",
  description: "Construa seu império do crime: roubos, gangue, fábricas, porto, cassino e muito mais.",
  manifest: "/manifest.webmanifest",
  applicationName: "Gangstar",
  appleWebApp: { capable: true, title: "Gangstar", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0617",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
