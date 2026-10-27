import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jeshurun Dealers | Property with purpose",
  description: "Explore homes, land and commercial property with Jeshurun Dealers in Kenya.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: { title: "Jeshurun Dealers", description: "Find a place in Kenya that feels right for you.", type: "website" },
};

export default function RootLayout({ children }: {children:ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
