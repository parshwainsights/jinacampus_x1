import { CheckCircle2 } from "lucide-react";
import { benefits } from "@/components/home/home-data";
import { HomeContainer } from "@/components/home/home-ui";
import { SectionHeading } from "@/components/home/section-heading";

export function WhySection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <HomeContainer className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionHeading
          title="Why JinaCampus"
          description="The product is shaped around school administration, daily attendance pressure, branch-level visibility, and future expansion without making the first rollout heavy."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-200/50">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span className="text-sm font-medium leading-6 text-slate-800">{benefit}</span>
            </div>
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
