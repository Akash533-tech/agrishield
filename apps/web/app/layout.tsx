import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Web3Provider } from "@/components/Web3Provider";

export const metadata: Metadata = {
  title: "AgroShield — Climate resilience, proven onchain",
  description: "Parametric crop protection and verified environmental units on Monad.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Web3Provider>{children}</Web3Provider></body>
    </html>
  );
}
