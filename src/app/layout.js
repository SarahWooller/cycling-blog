import "./globals.css";

export const metadata = {
  title: "VeloTales | Cycling Blog & Route Chronicles",
  description: "An immersive cycling blog platform combining stories, photography, ride metrics, and route maps with instant zero-storage link publishing.",
  referrer: "no-referrer",
};

import Providers from "@/components/Providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
