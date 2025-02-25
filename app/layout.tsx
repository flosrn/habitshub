import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AppProvider } from "./AppProvider";
import "./globals.css";

const font = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "HabitsHub",
  description: "Habits tracking hub for developers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={font.className} lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
