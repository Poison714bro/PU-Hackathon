import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS | Cyber Intelligence Platform",
  description: "Law Enforcement Cyber Intelligence Platform for detecting, tracking, and analyzing illicit drug sales across darknet marketplaces and encrypted platforms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
