// Layout principal - se aplica a todas las páginas de la aplicación
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Importamos el componente Navbar
import Navbar from "@/components/Navbar";
// Importamos el Provider de autenticación
import AuthProvider from "@/components/AuthProvider";
// Importamos el Provider del carrito
import { CartProvider } from "@/contexts/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata de la aplicación - aparece en el título del navegador y SEO
export const metadata: Metadata = {
  title: "Datsusara - Artesanías hechas a mano",
  description: "Piezas únicas elaboradas artesanalmente. Carteras, riñoneras, materas y más, hechas con amor y dedicación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* AuthProvider envuelve toda la app para manejar la sesión */}
        <AuthProvider>
          {/* CartProvider envuelve toda la app para manejar el carrito */}
          <CartProvider>
            {/* Navbar aparece en todas las páginas */}
            <Navbar />
            
            {/* Banner de promociones animado */}
            <div className="promo-banner">
              <div className="promo-content">
                <span className="promo-text">🎉 ¡Envío GRATIS en compras desde $100.000!</span>
                <span className="promo-separator">•</span>
                <span className="promo-text">🛍️ Con la compra de 6 productos, envío gratis</span>
                <span className="promo-separator">•</span>
                <span className="promo-text">🎉 ¡Envío GRATIS en compras desde $100.000!</span>
                <span className="promo-separator">•</span>
                <span className="promo-text">🛍️ Con la compra de 6 productos, envío gratis</span>
                <span className="promo-separator">•</span>
              </div>
              <div className="promo-content">
                <span className="promo-text">🎉 ¡Envío GRATIS en compras desde $100.000!</span>
                <span className="promo-separator">•</span>
                <span className="promo-text">🛍️ Con la compra de 6 productos, envío gratis</span>
                <span className="promo-separator">•</span>
                <span className="promo-text">🎉 ¡Envío GRATIS en compras desde $100.000!</span>
                <span className="promo-separator">•</span>
                <span className="promo-text">🛍️ Con la compra de 6 productos, envío gratis</span>
                <span className="promo-separator">•</span>
              </div>
            </div>
            
            {/* Aquí se renderiza el contenido de cada página */}
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
