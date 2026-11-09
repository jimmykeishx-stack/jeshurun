import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Welcome Homes Agency | Your Dream Home, Our Priority",
  description: "Explore homes, land and commercial property with Welcome Homes Agency in Kenya.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: { title: "Welcome Homes Agency", description: "Your Dream Home, Our Priority.", type: "website" },
};

export default function RootLayout({ children }: {children:ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
