export type AppShellBranding = {
  institutionName: string;
  logoUrl?: string | null;
  branchName?: string | null;
  branchCode?: string | null;
  academicYearName?: string | null;
  roleLabels: string[];
};

export function brandingInitials(name: string) {
  const compactName = name.trim() || "JinaCampus";
  return compactName.slice(0, 2).toUpperCase();
}
