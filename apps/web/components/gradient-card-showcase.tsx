import React from 'react';
import Link from 'next/link';
import { Trash2, Globe, EyeOff, Lock, Clock, FileText } from 'lucide-react';
import { Wiki } from '@/lib/repositories/wiki';

interface SkewCardsProps {
  wikis: Wiki[];
  username: string;
  onDelete: (wiki: Wiki) => void;
}

export default function SkewCards({ wikis, username, onDelete }: SkewCardsProps) {
  // Brand colors for the gradients
  const gradients = [
    { from: '#6b38d4', to: '#006b5e' }, // Purple to Emerald
    { from: '#8455ef', to: '#6ef9e2' }, // Light Purple to Light Emerald
    { from: '#2D2D2D', to: '#6b38d4' }, // Dark to Purple
  ];

  return (
    <>
      <div className="flex flex-nowrap overflow-x-auto items-center py-10 gap-10 px-6 sm:px-10 no-scrollbar snap-x">
        {wikis.map((wiki, idx) => {
          const color = gradients[idx % gradients.length];
          const updatedAt = new Date(wiki.updated_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          });

          return (
            <div
              key={wiki.id}
              className="group relative shrink-0 w-[300px] h-[380px] m-[20px_10px] transition-all duration-500 snap-center"
            >
              {/* Skewed gradient panels */}
              <span
                className="absolute top-0 left-[40px] w-1/2 h-full rounded-xl transform skew-x-[15deg] transition-all duration-500 group-hover:skew-x-0 group-hover:left-[15px] group-hover:w-[calc(100%-70px)]"
                style={{
                  background: `linear-gradient(315deg, ${color.from}, ${color.to})`,
                }}
              />
              <span
                className="absolute top-0 left-[40px] w-1/2 h-full rounded-xl transform skew-x-[15deg] blur-[25px] transition-all duration-500 group-hover:skew-x-0 group-hover:left-[15px] group-hover:w-[calc(100%-70px)]"
                style={{
                  background: `linear-gradient(315deg, ${color.from}, ${color.to})`,
                  opacity: 0.8,
                }}
              />

              {/* Animated blurs */}
              <span className="pointer-events-none absolute inset-0 z-10">
                <span className="absolute top-0 left-0 w-0 h-0 rounded-lg opacity-0 bg-[rgba(255,255,255,0.1)] backdrop-blur-[10px] shadow-[0_5px_15px_rgba(0,0,0,0.08)] transition-all duration-100 animate-blob group-hover:top-[-40px] group-hover:left-[40px] group-hover:w-[80px] group-hover:h-[80px] group-hover:opacity-100" />
                <span className="absolute bottom-0 right-0 w-0 h-0 rounded-lg opacity-0 bg-[rgba(255,255,255,0.1)] backdrop-blur-[10px] shadow-[0_5px_15px_rgba(0,0,0,0.08)] transition-all duration-500 animate-blob animation-delay-1000 group-hover:bottom-[-40px] group-hover:right-[40px] group-hover:w-[80px] group-hover:h-[80px] group-hover:opacity-100" />
              </span>

              {/* Content */}
              <div className="relative z-20 left-0 p-[25px] h-full flex flex-col justify-between bg-white/5 dark:bg-zinc-950/40 backdrop-blur-[12px] border border-white/10 dark:border-white/5 shadow-xl rounded-xl text-slate-800 dark:text-white transition-all duration-500 group-hover:left-[-20px] group-hover:p-[35px_25px]">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-black tracking-tight truncate pr-2">{wiki.title}</h2>
                    <button
                      onClick={() => onDelete(wiki)}
                      className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                      title="Delete workspace"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
                      {wiki.visibility === "PUBLIC" && <Globe className="h-3 w-3" />}
                      {wiki.visibility === "UNLISTED" && <EyeOff className="h-3 w-3" />}
                      {wiki.visibility === "PRIVATE" && <Lock className="h-3 w-3" />}
                      {wiki.visibility}
                    </span>
                    <span className="bg-white/10 px-2 py-1 rounded">{wiki.status}</span>
                  </div>

                  <p className="text-sm opacity-80 leading-relaxed line-clamp-3 font-serif">
                    {wiki.description || "No description provided for this wiki."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono opacity-70">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {wiki.page_count} pages
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {updatedAt}
                    </span>
                  </div>

                  <Link
                    href={`/u/${username}/${wiki.slug}`}
                    className="block w-full text-center text-sm font-bold text-[#6b38d4] dark:text-[#6b38d4] bg-white px-4 py-3 rounded-lg hover:bg-opacity-90 transition-all shadow-md"
                  >
                    Enter Workspace
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translateY(10px); }
          50% { transform: translate(-10px); }
        }
        .animate-blob { animation: blob 2s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: -1s; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
