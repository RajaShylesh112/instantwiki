
'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`sidebar-item flex items-center gap-3 px-3 py-2 text-sm rounded-md font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'
      }`}
    >
      {children}
    </Link>
  );
}

function WikiNav({ username }: { username: string }) {
    const params = useParams();
    const wikiSlug = params.wiki_slug as string;
    const wikiName = wikiSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="mb-8">
            <h2 className="px-3 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-4">{wikiName}</h2>
            <nav className="space-y-0.5">
                <NavLink href={`/u/${username}/${wikiSlug}`}>
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    Overview
                </NavLink>
                <NavLink href={`/u/${username}/${wikiSlug}/`}>
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    Pages
                </NavLink>
                <NavLink href={`/u/${username}/${wikiSlug}/graph`}>
                    <span className="material-symbols-outlined text-[18px]">account_tree</span>
                    Knowledge Graph
                </NavLink>
                <NavLink href={`/u/${username}/${wikiSlug}/sources`}>
                    <span className="material-symbols-outlined text-[18px]">folder</span>
                    Sources
                </NavLink>
            </nav>
        </div>
    )
}

function ProfileNav({ username }: { username: string }) {
    return (
        <div className="mb-8">
            <h2 className="px-3 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mb-4">My Profile</h2>
            <nav className="space-y-0.5">
                <NavLink href={`/u/${username}`}>
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    My Wikis
                </NavLink>
                 <NavLink href={`/u/${username}/upload`}>
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Upload
                </NavLink>
            </nav>
        </div>
    )
}


export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const params = useParams();
    const username = params.username as string;

    const isWikiSpecificPage = pathname.startsWith(`/u/${username}/`) && pathname.split('/').length > 3;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 fixed inset-y-0 left-0 bg-surface border-r border-outline flex flex-col z-40">
        <div className="p-6">
            <Link href={`/u/${username}`} className="flex items-center gap-3 mb-8">
                <div className="h-7 w-7 flex items-center justify-center bg-primary rounded-md text-white">
                <span className="material-symbols-outlined text-[18px]">hub</span>
                </div>
                <span className="font-headline font-bold text-sm tracking-tight">InstantWiki</span>
            </Link>
            
            {isWikiSpecificPage ? <WikiNav username={username} /> : <ProfileNav username={username} />}

        </div>
        <div className="mt-auto p-4 border-t border-outline">
            <NavLink href={`/u/${username}/settings`}>
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Settings
            </NavLink>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
