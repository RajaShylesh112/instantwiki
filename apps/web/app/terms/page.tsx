import Header from "@/components/header";
import { Footer } from "@/components/ui/footer";

export const metadata = {
  title: "Terms of Service | instant.wiki",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-slate-900 dark:text-zinc-150 font-sans">
      <Header />
      <main className="flex-1 py-16 px-6 max-w-3xl mx-auto w-full prose dark:prose-invert">
        <h1>Terms of Service</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Agreement to Terms</h2>
        <p>By accessing or using instant.wiki, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you do not have permission to access the Service.</p>

        <h2>2. Use License</h2>
        <p>We grant you a personal, non-exclusive, non-transferable, limited license to use our platform to create and host knowledge bases and documentation.</p>

        <h2>3. User Content</h2>
        <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.</p>
        <p>By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service solely to provide you the Service.</p>

        <h2>4. Prohibited Uses</h2>
        <p>You agree not to use the Service:</p>
        <ul>
          <li>In any way that violates any applicable national or international law or regulation.</li>
          <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
          <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
        </ul>

        <h2>5. Termination</h2>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

        <h2>6. Changes</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.</p>
      </main>
      <Footer />
    </div>
  );
}
