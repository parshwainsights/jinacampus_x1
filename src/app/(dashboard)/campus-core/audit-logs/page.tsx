import { requireAuth } from "@/lib/auth/require-auth";
import { getEffectivePermissions } from "@/lib/rbac/require-permission";
import { listAuditLogs } from "@/modules/campus-core/queries";
import { EmptyState, PermissionState } from "@/components/ui/empty-state";
import { ResponsiveTable } from "@/components/ui/table-primitives";

export default async function AuditLogsPage() {
  const ctx = await requireAuth();
  const permissions = await getEffectivePermissions({ ctx, branchId: ctx.activeBranchId });
  if (!permissions.has("campuscore.audit.view")) return <PermissionState />;
  const logs = await listAuditLogs(ctx);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Audit Logs</h1><p className="text-sm text-slate-500">Critical CampusCore write events.</p></div>
      {logs.length ? (
        <ResponsiveTable columns={["Created At", "Action", "Entity", "Actor", "Branch"]} caption="Audit logs table">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap px-4 py-3">{log.createdAt.toISOString()}</td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{log.action}</td>
              <td className="whitespace-nowrap px-4 py-3">{log.entityType}</td>
              <td className="whitespace-nowrap px-4 py-3">{log.actor?.email ?? "System"}</td>
              <td className="whitespace-nowrap px-4 py-3">{log.branch?.name ?? "-"}</td>
            </tr>
          ))}
        </ResponsiveTable>
      ) : (
        <EmptyState title="No audit logs yet" description="Critical CampusCore changes will appear here." />
      )}
    </div>
  );
}
