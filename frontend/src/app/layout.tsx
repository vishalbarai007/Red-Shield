import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Red-Shield // AI Red Team Operation Suite',
  description: 'Red-Shield: Locally-hosted, Multi-Modal Red Team Operations Suite Command Center',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-background text-foreground antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
