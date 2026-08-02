import type {
  DashboardAttendanceTrendPoint,
  StaffAttendanceDashboardMetrics,
  StaffBoardDashboardMetrics,
  StudentAttendanceDashboardMetrics
} from "@/modules/dashboard/queries";

type DashboardTrendChartProps = {
  idPrefix: string;
  studentTrend: readonly DashboardAttendanceTrendPoint[] | null;
  staffTrend: readonly DashboardAttendanceTrendPoint[] | null;
  compact?: boolean;
};

type ChartSeries = {
  label: string;
  color: string;
  values: Array<number | null>;
};

type ChartDimensions = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const desktopChart: ChartDimensions = {
  width: 720,
  height: 250,
  left: 44,
  right: 18,
  top: 20,
  bottom: 42
};

const compactChart: ChartDimensions = {
  width: 360,
  height: 220,
  left: 36,
  right: 8,
  top: 18,
  bottom: 38
};

function chartPath(values: readonly (number | null)[], dimensions: ChartDimensions) {
  const plotWidth = dimensions.width - dimensions.left - dimensions.right;
  const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
  let drawing = false;

  return values.map((value, index) => {
    if (value === null) {
      drawing = false;
      return "";
    }
    const x = dimensions.left + (values.length > 1 ? (index / (values.length - 1)) * plotWidth : plotWidth / 2);
    const y = dimensions.top + ((100 - value) / 100) * plotHeight;
    const command = drawing ? "L" : "M";
    drawing = true;
    return `${command}${x.toFixed(1)},${y.toFixed(1)}`;
  }).filter(Boolean).join(" ");
}

function latestRecordedRate(points: readonly DashboardAttendanceTrendPoint[] | null) {
  if (!points) return null;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const value = points[index]?.presenceRate;
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

export function DashboardTrendChart({
  idPrefix,
  studentTrend,
  staffTrend,
  compact = false
}: DashboardTrendChartProps) {
  const timeline = studentTrend?.length ? studentTrend : staffTrend ?? [];
  const series = [
    studentTrend ? { label: "Students", color: "#2457e6", values: studentTrend.map((point) => point.presenceRate) } : null,
    staffTrend ? { label: "Staff", color: "#12b8a6", values: staffTrend.map((point) => point.presenceRate) } : null
  ].filter((item): item is ChartSeries => item !== null);
  const hasRecordedData = series.some((item) => item.values.some((value) => value !== null));
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  const latestStudentRate = latestRecordedRate(studentTrend);
  const latestStaffRate = latestRecordedRate(staffTrend);
  const dimensions = compact ? compactChart : desktopChart;
  const axisFontSize = compact ? 10 : 11;

  return (
    <section
      className={`dashboard-glass-panel min-w-0 ${compact ? "p-4" : "p-5 xl:p-6"}`}
      aria-labelledby={titleId}
      data-dashboard-trend-chart="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-brand-700">Last 7 days</p>
          <h2 id={titleId} className="mt-1 text-base font-semibold text-ink sm:text-lg">Attendance trend</h2>
          <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">
            Recorded presence across the current branch and academic context.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Latest recorded presence">
          {studentTrend ? (
            <span className="dashboard-data-pill">
              <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
              Students {latestStudentRate ?? "No data"}{latestStudentRate === null ? "" : "%"}
            </span>
          ) : null}
          {staffTrend ? (
            <span className="dashboard-data-pill">
              <span className="h-2 w-2 rounded-full bg-campus-teal" aria-hidden="true" />
              Staff {latestStaffRate ?? "No data"}{latestStaffRate === null ? "" : "%"}
            </span>
          ) : null}
        </div>
      </div>

      {hasRecordedData ? (
        <div className="mt-5 min-w-0 overflow-hidden">
          <svg
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="block h-auto w-full"
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
              const y = dimensions.top + ((100 - value) / 100) * plotHeight;
              return (
                <g key={value}>
                  <line x1={dimensions.left} x2={dimensions.width - dimensions.right} y1={y} y2={y} stroke="#d9e1f2" strokeWidth="1" />
                  <text x={dimensions.left - 6} y={y + 4} textAnchor="end" fill="#68738f" fontSize={axisFontSize}>{value}%</text>
                </g>
              );
            })}
            {series.map((item) => (
              <g key={item.label}>
                <path
                  d={chartPath(item.values, dimensions)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {item.values.map((value, index) => {
                  if (value === null) return null;
                  const plotWidth = dimensions.width - dimensions.left - dimensions.right;
                  const plotHeight = dimensions.height - dimensions.top - dimensions.bottom;
                  const x = dimensions.left + (item.values.length > 1 ? (index / (item.values.length - 1)) * plotWidth : plotWidth / 2);
                  const y = dimensions.top + ((100 - value) / 100) * plotHeight;
                  return <circle key={`${item.label}-${index}`} cx={x} cy={y} r="4" fill="#fff" stroke={item.color} strokeWidth="3" />;
                })}
              </g>
            ))}
            {timeline.map((point, index) => {
              const plotWidth = dimensions.width - dimensions.left - dimensions.right;
              const x = dimensions.left + (timeline.length > 1 ? (index / (timeline.length - 1)) * plotWidth : plotWidth / 2);
              const textAnchor = index === 0 ? "start" : index === timeline.length - 1 ? "end" : "middle";
              return <text key={point.date} x={x} y={dimensions.height - 11} textAnchor={textAnchor} fill="#68738f" fontSize={axisFontSize}>{point.label}</text>;
            })}
          </svg>
        </div>
      ) : (
        <div className="mt-5 flex min-h-48 items-center justify-center rounded-lg border border-dashed border-campus-border bg-white/55 px-5 text-center">
          <div>
            <p className="text-sm font-semibold text-slate-800">No attendance trend yet</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">The chart will populate after attendance is recorded.</p>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Presence includes present, late, and half-day records. Missing records are not treated as absence.
      </p>

      <table className="sr-only">
        <caption>Seven-day attendance trend values</caption>
        <thead><tr><th>Date</th>{series.map((item) => <th key={item.label}>{item.label}</th>)}</tr></thead>
        <tbody>
          {timeline.map((point, index) => (
            <tr key={point.date}>
              <th>{point.label}</th>
              {series.map((item) => <td key={item.label}>{item.values[index] ?? "No data"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

type MeterTone = "brand" | "emerald" | "amber" | "rose" | "teal" | "slate";

const meterToneClasses: Record<MeterTone, string> = {
  brand: "bg-brand-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  teal: "bg-campus-teal",
  slate: "bg-slate-400"
};

function StatusMeter({ label, value, total, tone }: { label: string; value: number; total: number; tone: MeterTone }) {
  const percentage = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tabular-nums font-semibold text-slate-900">{value}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={`${label}: ${value} of ${total}`}
        aria-valuemin={0}
        aria-valuemax={Math.max(total, 1)}
        aria-valuenow={Math.min(value, Math.max(total, 1))}
      >
        <div className={`h-full rounded-full ${meterToneClasses[tone]}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

type DashboardStatusMixProps = {
  studentAttendance: StudentAttendanceDashboardMetrics | null;
  staffAttendance: StaffAttendanceDashboardMetrics | null;
  staffBoard: StaffBoardDashboardMetrics | null;
};

export function DashboardStatusMix({ studentAttendance, staffAttendance, staffBoard }: DashboardStatusMixProps) {
  return (
    <section className="dashboard-glass-panel min-w-0 p-5 xl:p-6" aria-labelledby="dashboard-status-mix-title" data-dashboard-status-mix="true">
      <p className="text-xs font-semibold uppercase text-brand-700">Today</p>
      <h2 id="dashboard-status-mix-title" className="mt-1 text-base font-semibold text-ink sm:text-lg">Attendance mix</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Recorded status distribution without inferring missing records.</p>

      <div className="mt-5 space-y-6">
        {studentAttendance ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-campus-border pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Students</h3>
              <span className="text-xs font-semibold text-slate-500">{studentAttendance.marked} marked</span>
            </div>
            <StatusMeter label="Present" value={studentAttendance.present} total={studentAttendance.marked} tone="emerald" />
            <StatusMeter label="Late" value={studentAttendance.late} total={studentAttendance.marked} tone="amber" />
            <StatusMeter label="Absent" value={studentAttendance.absent} total={studentAttendance.marked} tone="rose" />
            <StatusMeter label="Half day" value={studentAttendance.halfDay} total={studentAttendance.marked} tone="brand" />
            <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">
              <span className="font-medium">Class marking completion</span>
              <span className="tabular-nums font-semibold">
                {studentAttendance.classesMarked}/{studentAttendance.eligibleClassSections}
                {studentAttendance.markingRate === null ? "" : ` (${studentAttendance.markingRate}%)`}
              </span>
            </div>
          </div>
        ) : null}

        {staffAttendance ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-campus-border pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Staff</h3>
              <span className="text-xs font-semibold text-slate-500">{staffBoard?.totalActiveStaff ?? 0} active</span>
            </div>
            <StatusMeter label="Checked in" value={staffAttendance.checkedIn} total={staffBoard?.totalActiveStaff ?? 0} tone="teal" />
            <StatusMeter label="Late" value={staffAttendance.late} total={staffBoard?.totalActiveStaff ?? 0} tone="amber" />
            <StatusMeter label="Half day" value={staffAttendance.halfDay} total={staffBoard?.totalActiveStaff ?? 0} tone="brand" />
            <StatusMeter label="Absent" value={staffAttendance.absent} total={staffBoard?.totalActiveStaff ?? 0} tone="rose" />
            <StatusMeter label="Not marked" value={staffAttendance.notMarked} total={staffBoard?.totalActiveStaff ?? 0} tone="slate" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
