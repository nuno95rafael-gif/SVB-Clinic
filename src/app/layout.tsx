import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVB Clinic",
  description: "Gestão clínica — SVB Clinic",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
