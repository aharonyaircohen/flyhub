import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Flyhub",
  description: "Fly apps, machines, previews, and browser sessions",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
