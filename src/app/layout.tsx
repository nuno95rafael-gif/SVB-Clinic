import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVB Clinic",
  description: "Gestão clínica — SVB Clinic",
};

// Corre antes da primeira pintura para aplicar o tema guardado sem flash —
// um componente React só teria efeito depois de montar, tarde demais para
// evitar ver por uma fração de segundo o tema errado.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
