import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'JanSetu AI | Turning Citizen Voices into Development Priorities',
  description: 'AI-powered citizen development intelligence platform for India. Bridges citizen grievances and evidence-based public infrastructure allocation using Gemini AI.',
  keywords: [
    'JanSetu AI',
    'Civic Tech India',
    'GovTech India',
    'Citizen Intelligence',
    'Gemini AI',
    'Google Cloud Hackathon',
    'Public Infrastructure Prioritization',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-orange-100 selection:text-orange-900">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
