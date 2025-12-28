import localFont from "next/font/local";

const offBit = localFont({
  src: "../public/fonts/OffBit-Regular.ttf",
  variable: "--font-offbit",
  display: "swap",
});

const offBitBold = localFont({
  src: "../public/fonts/OffBit-101Bold.ttf",
  variable: "--font-offbit-bold",
  display: "swap",
});

const offBit101 = localFont({
  src: "../public/fonts/OffBit-101.ttf",
  variable: "--font-offbit-101",
  display: "swap",
});

const offbit = offBit;

export { offBit, offBitBold, offBit101, offbit };