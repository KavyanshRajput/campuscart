import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/AuthContext";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "CampusCart | The Student Marketplace",
  description: "Exclusively for students of Acropolis Institute. Buy, sell, and rent items within your campus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <AuthProvider>
          <Navbar />
          <div className="content-wrapper">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
