import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Social Buzz Scout",
  description: "2 saat içi en iyi postu bul, öneri & görsel üret",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
