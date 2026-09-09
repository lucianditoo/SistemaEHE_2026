import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planillas EHE",
  description: "Sistema local de impresion de planillas EHE"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
