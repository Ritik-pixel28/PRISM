import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRISM — Simulation Studio",
  description:
    "See how your infrastructure behaves before production does. A transparent infrastructure simulation and architectural decision lab.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
