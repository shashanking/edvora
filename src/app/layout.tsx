import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Addify Academy - Personalized Online Learning",
    template: "%s | Addify Academy",
  },
  description:
    "Personalized 1-on-1 online tutoring for young learners and adults. Math, Science, English, IELTS, and more with certified educators.",
  keywords: [
    "online tutoring",
    "1-on-1 learning",
    "personalized education",
    "math tutor",
    "english tutor",
    "IELTS preparation",
    "online academy",
  ],
  openGraph: {
    title: "Addify Academy - Personalized Online Learning",
    description:
      "Personalized 1-on-1 online tutoring for young learners and adults.",
    type: "website",
    siteName: "Addify Academy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
      position="top-center"
     reverseOrder={false}
     toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#023047",
              color: "#fff",
            },
          }}
/>
      </body>
    </html>
  );
}
