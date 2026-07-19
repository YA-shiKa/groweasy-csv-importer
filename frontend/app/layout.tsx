import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-powered CSV Importer",
  description: "Upload a lead CSV and let AI map it into GrowEasy CRM format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
