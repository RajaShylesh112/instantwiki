import React from "react";
import { Instagram, Facebook, Twitter, Linkedin, Sparkles } from "lucide-react";
import Link from "next/link";

interface FooterProps {
  logo?: {
    url: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSections = [
  {
    title: "Product",
    links: [
      { name: "Overview", href: "/" },
      { name: "Pricing", href: "/pricing" },
      { name: "Workspaces", href: "/workspaces" },
      { name: "Features", href: "/#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/#about" },
      { name: "Team", href: "/#team" },
      { name: "Blog", href: "/#blog" },
      { name: "Careers", href: "/#careers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Help Center", href: "/#help" },
      { name: "Community", href: "/#community" },
      { name: "Documentation", href: "/#docs" },
      { name: "Privacy", href: "/privacy" },
      { name: "Refunds", href: "/refund" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <Instagram className="h-5 w-5" />, href: "#", label: "Instagram" },
  { icon: <Facebook className="h-5 w-5" />, href: "#", label: "Facebook" },
  { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter" },
  { icon: <Linkedin className="h-5 w-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Terms and Conditions", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Refund Policy", href: "/refund" },
];

export const Footer = ({
  logo = {
    url: "/",
    title: "instant.wiki",
  },
  sections = defaultSections,
  description = "Turn your scattered documents into a beautiful, searchable wiki.",
  socialLinks = defaultSocialLinks,
  copyright = "© 2026 instant.wiki. All rights reserved.",
  legalLinks = defaultLegalLinks,
}: FooterProps) => {
  return (
    <footer className="py-16 md:py-20 border-t border-slate-200/80 dark:border-zinc-800 bg-[#FAFAF8] dark:bg-zinc-950 font-sans z-10 relative">
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
            {/* Logo */}
            <div className="flex items-center gap-2 lg:justify-start">
              <Link href={logo.url} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="text-2xl font-black bg-gradient-to-r from-[#6b38d4] to-[#006b5e] dark:from-purple-400 dark:to-emerald-400 bg-clip-text text-transparent tracking-tight">
                  {logo.title}
                </span>
              </Link>
            </div>
            <p className="max-w-[70%] text-sm text-slate-500 dark:text-zinc-400 font-serif leading-relaxed">
              {description}
            </p>
            <ul className="flex items-center space-x-6 text-slate-400 dark:text-zinc-500">
              {socialLinks.map((social, idx) => (
                <li key={idx} className="font-medium hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors">
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid w-full gap-8 grid-cols-2 md:grid-cols-3 lg:gap-20">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold text-slate-900 dark:text-white">{section.title}</h3>
                <ul className="space-y-3 text-sm text-slate-500 dark:text-zinc-400">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="font-medium hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors"
                    >
                      <Link href={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-slate-200 dark:border-zinc-800 pt-8 text-xs font-medium text-slate-400 dark:text-zinc-500 md:flex-row md:items-center md:text-left">
          <p className="order-2 lg:order-1 font-mono">{copyright}</p>
          <ul className="order-1 flex flex-col gap-3 md:order-2 md:flex-row md:gap-6">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors">
                <Link href={link.href}> {link.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};
