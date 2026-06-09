import Link from "next/link";
import { auth } from "auth";
import { redirect } from "next/navigation";
import Header from "@/components/header";
import { Sparkles, FileText, Link as LinkIcon, Network, Compass, ArrowRight } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#1A1C1B]">
      {/* Navigation Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Centered Hero Section */}
        <section className="max-w-[1200px] mx-auto px-16 pt-24 pb-20 text-center space-y-8">
          <div className="inline-block px-4 py-1 bg-[#6ef9e2]/25 text-[#007164] rounded-full text-xs font-bold font-mono tracking-wider">
            REVOLUTIONIZE YOUR KNOWLEDGE
          </div>

          <h1 className="text-5xl font-extrabold sm:text-6xl tracking-tight text-[#1a1c1b] leading-tight">
            Transform your documents into <br />
            <span className="bg-gradient-to-r from-[#6b38d4] via-[#8455ef] to-[#6d3bd7] bg-clip-text text-transparent">
              structured knowledge webs
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-[#494454] leading-relaxed text-lg font-serif">
            Upload PDFs, notes, research papers, or documentation. Instant Wiki turns them into a searchable website with pages, links, and knowledge graphs.
          </p>

          {/* Action buttons */}
          <div className="flex justify-center gap-4 pt-4">
            {session?.user ? (
              <Link href="/workspaces">
                <button className="bg-[#6b38d4] text-white hover:brightness-110 shadow-sm transition-all font-semibold px-8 py-3 rounded-lg text-sm active:scale-95">
                  Go to Workspaces
                </button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <button className="bg-[#6b38d4] text-white hover:brightness-110 shadow-sm transition-all font-semibold px-8 py-3 rounded-lg text-sm active:scale-95">
                    Create Wiki
                  </button>
                </Link>
                <Link href="/signin">
                  <button className="bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all font-semibold px-8 py-3 rounded-lg text-sm">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Transformation Showcase Section */}
        <section className="max-w-[1200px] mx-auto px-16 py-16">
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-[#1a1c1b] tracking-tight mb-8">
              The Transformation
            </h2>
            <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white p-6 md:p-8 hover:border-[#6b38d4]/15 transition-colors duration-300">
              <img
                src="/images/stitch_ai_powered_wiki_builder (2)/screen.png"
                alt="Before and After Transformation"
                className="w-full h-auto object-cover rounded-xl border border-slate-100"
              />
            </div>
          </div>
        </section>

        {/* Interactive Wiki Preview (Luminous Block) */}
        <section className="bg-[#f4f4f2] py-24 border-t border-slate-200 border-b">
          <div className="max-w-[1200px] mx-auto px-16 text-center space-y-12">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-[#1a1c1b] tracking-tight">
                Interactive Wiki Preview
              </h2>
              <p className="text-slate-505 text-sm max-w-lg mx-auto font-serif">
                Explore document links and entities through our dynamic force-directed workspace canvas.
              </p>
            </div>
            
            <div className="relative group max-w-4xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#6b38d4]/20 to-[#006b5e]/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
              <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
                <img
                  src="/images/stitch_ai_powered_wiki_builder (3)/screen.png"
                  alt="Knowledge Graph Preview"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="max-w-[1200px] mx-auto px-16 py-24 space-y-12">
          <h2 className="text-3xl font-extrabold text-[#1a1c1b] tracking-tight text-center">
            What Instant Wiki Builds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Pages */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:border-[#6b38d4]/15 transition-all duration-300 flex flex-col gap-5 shadow-2xs">
              <div className="w-12 h-12 bg-[#6b38d4]/10 rounded-lg flex items-center justify-center text-[#6b38d4]">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-base">Pages</h3>
                <p className="text-sm text-[#494454] leading-relaxed font-serif">
                  Generate structured pages from concepts automatically. Every document is parsed into a clean, readable web experience.
                </p>
              </div>
            </div>

            {/* Feature 2: Links */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:border-[#6b38d4]/15 transition-all duration-300 flex flex-col gap-5 shadow-2xs">
              <div className="w-12 h-12 bg-[#006b5e]/10 rounded-lg flex items-center justify-center text-[#006b5e]">
                <LinkIcon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-base">Links</h3>
                <p className="text-sm text-[#494454] leading-relaxed font-serif">
                  Connect ideas like Wikipedia. Our engine identifies cross-references between your documents to create a dense knowledge net.
                </p>
              </div>
            </div>

            {/* Feature 3: Graphs */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:border-[#6b38d4]/15 transition-all duration-300 flex flex-col gap-5 shadow-2xs">
              <div className="w-12 h-12 bg-[#855000]/10 rounded-lg flex items-center justify-center text-[#855000]">
                <Network className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-base">Graphs</h3>
                <p className="text-sm text-[#494454] leading-relaxed font-serif">
                  Visualize relationships. See the big picture with interactive maps of how your research papers and notes relate to each other.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-[1200px] mx-auto px-16 py-24 space-y-16 border-t border-slate-100">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#1a1c1b] tracking-tight">
              How It Works
            </h2>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            {/* Step 1 */}
            <div className="flex-1 text-center space-y-3">
              <div className="text-7xl font-extrabold text-[#6b38d4]/10 font-mono leading-none">01</div>
              <h3 className="text-lg font-bold text-[#1a1c1b]">Upload</h3>
              <p className="text-sm text-[#494454] leading-relaxed font-serif">
                Drag and drop your folders of PDFs, Markdowns, or Word docs.
              </p>
            </div>
            
            <div className="hidden md:flex items-center pt-8 text-slate-350 select-none">
              <ArrowRight className="h-6 w-6" />
            </div>
            
            {/* Step 2 */}
            <div className="flex-1 text-center space-y-3">
              <div className="text-7xl font-extrabold text-[#6b38d4]/10 font-mono leading-none">02</div>
              <h3 className="text-lg font-bold text-[#1a1c1b]">Analyze</h3>
              <p className="text-sm text-[#494454] leading-relaxed font-serif">
                The system scans your files to identify topics and connections.
              </p>
            </div>
            
            <div className="hidden md:flex items-center pt-8 text-slate-350 select-none">
              <ArrowRight className="h-6 w-6" />
            </div>
            
            {/* Step 3 */}
            <div className="flex-1 text-center space-y-3">
              <div className="text-7xl font-extrabold text-[#6b38d4]/10 font-mono leading-none">03</div>
              <h3 className="text-lg font-bold text-[#1a1c1b]">Publish</h3>
              <p className="text-sm text-[#494454] leading-relaxed font-serif">
                Instantly browse your documents as a professional website.
              </p>
            </div>
          </div>
        </section>

        {/* Recently Published Wikis Section / Public Wiki Gallery */}
        <section className="bg-slate-50/50 border-t border-slate-200/80 py-20">
          <div className="max-w-[1200px] mx-auto px-16 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-[#1a1c1b] tracking-tight flex items-center gap-2">
                  <Compass className="h-7 w-7 text-slate-400" />
                  Public Wiki Gallery
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Explore knowledge bases built by our community
                </p>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="group rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-[#6b38d4]/30 hover:shadow-md transition-all">
                <span className="text-[#6d3bd7] font-bold text-sm group-hover:underline block truncate">
                  Machine Learning Atlas
                </span>
                <p className="text-xs text-[#494454] mt-2 font-serif line-clamp-2 leading-relaxed">
                  A comprehensive knowledge directory mapping concepts and references.
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  <span>8 pages</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 uppercase">Public</span>
                </div>
              </div>

              <div className="group rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-[#6b38d4]/30 hover:shadow-md transition-all">
                <span className="text-[#6d3bd7] font-bold text-sm group-hover:underline block truncate">
                  Startup Handbook
                </span>
                <p className="text-xs text-[#494454] mt-2 font-serif line-clamp-2 leading-relaxed">
                  Aggregating foundational paradigms and operational guidelines.
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  <span>12 pages</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 uppercase">Public</span>
                </div>
              </div>

              <div className="group rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-[#6b38d4]/30 hover:shadow-md transition-all">
                <span className="text-[#6d3bd7] font-bold text-sm group-hover:underline block truncate">
                  Travel Knowledge Base
                </span>
                <p className="text-xs text-[#494454] mt-2 font-serif line-clamp-2 leading-relaxed">
                  Structured reference documentation organizing travel logistics.
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  <span>5 pages</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 uppercase">Public</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#FAFAF8] border-t border-slate-200/80 py-8">
        <div className="max-w-[1200px] mx-auto px-16 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#1a1c1b]">
              INSTANT WIKI
            </span>
            <p className="text-xs text-[#494454]">Built by creators. Powered by Instant Wiki.</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 text-xs font-mono text-[#494454]">
            <div className="flex gap-6">
              <a className="hover:text-[#6b38d4] transition-colors" href="#">Privacy</a>
              <a className="hover:text-[#6b38d4] transition-colors" href="#">Terms</a>
              <a className="hover:text-[#6b38d4] transition-colors" href="#">Support</a>
            </div>
            <span className="text-[#006b5e] bg-[#6ef9e2]/15 px-3 py-0.5 rounded-full text-[10px]">
              12,483 pages generated today
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}