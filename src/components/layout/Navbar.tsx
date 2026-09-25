'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Menu, 
  X, 
  BarChart3, 
  FileText, 
  Home, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Overview', href: '/', icon: Home },
    { name: 'Citizen Portal', href: '/citizen', icon: FileText },
    { name: 'Policymaker Dashboard', href: '/dashboard', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="civic-tricolor-bar w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Civic Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md border border-slate-700 group-hover:bg-blue-950 transition-colors">
              <Building2 className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Jan<span className="text-orange-600">Setu</span> <span className="text-blue-600 font-extrabold text-sm sm:text-base px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">AI</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-flex items-center gap-1">
                <span>जनसेतु</span>
                <span>•</span>
                <span>Citizen Development Intelligence</span>
              </span>
            </div>
          </Link>

          {/* Hackathon Badge (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Cloud: Build with AI — Code for Communities</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/citizen"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 text-white shadow-sm hover:bg-orange-700 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Report Issue</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <div className="px-2 py-1.5 mb-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Google Cloud Hackathon Prototype: Phase 1</span>
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 text-orange-500" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/citizen"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700"
            >
              <FileText className="w-4 h-4" />
              <span>Report a Development Issue</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
