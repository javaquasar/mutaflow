import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutaflow Published Next App Example",
  description: "A visual demo app that consumes the published Mutaflow packages from npm.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
