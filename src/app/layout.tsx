import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "~/app/_components/providers";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "T3 Todo",
  description: "Learn the T3 stack by building a Todo app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        {/* SessionProvider (Auth) wraps tRPC so client forms can call signIn() */}
        <Providers>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
