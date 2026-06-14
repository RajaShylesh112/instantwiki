"use client";

import * as React from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Eye, EyeOff, Chrome, Mail, Lock, User, ArrowRight, BookOpen
} from "lucide-react";
import Link from "next/link";

export default function TabAuthSection() {
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        usernameOrEmail: loginEmail,
        password: loginPassword,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else if (result?.url) {
        router.push(result.url);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    await signIn("google", { callbackUrl });
  };

  return (
    <section className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />

      {/* header */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-[#6b38d4] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm tracking-[0.14em] uppercase font-bold text-slate-700 dark:text-zinc-300">
            INSTANT WIKI
          </span>
        </Link>
        <Button variant="outline" className="h-9 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
          <span className="mr-2">Contact</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </header>

      {/* centered card with tabs */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-slate-900 dark:text-zinc-50">Welcome</CardTitle>
            <CardDescription className="text-slate-500 dark:text-zinc-400">Log in or create an account</CardDescription>
            {error && <div className="text-sm font-semibold text-red-500 mt-2">{error}</div>}
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-zinc-950 p-1 rounded-lg">
                <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Log In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
              </TabsList>

              <div className="relative min-h-[380px]">
                {/* LOGIN */}
                <TabsContent value="login" className="space-y-5 m-0 focus-visible:outline-none data-[state=inactive]:hidden">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="login-email" className="text-slate-700 dark:text-zinc-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                        <Input
                          id="login-email"
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus-visible:ring-[#6b38d4]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="login-password" className="text-slate-700 dark:text-zinc-300">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                        <Input
                          id="login-password"
                          type={showLoginPw ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus-visible:ring-[#6b38d4]"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                          onClick={() => setShowLoginPw((v) => !v)}
                          aria-label={showLoginPw ? "Hide password" : "Show password"}
                        >
                          {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="remember" className="border-slate-300 dark:border-zinc-700 data-[state=checked]:bg-[#6b38d4] data-[state=checked]:border-[#6b38d4]" />
                        <Label htmlFor="remember" className="text-slate-600 dark:text-zinc-400 text-sm font-normal">Remember me</Label>
                      </div>
                      <a href="#" className="text-sm text-[#6b38d4] hover:underline transition-colors">Forgot password?</a>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-lg bg-[#6b38d4] text-white hover:bg-[#5a2eab] transition-colors shadow-md shadow-[#6b38d4]/10 mt-2">
                      {isLoading ? "Signing in..." : "Continue"}
                    </Button>
                  </form>

                  <div className="relative pt-2">
                    <Separator className="bg-slate-200 dark:bg-zinc-800" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-1 bg-white dark:bg-zinc-900 px-2 text-[11px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">or</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button onClick={handleGoogleSignIn} variant="outline" className="h-10 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                      <Chrome className="h-4 w-4 mr-2" /> Google
                    </Button>
                  </div>
                </TabsContent>

                {/* SIGN UP */}
                <TabsContent value="signup" className="space-y-4 m-0 focus-visible:outline-none data-[state=inactive]:hidden">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-slate-700 dark:text-zinc-300">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus-visible:ring-[#6b38d4]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="signup-email" className="text-slate-700 dark:text-zinc-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus-visible:ring-[#6b38d4]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="signup-password" className="text-slate-700 dark:text-zinc-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                      <Input
                        id="signup-password"
                        type={showSignupPw ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus-visible:ring-[#6b38d4]"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                        onClick={() => setShowSignupPw((v) => !v)}
                        aria-label={showSignupPw ? "Hide password" : "Show password"}
                      >
                        {showSignupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox id="terms" className="border-slate-300 dark:border-zinc-700 data-[state=checked]:bg-[#6b38d4] data-[state=checked]:border-[#6b38d4]" />
                    <Label htmlFor="terms" className="text-slate-600 dark:text-zinc-400 text-sm font-normal">I agree to the Terms & Privacy</Label>
                  </div>

                  <Button className="w-full h-10 rounded-lg bg-[#6b38d4] text-white hover:bg-[#5a2eab] transition-colors shadow-md shadow-[#6b38d4]/10 mt-2">Create account</Button>

                  <div className="relative pt-2">
                    <Separator className="bg-slate-200 dark:bg-zinc-800" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-1 bg-white dark:bg-zinc-900 px-2 text-[11px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">or</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button onClick={handleGoogleSignIn} variant="outline" className="h-10 rounded-lg border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                      <Chrome className="h-4 w-4 mr-2" /> Google
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>

          <CardFooter className="flex items-center justify-center text-sm text-slate-500 dark:text-zinc-400">
            Need help? <a className="ml-1 text-[#6b38d4] hover:underline" href="#">Contact support</a>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
