import { CalendarDays, QrCode } from "lucide-react";
import { HomeContainer, IconBadge, cardClass } from "@/components/home/home-ui";
import { SectionHeading } from "@/components/home/section-heading";

export function AttendanceSection() {
  return (
    <section id="attendance" className="scroll-mt-32 bg-white py-16 sm:py-24">
      <HomeContainer>
        <SectionHeading
          title="Attendance that matches real school routines"
          description="JinaCampus keeps attendance practical for class teachers, administrators, teachers, and staff members."
          align="center"
        />
        <div className="mt-11 grid gap-5 lg:grid-cols-2">
          <article className={`${cardClass} bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-6 sm:p-7`}>
            <IconBadge icon={CalendarDays} tone="green" />
            <h3 className="mt-6 text-2xl font-semibold text-slate-950">Daily Student Attendance</h3>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Class teachers can mark full-day attendance for their assigned class-section using active student lists, mark-all-present, individual status changes, auto-locking, and parent absence alerts.
            </p>
          </article>

          <article className={`${cardClass} bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-6 sm:p-7`}>
            <IconBadge icon={QrCode} tone="blue" />
            <h3 className="mt-6 text-2xl font-semibold text-slate-950">QR Staff Attendance</h3>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Teachers and staff can scan a secure, time-bound branch QR code for check-in and check-out. JinaCampus calculates present, late, half-day, absent status, and working duration.
            </p>
          </article>
        </div>
      </HomeContainer>
    </section>
  );
}
