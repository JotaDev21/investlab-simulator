import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvestLab · Seu laboratório financeiro",
  description: "Aprenda a investir experimentando com dinheiro fictício, juros compostos e uma máquina do tempo financeira.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
