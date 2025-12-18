import "./globals.css";
import { offBit } from "./fonts";

export const metadata = {
  title: "SLOW DRAG",
  description: "SLOW DRAG STUDIO",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={offBit.variable}>
      <body>{children}</body>
    </html>
  );
}
