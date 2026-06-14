import Header from "@/components/header";
import { Footer } from "@/components/ui/footer";

export const metadata = {
  title: "Refund Policy | instant.wiki",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-slate-900 dark:text-zinc-150 font-sans">
      <Header />
      <main className="flex-1 py-16 px-6 max-w-3xl mx-auto w-full prose dark:prose-invert">
        <h1>Refund Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Subscription Cancellations</h2>
        <p>You can cancel your subscription at any time. If you cancel, you will not be billed for any additional terms of service, and your subscription will remain active until the end of your current billing cycle.</p>

        <h2>2. Refund Eligibility</h2>
        <p>We offer a 14-day money-back guarantee for all new Pro subscriptions. If you are not satisfied with our service within the first 14 days of your initial purchase, you are eligible for a full refund, no questions asked.</p>
        
        <h2>3. Renewals</h2>
        <p>Refunds are generally not provided for subscription renewals. We will send a reminder email prior to your subscription renewing. It is your responsibility to cancel your subscription before the renewal date if you no longer wish to use the service.</p>

        <h2>4. How to Request a Refund</h2>
        <p>To request a refund within the eligible 14-day period, please contact our support team at support@instant.wiki with your account details and receipt. We will process your refund within 5-10 business days.</p>

        <h2>5. Exceptional Circumstances</h2>
        <p>If you experience significant technical issues that prevent you from using the service, and our support team is unable to resolve them, we may, at our sole discretion, issue a prorated refund outside of the standard 14-day window.</p>
      </main>
      <Footer />
    </div>
  );
}
