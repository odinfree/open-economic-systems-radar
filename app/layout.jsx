import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@/app/globals.css";

export const metadata = {
  title: "Open Economic Systems Radar",
  description:
    "A public dashboard with four UTC refresh windows per day, tracking machine payments, stablecoin rails, open-market activity, developer pull, concentration, and authenticity.",
  openGraph: {
    title: "Open Economic Systems Radar",
    description:
      "Detecting an early shift toward open, programmable economic activity.",
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
