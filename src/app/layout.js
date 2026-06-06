import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/AuthContext";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "CampusCart | The Student Marketplace",
  description: "Exclusively for students of Acropolis Institute. Buy, sell, and rent items within your campus.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampusCart",
  },
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CampusCart" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={outfit.className}>
        <AuthProvider>
          <Navbar />
          <div className="content-wrapper">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
