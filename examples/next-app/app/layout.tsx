import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutaflow Next App Example",
  description: "App Router example with real server actions and a Mutaflow devtools panel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
