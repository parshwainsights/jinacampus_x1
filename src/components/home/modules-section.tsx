import { modules } from "@/components/home/home-data";
import { HomeContainer, IconBadge, cardClass } from "@/components/home/home-ui";
import { SectionHeading } from "@/components/home/section-heading";

export function ModulesSection() {
  return (
    <section id="modules" className="scroll-mt-32 border-y border-slate-200 bg-slate-50 py-16 sm:py-24">
      <HomeContainer>
        <SectionHeading
          title="Modules for the full school lifecycle"
          description="Start with the operating foundation, then expand into academics, staff attendance, fees, exams, communication, and management reporting."
        />
        <div className="mt-11 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            return (
              <article key={module.name} className={`${cardClass} bg-white p-5`}>
                <div className="flex items-start gap-4">
                  <IconBadge icon={module.icon} tone="slate" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{module.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </HomeContainer>
    </section>
  );
}
