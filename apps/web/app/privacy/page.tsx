import Header from "@/components/header";
import { Footer } from "@/components/ui/footer";

export const metadata = {
  title: "Privacy Policy | instant.wiki",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-slate-900 dark:text-zinc-150 font-sans">
      <Header />
      <main className="flex-1 py-16 px-6 max-w-3xl mx-auto w-full prose dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, build a knowledge base, or communicate with us. This may include your name, email address, and the content you host on our platform.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services.</li>
          <li>Process transactions and send related information.</li>
          <li>Send you technical notices, updates, security alerts, and support messages.</li>
          <li>Respond to your comments, questions, and customer service requests.</li>
        </ul>

        <h2>3. Data Storage and Security</h2>
        <p>This site uses secure database infrastructure for sessions and authentication. Data provided to this site is exclusively used to support signing in and providing our core wiki services. We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>

        <h2>4. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as necessary to provide our services (such as our payment processors like Paddle), comply with the law, or protect our rights.</p>

        <h2>5. Your Rights</h2>
        <p>You have the right to access, update, or delete your information at any time through your account settings or by contacting our support team.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@instant.wiki.</p>
      </main>
      <Footer />
    </div>
  );
}
