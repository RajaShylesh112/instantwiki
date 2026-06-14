import TabAuthSection from "@/components/login-signup";
import { Suspense } from "react";

export default function DemoOne() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50">Loading...</div>}>
      <TabAuthSection />
    </Suspense>
  );
}
