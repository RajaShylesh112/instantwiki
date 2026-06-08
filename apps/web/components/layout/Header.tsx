'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const username = session?.user?.name || 'example_user'; // Fallback for dynamic links

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">InstantWiki</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {session?.user ? (
              <>
                <Link href={`/u/${username}`} className="transition-colors hover:text-foreground/80 text-foreground">
                  My Profile
                </Link>
                <Link href={`/u/${username}/upload`} className="transition-colors hover:text-foreground/80 text-foreground/60">
                  Create Wiki
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="transition-colors hover:text-foreground/80 text-foreground/60">
                  Get Started Free
                </Link>
                <Link href="/signin" className="transition-colors hover:text-foreground/80 text-foreground/60">
                  Sign In
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            {status === 'loading' ? (
              <div className="h-8 w-20 animate-pulse bg-gray-200 rounded-lg"></div> // Loading state
            ) : session?.user ? (
              <Link href="/api/auth/signout">
                <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold">
                  Sign Out
                </button>
              </Link>
            ) : (
              <Link href="/api/auth/signin">
                <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold">
                  Sign In
                </button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}