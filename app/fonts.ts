import localFont from "next/font/local";

const offBit = localFont({
  src: "../public/fonts/OffBit-Regular.ttf",
  variable: "--font-offbit",
  display: "swap",
  preload: true,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
  adjustFontFallback: "Arial",
});

const offBitBold = localFont({
  src: "../public/fonts/OffBit-101Bold.ttf",
  variable: "--font-offbit-bold",
  display: "swap",
  preload: true,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
  adjustFontFallback: "Arial",
});

const offBit101 = localFont({
  src: "../public/fonts/OffBit-101.ttf",
  variable: "--font-offbit-101",
  display: "swap",
  preload: true,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
  adjustFontFallback: "Arial",
});

const offbit = offBit;

export { offBit, offBitBold, offBit101, offbit };