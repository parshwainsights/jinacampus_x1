import type { StaffType, EmploymentStatus } from "@prisma/client";
import {
  formatDateTime,
  formatEnumLabel,
  ListPageShell,
  ReadOnlyAction,
  StatusPill,
  type RouteSearchParams
} from "./staffboard-page-shell";
import { staffProfileListConfig } from "@/modules/staffboard-lite/ui-config";

export type StaffProfileTableRow = {
  id: string;
  employeeCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  staffType: StaffType;
  designation: string | null;
  department: string | null;
  employmentStatus: EmploymentStatus;
  updatedAt: Date;
  branch: { name: string } | null;
  user: { email: string; status: string } | null;
};

export function formatStaffName(staff: Pick<StaffProfileTableRow, "firstName" | "middleName" | "lastName">) {
  return [staff.firstName, staff.middleName, staff.lastName].filter(Boolean).join(" ");
}

export function StaffProfileTable({
  staffProfiles,
  search
}: {
  staffProfiles: readonly StaffProfileTableRow[];
  search?: string;
}) {
  return (
    <ListPageShell config={staffProfileListConfig} search={search} rowCount={staffProfiles.length}>
      {staffProfiles.map((staff) => (
        <tr key={staff.id}>
          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{staff.employeeCode}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatStaffName(staff)}</td>
          <td className="whitespace-nowrap px-4 py-3">{formatEnumLabel(staff.staffType)}</td>
          <td className="whitespace-nowrap px-4 py-3">{staff.designation ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3">{staff.department ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3">{staff.branch?.name ?? "-"}</td>
          <td className="whitespace-nowrap px-4 py-3"><StatusPill value={staff.employmentStatus} /></td>
          <td className="whitespace-nowrap px-4 py-3">
            {staff.user ? (
              <span className="premium-muted-chip border-emerald-200 bg-emerald-50 text-emerald-700">
                Enabled
              </span>
            ) : (
              <span className="premium-muted-chip">No app access</span>
            )}
          </td>
          <td className="whitespace-nowrap px-4 py-3">{formatDateTime(staff.updatedAt)}</td>
          <td className="whitespace-nowrap px-4 py-3"><ReadOnlyAction /></td>
        </tr>
      ))}
    </ListPageShell>
  );
}

export type { RouteSearchParams };
