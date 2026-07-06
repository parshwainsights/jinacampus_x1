-- Notification template uniqueness with nullable branch scope.
CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_tenant_global_template_uidx"
ON "notification_templates"("tenantId", "channel", "templateKey", "languageCode")
WHERE "branchId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_tenant_branch_template_uidx"
ON "notification_templates"("tenantId", "branchId", "channel", "templateKey", "languageCode")
WHERE "branchId" IS NOT NULL;

-- One WhatsApp integration setting per tenant/branch scope for the MVP foundation.
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_integration_tenant_global_uidx"
ON "whatsapp_integration_settings"("tenantId")
WHERE "branchId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_integration_tenant_branch_uidx"
ON "whatsapp_integration_settings"("tenantId", "branchId")
WHERE "branchId" IS NOT NULL;
