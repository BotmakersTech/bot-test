import AdminRoleDashboard from "../../Admin/pages/AdminRoleDashboard"

// SuperAdmin's dashboard is intentionally identical to Admin's — same cards,
// same data, same everything. Rendering the same component (rather than a
// visual copy) guarantees the two can never drift apart.
export default function SuperAdminDashboard() {
  return <AdminRoleDashboard />
}
