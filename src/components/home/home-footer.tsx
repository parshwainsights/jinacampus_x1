import Link from "next/link";
import { focusRing, HomeContainer } from "@/components/home/home-ui";

const footerLinks = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Contact", href: "#contact" },
  { label: "Login", href: "/login" }
] as const;

export function HomeFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <HomeContainer className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-950">JinaCampus</p>
          <p className="mt-1 text-sm text-slate-500">powered by Parshav Insights</p>
          <p className="mt-2 text-sm font-medium text-slate-700">The Complete School OS</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
          {footerLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} href={link.href} className={`rounded-lg text-sm font-medium text-slate-600 hover:text-brand-900 ${focusRing}`}>
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className={`rounded-lg text-sm font-medium text-slate-600 hover:text-brand-900 ${focusRing}`}>
                {link.label}
              </a>
            )
          )}
        </nav>
      </HomeContainer>
    </footer>
  );
}
