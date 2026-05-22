'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

interface NavbarProps {
  user: {
    email?: string;
    displayName: string;
    avatarUrl: string;
  } | null;
}

export default function NavbarClient({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full bg-surface-container-high/50 backdrop-blur-md shadow-sm">
      <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto h-20">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-headline-lg text-headline-lg font-bold tracking-tighter text-secondary dark:text-secondary-fixed-dim">
            AeroLux
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <Link href="/" className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200">
              Book
            </Link>
            <Link href="/bookings" className="font-label-sm text-label-sm text-secondary font-bold border-b-2 border-secondary pb-1">
              My Bookings
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-4 text-on-surface-variant">
          </div>

          {/* Desktop auth section */}
          <div className="hidden md:block">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-3 pl-4 border-l border-outline-variant/30 hover:opacity-80 transition-opacity duration-200 group"
              >
                <span className="font-label-sm text-label-sm text-on-surface group-hover:text-secondary transition-colors duration-200">
                  {user.displayName}
                </span>
                <Image
                  width={32}
                  height={32}
                  alt="User profile avatar"
                  className="rounded-full bg-surface-variant ring-1 ring-secondary/20 group-hover:ring-secondary transition-all duration-200"
                  src={user.avatarUrl}
                />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 pl-4 border-l border-outline-variant/30 text-secondary hover:text-secondary-fixed transition-colors duration-200"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span className="font-label-sm text-label-sm">Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden material-symbols-outlined text-on-surface p-2 rounded-lg hover:bg-surface-variant/50 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? "close" : "menu"}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-surface-container border-t border-outline-variant/20 px-margin-mobile py-6 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface transition-all font-label-sm text-label-sm"
          >
            <span className="material-symbols-outlined text-lg">flight_takeoff</span>
            Book a Flight
          </Link>
          <Link
            href="/bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface transition-all font-label-sm text-label-sm"
          >
            <span className="material-symbols-outlined text-lg">airplane_ticket</span>
            My Bookings
          </Link>

          <div className="h-[1px] bg-outline-variant/20 my-3" />

          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface transition-all font-label-sm text-label-sm"
              >
                <Image
                  width={24}
                  height={24}
                  alt="User profile avatar"
                  className="rounded-full bg-surface-variant ring-1 ring-secondary/20"
                  src={user.avatarUrl}
                />
                <span>{user.displayName}</span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all font-label-sm text-label-sm font-bold"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
