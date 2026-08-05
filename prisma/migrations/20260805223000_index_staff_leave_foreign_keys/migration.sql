-- Add covering indexes for Staff Leave foreign keys used by joins, cleanup, and cascade checks.
CREATE INDEX "staff_leave_types_branchId_idx" ON "staff_leave_types"("branchId");

CREATE INDEX "staff_leave_approvers_branchId_idx" ON "staff_leave_approvers"("branchId");
CREATE INDEX "staff_leave_approvers_userId_idx" ON "staff_leave_approvers"("userId");

CREATE INDEX "staff_leave_balances_branchId_idx" ON "staff_leave_balances"("branchId");
CREATE INDEX "staff_leave_balances_staffId_idx" ON "staff_leave_balances"("staffId");
CREATE INDEX "staff_leave_balances_leaveTypeId_idx" ON "staff_leave_balances"("leaveTypeId");

CREATE INDEX "staff_leave_applications_branchId_idx" ON "staff_leave_applications"("branchId");
CREATE INDEX "staff_leave_applications_staffId_idx" ON "staff_leave_applications"("staffId");
CREATE INDEX "staff_leave_applications_leaveTypeId_idx" ON "staff_leave_applications"("leaveTypeId");
CREATE INDEX "staff_leave_applications_actionedById_idx" ON "staff_leave_applications"("actionedById");

CREATE INDEX "staff_leave_application_actions_branchId_idx" ON "staff_leave_application_actions"("branchId");
CREATE INDEX "staff_leave_application_actions_applicationId_idx" ON "staff_leave_application_actions"("applicationId");
CREATE INDEX "staff_leave_application_actions_actorUserId_idx" ON "staff_leave_application_actions"("actorUserId");

CREATE INDEX "staff_leave_documents_branchId_idx" ON "staff_leave_documents"("branchId");
CREATE INDEX "staff_leave_documents_applicationId_idx" ON "staff_leave_documents"("applicationId");

CREATE INDEX "in_app_notifications_branchId_idx" ON "in_app_notifications"("branchId");
CREATE INDEX "in_app_notifications_userId_idx" ON "in_app_notifications"("userId");

CREATE INDEX "staff_attendance_records_leaveApplicationId_idx" ON "staff_attendance_records"("leaveApplicationId");
