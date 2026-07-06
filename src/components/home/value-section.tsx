import { valueCards } from "@/components/home/home-data";
import { HomeContainer, IconBadge, cardClass } from "@/components/home/home-ui";
import { SectionHeading } from "@/components/home/section-heading";

export function ValueSection() {
  return (
    <section id="features" className="scroll-mt-32 bg-white py-16 sm:py-24">
      <HomeContainer>
        <SectionHeading
          title="A calm foundation for daily school operations"
          description="JinaCampus gives school teams the structure they need for secure, repeatable work across branches, roles, records, and reports."
          align="center"
        />
        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueCards.map((card) => {
            return (
              <article key={card.title} className={`${cardClass} bg-white p-5`}>
                <IconBadge icon={card.icon} />
                <h3 className="mt-5 min-h-12 text-base font-semibold leading-6 text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </div>
      </HomeContainer>
    </section>
  );
}
