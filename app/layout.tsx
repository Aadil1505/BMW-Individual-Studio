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

const title = "BMW Individual Studio | Your build, in your color";
const description =
  "See your BMW build in BMW Individual colors. Import a build code, explore paint finishes, preview exterior and interior views, and share your configuration.";
const socialImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Your BMW. Your color. A Riviera Blue BMW M4 Competition on a light background, from Individual Studio.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bmw-individual-studio.vercel.app"),
  title: { default: title, template: "%s | BMW Individual Studio" },
  description,
  applicationName: "BMW Individual Studio",
  authors: [{ name: "Aadil1505", url: "https://github.com/Aadil1505" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BMW Individual Studio",
    url: "/",
    title,
    description,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
  robots: { index: true, follow: true },
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
