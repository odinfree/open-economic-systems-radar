import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@/app/globals.css";

export const metadata = {
  title: "Open Economic Systems Radar",
  description:
    "A public dashboard tracking software payments, stablecoin supply, open trading, package activity, concentration, and independent use.",
  openGraph: {
    title: "Open Economic Systems Radar",
    description:
      "Track software paying through open economic systems.",
    type: "website"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
