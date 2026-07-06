import { ArrowRight, CheckCircle2 } from "lucide-react";
import { dashboardMetrics } from "@/components/home/home-data";
import { HomeContainer, focusRing, primaryLinkClass, secondaryLinkClass } from "@/components/home/home-ui";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef7f1_100%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-100 to-transparent" />
      <HomeContainer className="grid min-h-[calc(100vh-112px)] items-center gap-10 py-14 sm:py-16 md:grid-cols-[1fr_0.94fr] lg:min-h-[calc(100vh-65px)] lg:gap-14 lg:py-20">
        <div className="max-w-3xl">
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] text-slate-950 sm:text-5xl lg:text-6xl">
            JinaCampus — The Complete School OS
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Manage academics, attendance, staff, fees, exams, communication, and dashboards from one calm, secure platform built for Indian schools.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className={primaryLinkClass}>
              Request a Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#modules" className={secondaryLinkClass}>
              Explore Modules
            </a>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            {["Branch-ready setup", "Attendance-first workflows", "Role-aware operations"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 shadow-sm shadow-slate-200/60">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/50">
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold">Today at Main Branch</p>
                  <p className="mt-1 text-xs text-slate-300">Operational summary</p>
                </div>
                <span className="rounded-lg bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/20">Live</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {dashboardMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className={
                        index === 0
                          ? "rounded-lg border border-white/10 bg-white/[0.09] p-4 sm:col-span-2"
                          : "rounded-lg border border-white/10 bg-white/[0.07] p-4"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-medium leading-5 text-slate-300">{metric.label}</p>
                        <Icon className="h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
                      <p className="mt-1 text-xs text-slate-300">{metric.note}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg bg-white p-4 text-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Attendance coverage</span>
                  <span>90%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100" aria-hidden="true">
                  <div className="h-2 w-[90%] rounded-full bg-emerald-600" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                  <span>Students</span>
                  <span>Staff</span>
                  <span>Alerts</span>
                </div>
              </div>
            </div>
          </div>
          <a
            href="#attendance"
            className={`mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-100 hover:text-brand-900 ${focusRing}`}
          >
            <span>Review attendance workflows</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </HomeContainer>
    </section>
  );
}
