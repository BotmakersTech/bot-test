import api from "../../../shared/api/Base"

export interface AuditLogEntry {
  id: string
  actorId?: string
  actorEmail?: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  oldValue?: string
  newValue?: string
  reason?: string
  createdAt: string
}

export const getRecentAuditLogs = async (): Promise<AuditLogEntry[]> => {
  const res = await api.get("/audit-logs/recent")
  return res.data
}

export const getAuditLogs = async (
  page = 0,
  size = 20,
  entityType?: string
): Promise<{ content: AuditLogEntry[]; totalElements: number; totalPages: number }> => {
  const params: Record<string, string | number> = { page, size }
  if (entityType) params.entityType = entityType
  const res = await api.get("/audit-logs", { params })
  return res.data
}
