import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Individual Studio | BMW paint visualizer",
  description:
    "Your BMW build, in an Individual color. Explore live paint options, interior views and day or night lighting.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="app-body">
        <div className="app-shell">
          <SiteNavbar />
          <main id="main-content" className="site-content">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
