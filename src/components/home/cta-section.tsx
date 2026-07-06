import { ArrowRight, Mail } from "lucide-react";
import { HomeContainer, primaryLinkClass, secondaryLinkClass } from "@/components/home/home-ui";

export function CtaSection() {
  return (
    <section id="pricing" className="scroll-mt-32 border-t border-slate-200 bg-slate-50 py-16 sm:py-24">
      <HomeContainer>
        <div id="contact" className="scroll-mt-32 rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-xl shadow-slate-200/70 sm:px-10 lg:px-16">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">Ready to modernize your school operations?</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
            Start with CampusCore, Academia, and StaffBoard Lite — then expand into fees, exams, communication, and dashboards.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="mailto:contact@parshavinsights.com?subject=JinaCampus%20Demo%20Request" className={primaryLinkClass}>
              Request Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="mailto:contact@parshavinsights.com" className={secondaryLinkClass}>
              Contact Parshav Insights
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </HomeContainer>
    </section>
  );
}
