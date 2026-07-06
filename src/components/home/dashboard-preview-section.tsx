import { previewCards } from "@/components/home/home-data";
import { HomeContainer } from "@/components/home/home-ui";
import { SectionHeading } from "@/components/home/section-heading";

const toneClass: Record<(typeof previewCards)[number]["tone"], string> = {
  green: "bg-emerald-50 text-emerald-800",
  red: "bg-rose-50 text-rose-800",
  amber: "bg-amber-50 text-amber-800",
  blue: "bg-sky-50 text-sky-800",
  slate: "bg-slate-100 text-slate-800",
  violet: "bg-indigo-50 text-indigo-800"
};

export function DashboardPreviewSection() {
  return (
    <section className="bg-slate-950 py-16 text-white sm:py-24">
      <HomeContainer>
        <SectionHeading
          title="A dashboard principals can scan quickly"
          description="Static previews show how school leaders can review attendance, staff, fees, classes, and notices without digging through separate systems."
          tone="dark"
        />
        <div className="mt-11 rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-slate-950/30 sm:p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-semibold">Principal Summary</h3>
              <p className="mt-1 text-sm text-slate-300">Main Branch · Today</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
              <span className="rounded-lg border border-white/10 px-3 py-2">Academics</span>
              <span className="rounded-lg border border-white/10 px-3 py-2">Fees</span>
              <span className="rounded-lg border border-white/10 px-3 py-2">Staff</span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewCards.map((card) => (
              <article key={card.label} className="rounded-lg bg-white p-5 text-slate-950 shadow-lg shadow-slate-950/10">
                <div className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${toneClass[card.tone]}`}>{card.label}</div>
                <p className="mt-4 text-3xl font-semibold">{card.value}</p>
              </article>
            ))}
          </div>
        </div>
      </HomeContainer>
    </section>
  );
}
