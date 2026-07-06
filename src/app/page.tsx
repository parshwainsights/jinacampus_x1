import { AttendanceSection } from "@/components/home/attendance-section";
import { CtaSection } from "@/components/home/cta-section";
import { DashboardPreviewSection } from "@/components/home/dashboard-preview-section";
import { HeroSection } from "@/components/home/hero-section";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeNavbar } from "@/components/home/home-navbar";
import { ModulesSection } from "@/components/home/modules-section";
import { ValueSection } from "@/components/home/value-section";
import { WhySection } from "@/components/home/why-section";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <HomeNavbar />
      <HeroSection />
      <ValueSection />
      <ModulesSection />
      <AttendanceSection />
      <DashboardPreviewSection />
      <WhySection />
      <CtaSection />
      <HomeFooter />
    </main>
  );
}
