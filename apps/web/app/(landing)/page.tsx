import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { auth } from "auth";
import { redirect } from "next/navigation";
import Header from "@/components/header";
import { Compass, FileText, Link as LinkIcon, Network, ArrowRight } from "lucide-react";
import { Footer } from "@/components/ui/footer";

import { AnimatedBackgroundLines } from "@/components/ui/animated-background-lines";

export default async function LandingPage() {
  const session = await auth();

  let publicWikis: any[] = [];
  try {
    const { data, error } = await supabase
      .from("wikis")
      .select(`
        id,
        title,
        slug,
        description,
        owner_id,
        users (username),
        wiki_pages (count)
      `)
      .eq("visibility", "PUBLIC")
      .order("created_at", { ascending: false });

    if (!error && data) {
      publicWikis = data;
    }
  } catch (err) {
    console.error("Error fetching public wikis for gallery:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-[#1A1C1B] dark:text-zinc-100 relative overflow-hidden">
      {/* Ambient background glowing blobs for the whole page */}
      <div className="fixed top-[20%] -left-[20%] w-[50%] h-[60%] bg-[#6b38d4]/15 dark:bg-[#6b38d4]/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen opacity-70" />
      <div className="fixed top-[50%] -right-[20%] w-[50%] h-[60%] bg-[#006b5e]/15 dark:bg-[#006b5e]/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen opacity-70" />

      {/* Navigation Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Centered Hero Section */}
        <AnimatedBackgroundLines>
          <section className="max-w-[1200px] mx-auto px-6 md:px-16 pt-24 md:pt-32 pb-16 md:pb-24 text-center space-y-6 md:space-y-8 relative z-10">
            <div className="inline-block px-4 py-1 bg-[#6ef9e2]/25 text-[#007164] rounded-full text-xs font-bold font-mono tracking-wider">
              REVOLUTIONIZE YOUR KNOWLEDGE
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#1a1c1b] dark:text-white leading-tight">
              Turn your scattered documents into a <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#6b38d4] via-[#8455ef] to-[#6d3bd7] bg-clip-text text-transparent">
                beautiful, searchable wiki
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-[#494454] dark:text-zinc-300 leading-relaxed text-lg font-serif">
              Upload PDFs, notes, research papers, or documentation. Instant Wiki turns them into a searchable website with pages, links, and knowledge graphs.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-4">
              {session?.user ? (
                <Link href="/workspaces" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-[#6b38d4] text-white hover:brightness-110 shadow-sm transition-all font-semibold px-8 py-3 rounded-lg text-sm active:scale-95">
                    Go to Workspaces
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-[#6b38d4] text-white hover:brightness-110 shadow-sm transition-all font-semibold px-8 py-3 rounded-lg text-sm active:scale-95">
                      Create Wiki
                    </button>
                  </Link>
                  <Link href="/signin" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-white/50 dark:bg-black/50 backdrop-blur border border-slate-200 dark:border-zinc-800 hover:bg-slate-50/80 dark:hover:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 transition-all font-semibold px-8 py-3 rounded-lg text-sm">
                      Sign In
                    </button>
                  </Link>
                </>
              )}
            </div>
          </section>
        </AnimatedBackgroundLines>

        {/* Transformation Showcase Section */}
        <section className="max-w-[1200px] mx-auto px-6 md:px-16 py-12 md:py-16">
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-[#1a1c1b] dark:text-white tracking-tight mb-8">
              The Transformation
            </h2>
            <div className="w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-zinc-800/60 bg-gradient-to-br from-[#6b38d4]/10 via-white to-[#006b5e]/10 dark:from-[#6b38d4]/20 dark:via-zinc-900/90 dark:to-[#006b5e]/20 p-6 md:p-8 hover:border-[#6b38d4]/30 transition-all duration-500 backdrop-blur-md">
              <img
                src="/images/stitch_ai_powered_wiki_builder (2)/screen.png"
                alt="Before and After Transformation"
                className="w-full h-auto object-cover rounded-xl border border-white/50 dark:border-white/10 shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Interactive Wiki Preview (Luminous Block) */}
        <section className="bg-[#f4f4f2]/50 dark:bg-zinc-900/20 py-16 md:py-24 border-t border-slate-200 dark:border-zinc-800 border-b dark:border-zinc-800">
          <div className="max-w-[1200px] mx-auto px-6 md:px-16 text-center space-y-8 md:space-y-12">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-[#1a1c1b] dark:text-white tracking-tight">
                Interactive Wiki Preview
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-lg mx-auto font-serif">
                Explore document links and entities through our dynamic force-directed workspace canvas.
              </p>
            </div>
            
            <div className="relative group max-w-4xl mx-auto">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#6b38d4] to-[#006b5e] rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000" />
              <div className="relative bg-gradient-to-bl from-[#006b5e]/15 via-white to-[#6b38d4]/15 dark:from-[#006b5e]/25 dark:via-zinc-900/95 dark:to-[#6b38d4]/25 rounded-3xl border border-white/60 dark:border-zinc-700/50 overflow-hidden shadow-2xl p-4 md:p-6 backdrop-blur-md">
                <img
                  src="/images/stitch_ai_powered_wiki_builder (3)/screen.png"
                  alt="Knowledge Graph Preview"
                  className="w-full h-auto block rounded-xl border border-white/50 dark:border-white/10 shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="max-w-[1200px] mx-auto px-6 md:px-16 py-16 md:py-24 space-y-8 md:space-y-12">
          <h2 className="text-3xl font-extrabold text-[#1a1c1b] dark:text-white tracking-tight text-center">
            What Instant Wiki Builds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Pages */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-[#6b38d4]/15 dark:hover:border-purple-500/15 transition-all duration-300 flex flex-col gap-5 shadow-2xs">
              <div className="w-12 h-12 bg-[#6b38d4]/10 dark:bg-purple-950/30 rounded-lg flex items-center justify-center text-[#6b38d4] dark:text-purple-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Pages</h3>
                <p className="text-sm text-[#494454] dark:text-zinc-300 leading-relaxed font-serif">
                  Generate structured pages from concepts automatically. Every document is parsed into a clean, readable web experience.
                </p>
              </div>
            </div>

            {/* Feature 2: Links */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-[#6b38d4]/15 dark:hover:border-purple-500/15 transition-all duration-300 flex flex-col gap-5 shadow-2xs">
              <div className="w-12 h-12 bg-[#006b5e]/10 dark:bg-[#006b5e]/25 rounded-lg flex items-center justify-center text-[#006b5e] dark:text-emerald-400">
                <LinkIcon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Links</h3>
                <p className="text-sm text-[#494454] dark:text-zinc-300 leading-relaxed font-serif">
                  Connect ideas like Wikipedia. Our engine identifies cross-references between your documents to create a dense knowledge net.
                </p>
              </div>
            </div>

            {/* Feature 3: Graphs */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-[#6b38d4]/15 dark:hover:border-purple-500/15 transition-all duration-300 flex flex-col gap-5 shadow-2xs">
              <div className="w-12 h-12 bg-[#855000]/10 dark:bg-amber-950/30 rounded-lg flex items-center justify-center text-[#855000] dark:text-amber-400">
                <Network className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Graphs</h3>
                <p className="text-sm text-[#494454] dark:text-zinc-300 leading-relaxed font-serif">
                  Visualize relationships. See the big picture with interactive maps of how your research papers and notes relate to each other.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-[1200px] mx-auto px-6 md:px-16 py-16 md:py-24 space-y-12 md:space-y-16 border-t border-slate-100 dark:border-zinc-800">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#1a1c1b] dark:text-white tracking-tight">
              How It Works
            </h2>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            {/* Step 1 */}
            <div className="flex-1 text-center space-y-3">
              <div className="text-7xl font-extrabold text-[#6b38d4]/10 dark:text-purple-400/10 font-mono leading-none">01</div>
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">Upload</h3>
              <p className="text-sm text-[#494454] dark:text-zinc-300 leading-relaxed font-serif">
                Drag and drop your folders of PDFs, Markdowns, or Word docs.
              </p>
            </div>
            
            <div className="hidden md:flex items-center pt-8 text-slate-350 dark:text-zinc-700 select-none">
              <ArrowRight className="h-6 w-6" />
            </div>
            
            {/* Step 2 */}
            <div className="flex-1 text-center space-y-3">
              <div className="text-7xl font-extrabold text-[#6b38d4]/10 dark:text-purple-400/10 font-mono leading-none">02</div>
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">Analyze</h3>
              <p className="text-sm text-[#494454] dark:text-zinc-300 leading-relaxed font-serif">
                The system scans your files to identify topics and connections.
              </p>
            </div>
            
            <div className="hidden md:flex items-center pt-8 text-slate-350 dark:text-zinc-700 select-none">
              <ArrowRight className="h-6 w-6" />
            </div>
            
            {/* Step 3 */}
            <div className="flex-1 text-center space-y-3">
              <div className="text-7xl font-extrabold text-[#6b38d4]/10 dark:text-purple-400/10 font-mono leading-none">03</div>
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">Publish</h3>
              <p className="text-sm text-[#494454] dark:text-zinc-300 leading-relaxed font-serif">
                Instantly browse your documents as a professional website.
              </p>
            </div>
          </div>
        </section>

        {/* Recently Published Wikis Section / Public Wiki Gallery */}
        <section className="bg-slate-50/50 dark:bg-zinc-900/30 border-t border-slate-200/80 dark:border-zinc-800 py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-6 md:px-16 space-y-8 md:space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-[#1a1c1b] dark:text-white tracking-tight flex items-center gap-2">
                  <Compass className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
                  Public Wiki Gallery
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  Explore knowledge bases built by our community
                </p>
              </div>
            </div>
            
            {publicWikis.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400 dark:text-zinc-500 font-mono border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-2xs">
                No public wikis published yet. Be the first to publish!
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {publicWikis.map((wiki) => {
                  const username = wiki.users?.username || "sandbox";
                  const pageCount = wiki.wiki_pages?.[0]?.count || 0;
                  return (
                    <Link
                      key={wiki.id}
                      href={`/u/${username}/${wiki.slug}`}
                      className="group rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-left hover:border-[#6b38d4]/30 dark:hover:border-purple-500/30 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[#6d3bd7] dark:text-purple-400 font-bold text-sm group-hover:underline block truncate">
                          {wiki.title}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 block mt-0.5">
                          by @{username}
                        </span>
                        <p className="text-xs text-[#494454] dark:text-zinc-300 mt-2 font-serif line-clamp-2 leading-relaxed">
                          {wiki.description || "A comprehensive knowledge directory mapping concepts and references."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        <span>{pageCount} page{pageCount !== 1 ? "s" : ""}</span>
                        <span className="bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/40 uppercase">Public</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}