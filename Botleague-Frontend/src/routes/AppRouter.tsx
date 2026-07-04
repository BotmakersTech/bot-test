import { Routes, Route } from "react-router-dom";

// ============================
// LAYOUT
// ============================
import Layout from "../feature/Navigation/pages/Layout";

// ============================
// AUTH PAGES
// ============================
import RegisterPage from "../feature/Auth/pages/RegisterPage";
import LoginPage from "../feature/Auth/pages/LoginPage";
import ForgetPasswordPage from "../feature/Auth/pages/ForgotPasswordPage";
import ResetPasswordPage  from "../feature/Auth/pages/ResetPasswordPage";

// ============================
// PROFILE / SETTINGS
// ============================
import ProfilePage from "../feature/Profile/pages/ProfilePage";
import SettingsPage from "../feature/Profile/pages/Setting";
import VerifyEmail from "../feature/Profile/components/VerifyEmail";

// ============================
// PUBLIC PAGES
// ============================
import Home from "../temp/pages/Home";
import ContactUs from "../temp/pages/ContactUs";
import AboutUs from "../temp/pages/AboutUs";

// ============================
// TEAM PAGES
// ============================
import MyTeams from "../feature/Team/pages/MyTeam";
import CreateTeam from "../feature/Team/CreateTeam/pages/CreateTeamPage";

// ============================
// FEATURE PAGES
// ============================
import UserDashboard from "../feature/UserDashboard/pages/userDashboard";
import RobotsPage from "../feature/Robots/pages/RobotsPages";
import UserEventPage from "../feature/Event/pages/UserEventPage";
import UserEventDetail from "../feature/Event/pages/UserEventDetail";
import UserSportDetail from "../feature/Event/pages/UserSportDetail";
import MatchesPage from "../feature/Matches/Pages/Matches";
import RankingsPage from "../feature/Rankings/pages/Rankings";
import AchievementsPage from "../feature/Achievement/pages/AchievementsPage";
import CertificatesPage from "../feature/Achievement/pages/CertificatesPage";
import SupportPage from "../feature/Support/pages/SupportPage";

// ============================
// ADMIN PAGES
// ============================
import AdminDashboard from "../feature/Admin/pages/AdminDashboard";
import AdminEventPage from "../feature/Admin/pages/AdminEventDetail";
import AdminSport from "../feature/Admin/pages/AdminSport";
import AdminAllSportsPage from "../feature/Admin/pages/AdminAllSportsPage";
import AdminMatches from "../feature/Admin/pages/AdminMatches";
import AdminRegistrations from "../feature/Admin/pages/AdminRegistrations";
import AdminReportsPage from "../feature/Admin/pages/AdminReportsPage";
import AdminAnalyticsPage from "../feature/Admin/pages/AdminAnalyticsPage";
import AdminAuditLogsPage from "../feature/Admin/pages/AdminAuditLogsPage";
import AdminJudgesPage from "../feature/Admin/pages/AdminJudgesPage";
import AdminSponsorsPage from "../feature/Admin/pages/AdminSponsorsPage";
import AdminSupportTicketsPage from "../feature/Admin/pages/AdminSupportTicketsPage";
import CreateEvent from "../feature/Admin/components/CreateEvent";
import CreateMatch from "../feature/Admin/components/Creatematch";

// ============================
// NOTIFICATION PAGES
// ============================
import NotificationsPage from "../feature/Notifications/pages/NotificationsPage"
import SystemNotificationsPage from "../feature/Admin/pages/SystemNotificationsPage"

// ============================
// CHAT / MESSAGES
// ============================
import MessagesPage from "../feature/Chat/pages/MessagesPage"

// ============================
// RBAC PAGES
// ============================
import UserManagementPage from "../feature/SuperAdmin/pages/UserManagementPage";
import UserDetailPage from "../feature/SuperAdmin/pages/UserDetailPage";
import TeamManagementPage from "../feature/SuperAdmin/pages/TeamManagementPage";
import TeamDetailPage from "../feature/SuperAdmin/pages/TeamDetailPage";
import AdminRobotsPage from "../feature/Admin/pages/AdminRobotsPage";
import AdminRobotDetailPage from "../feature/Admin/pages/AdminRobotDetailPage";
import OrganizerEventsPage        from "../feature/Organizer/pages/OrganizerEventsPage";
import OrganizerEventDetailPage   from "../feature/Organizer/pages/OrganizerEventDetailPage";
import OrganizerSportsPage        from "../feature/Organizer/pages/OrganizerSportsPage";
import OrganizerMatchesPage       from "../feature/Organizer/pages/OrganizerMatchesPage";
import OrganizerRegistrationsPage from "../feature/Organizer/pages/OrganizerRegistrationsPage";
import OrganizerCommunicationPage from "../feature/Organizer/pages/OrganizerCommunicationPage";
import OrganizerSchedulePage      from "../feature/Organizer/pages/OrganizerSchedulePage";
import OrganizerMonitoringPage    from "../feature/Organizer/pages/OrganizerMonitoringPage";
import OrganizerReportsPage       from "../feature/Organizer/pages/OrganizerReportsPage";
import OrganizerClosurePage       from "../feature/Organizer/pages/OrganizerClosurePage";
import OrganizerVolunteersPage    from "../feature/Organizer/pages/OrganizerVolunteersPage";
import OrganizerJudgesPage        from "../feature/Organizer/pages/OrganizerJudgesPage";
import OrganizerStaffPage         from "../feature/Organizer/pages/OrganizerStaffPage";
import OrganizerVenuePage         from "../feature/Organizer/pages/OrganizerVenuePage";
import OrganizerCertificatesPage  from "../feature/Organizer/pages/OrganizerCertificatesPage";
import OrganizerAnalyticsPage     from "../feature/Organizer/pages/OrganizerAnalyticsPage";
import OrganizerSettingsPage      from "../feature/Organizer/pages/OrganizerSettingsPage";
import SubOrganizerSportsPage        from "../feature/SubOrganizer/pages/SubOrganizerSportsPage";
import SubOrganizerScoresPage        from "../feature/SubOrganizer/pages/SubOrganizerScoresPage";
import SubOrganizerAnnouncementsPage from "../feature/SubOrganizer/pages/SubOrganizerAnnouncementsPage";

// ============================
// ROLE DASHBOARDS
// ============================
import OrganizerDashboard  from "../feature/Organizer/pages/OrganizerDashboard";
import AdminRoleDashboard  from "../feature/Admin/pages/AdminRoleDashboard";
import SuperAdminDashboard from "../feature/SuperAdmin/pages/SuperAdminDashboard";

// ============================
// JUDGE PAGES
// ============================
import JudgeDashboard    from "../feature/Judge/pages/JudgeDashboard";
import JudgeMatchesPage  from "../feature/Judge/pages/JudgeMatchesPage";
import JudgeScoresPage   from "../feature/Judge/pages/JudgeScoresPage";
import JudgeSchedulePage from "../feature/Judge/pages/JudgeSchedulePage";

// ============================
// VOLUNTEER PAGES
// ============================
import VolunteerDashboard    from "../feature/Volunteer/pages/VolunteerDashboard";
import VolunteerEventPage    from "../feature/Volunteer/pages/VolunteerEventPage";
import VolunteerCheckInPage  from "../feature/Volunteer/pages/VolunteerCheckInPage";
import VolunteerSchedulePage from "../feature/Volunteer/pages/VolunteerSchedulePage";

import TeamPublicPage  from "../feature/Team/pages/TeamPublicPage";
import RobotPublicPage from "../feature/Robots/pages/RobotPublicPage";
import UserPublicPage  from "../feature/Profile/pages/UserPublicPage";

// ============================
// ROUTE GUARDS
// ============================
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";
import { AppRole, ADMIN_MIN, ORG_MIN, SUB_ORG_ROLES, type AppRoleType } from "../shared/constants/roles";

const ADMIN_AND_UP: AppRoleType[] = [AppRole.ADMINISTRATOR, AppRole.SUPER_ADMIN];

// ======================================================
// APP ROUTES
// ======================================================

function AppRoutes() {
  return (
    <Routes>
      {/* ========================================= */}
      {/* PUBLIC ROUTES */}
      {/* ========================================= */}
      <Route path="/" element={<Home />} />
      {/* Public profiles — accepts both UUID and BL-code (BLT.../BLR.../BLU...) */}
      <Route path="/team/:teamId"    element={<TeamPublicPage />} />
      <Route path="/robot/:robotId"  element={<RobotPublicPage />} />
      <Route path="/user/:code"      element={<UserPublicPage />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* ========================================= */}
      {/* AUTH ROUTES */}
      {/* ========================================= */}
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgetPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* ========================================= */}
      {/* PROTECTED ROUTES (Navbar + Sidebar layout) */}
      {/* ========================================= */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* ── Core user pages ── */}
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/my-team" element={<MyTeams />} />
        <Route path="/create-team" element={<CreateTeam />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/robots" element={<RobotsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />

        {/* ── Competitor pages ── */}
        <Route path="/events" element={<UserEventPage />} />
        <Route path="/events/:eventId" element={<UserEventDetail />} />
        <Route path="/events/:eventId/sports/:sportId" element={<UserSportDetail />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* ── System Notifications (MANAGER minimum) ── */}
        <Route path="/admin/system-notifications" element={<RoleRoute roles={[AppRole.MANAGER]}><SystemNotificationsPage /></RoleRoute>} />

        {/* ── Admin routes (MANAGER+) ── */}
        <Route path="/admin/sports"         element={<RoleRoute roles={ADMIN_MIN}><AdminAllSportsPage /></RoleRoute>} />
        <Route path="/admin/matches"        element={<RoleRoute roles={ADMIN_MIN}><AdminMatches /></RoleRoute>} />
        <Route path="/admin/registrations"  element={<RoleRoute roles={ADMIN_MIN}><AdminRegistrations /></RoleRoute>} />
        <Route path="/admin/reports"        element={<RoleRoute roles={ADMIN_MIN}><AdminReportsPage /></RoleRoute>} />

        {/* ── Event management (ADMINISTRATOR + SUPER_ADMIN only) ── */}
        <Route path="/admin/user"           element={<RoleRoute roles={ADMIN_AND_UP}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/events/create"  element={<RoleRoute roles={ADMIN_AND_UP}><CreateEvent /></RoleRoute>} />
        <Route path="/admin/event/:eventId" element={<RoleRoute roles={ADMIN_AND_UP}><AdminEventPage /></RoleRoute>} />

        {/* ── Admin routes (ADMINISTRATOR + SUPER_ADMIN) ── */}
        <Route path="/admin/analytics"       element={<RoleRoute roles={ADMIN_AND_UP}><AdminAnalyticsPage /></RoleRoute>} />
        <Route path="/admin/audit-logs"      element={<RoleRoute roles={ADMIN_AND_UP}><AdminAuditLogsPage /></RoleRoute>} />
        <Route path="/admin/judges"          element={<RoleRoute roles={ADMIN_AND_UP}><AdminJudgesPage /></RoleRoute>} />
        <Route path="/admin/sponsors"        element={<RoleRoute roles={ADMIN_AND_UP}><AdminSponsorsPage /></RoleRoute>} />
        <Route path="/admin/support-tickets" element={<RoleRoute roles={ADMIN_AND_UP}><AdminSupportTicketsPage /></RoleRoute>} />
        <Route
          path="/admin/events/:eventId/sports/:sportId"
          element={<RoleRoute roles={SUB_ORG_ROLES}><AdminSport /></RoleRoute>}
        />
        <Route
          path="/admin/events/:eventId/sports/:sportId/create-match"
          element={<RoleRoute roles={SUB_ORG_ROLES}><CreateMatch /></RoleRoute>}
        />

        {/* ── User Management (SUPER_ADMIN only) ── */}
        <Route path="/admin/users"       element={<RoleRoute roles={[AppRole.SUPER_ADMIN]}><UserManagementPage /></RoleRoute>} />
        <Route path="/admin/users/:userId" element={<RoleRoute roles={[AppRole.SUPER_ADMIN]}><UserDetailPage /></RoleRoute>} />

        {/* ── Team Management (ADMINISTRATOR+) ── */}
        <Route path="/admin/teams"          element={<RoleRoute roles={ADMIN_AND_UP}><TeamManagementPage /></RoleRoute>} />
        <Route path="/admin/teams/:teamId"  element={<RoleRoute roles={ADMIN_AND_UP}><TeamDetailPage /></RoleRoute>} />

        {/* ── Robot Management (ADMINISTRATOR+) ── */}
        <Route path="/admin/robots"           element={<RoleRoute roles={ADMIN_AND_UP}><AdminRobotsPage /></RoleRoute>} />
        <Route path="/admin/robots/:robotId"  element={<RoleRoute roles={ADMIN_AND_UP}><AdminRobotDetailPage /></RoleRoute>} />

        {/* ── Role-specific dashboards ── */}
        <Route path="/organizer-dashboard"   element={<RoleRoute roles={SUB_ORG_ROLES}><OrganizerDashboard /></RoleRoute>} />
        <Route path="/admin-dashboard"       element={<RoleRoute roles={ADMIN_MIN}><AdminRoleDashboard /></RoleRoute>} />
        <Route path="/super-admin-dashboard" element={<RoleRoute roles={[AppRole.SUPER_ADMIN]}><SuperAdminDashboard /></RoleRoute>} />

        {/* ── Organizer Portal ── */}
        <Route path="/organizer/events"          element={<RoleRoute roles={ORG_MIN}><OrganizerEventsPage /></RoleRoute>} />
        <Route path="/organizer/events/:eventId" element={<RoleRoute roles={ORG_MIN}><OrganizerEventDetailPage /></RoleRoute>} />
        <Route path="/organizer/sports"          element={<RoleRoute roles={ORG_MIN}><OrganizerSportsPage /></RoleRoute>} />
        <Route path="/organizer/matches"         element={<RoleRoute roles={SUB_ORG_ROLES}><OrganizerMatchesPage /></RoleRoute>} />
        <Route path="/organizer/registrations"   element={<RoleRoute roles={SUB_ORG_ROLES}><OrganizerRegistrationsPage /></RoleRoute>} />
        <Route path="/organizer/communication"   element={<RoleRoute roles={ORG_MIN}><OrganizerCommunicationPage /></RoleRoute>} />
        <Route path="/organizer/schedule"        element={<RoleRoute roles={SUB_ORG_ROLES}><OrganizerSchedulePage /></RoleRoute>} />
        <Route path="/organizer/monitoring"      element={<RoleRoute roles={ORG_MIN}><OrganizerMonitoringPage /></RoleRoute>} />
        <Route path="/organizer/reports"         element={<RoleRoute roles={ORG_MIN}><OrganizerReportsPage /></RoleRoute>} />
        <Route path="/organizer/closure"         element={<RoleRoute roles={ORG_MIN}><OrganizerClosurePage /></RoleRoute>} />
        <Route path="/organizer/volunteers"      element={<RoleRoute roles={ORG_MIN}><OrganizerVolunteersPage /></RoleRoute>} />
        <Route path="/organizer/judges"          element={<RoleRoute roles={ORG_MIN}><OrganizerJudgesPage /></RoleRoute>} />
        <Route path="/organizer/staff"           element={<RoleRoute roles={ORG_MIN}><OrganizerStaffPage /></RoleRoute>} />
        <Route path="/organizer/venue"           element={<RoleRoute roles={ORG_MIN}><OrganizerVenuePage /></RoleRoute>} />
        <Route path="/organizer/certificates"    element={<RoleRoute roles={ORG_MIN}><OrganizerCertificatesPage /></RoleRoute>} />
        <Route path="/organizer/analytics"       element={<RoleRoute roles={ORG_MIN}><OrganizerAnalyticsPage /></RoleRoute>} />
        <Route path="/organizer/settings"        element={<RoleRoute roles={ORG_MIN}><OrganizerSettingsPage /></RoleRoute>} />

        {/* ── Sub-Organizer Portal ── */}
        <Route path="/organizer/my-sports"      element={<RoleRoute roles={SUB_ORG_ROLES}><SubOrganizerSportsPage /></RoleRoute>} />
        <Route path="/organizer/scores"         element={<RoleRoute roles={SUB_ORG_ROLES}><SubOrganizerScoresPage /></RoleRoute>} />
        <Route path="/organizer/announcements"  element={<RoleRoute roles={SUB_ORG_ROLES}><SubOrganizerAnnouncementsPage /></RoleRoute>} />

        {/* ── Judge Portal ── */}
        <Route path="/judge-dashboard" element={<RoleRoute roles={[AppRole.JUDGE]}><JudgeDashboard /></RoleRoute>} />
        <Route path="/judge/matches"   element={<RoleRoute roles={[AppRole.JUDGE]}><JudgeMatchesPage /></RoleRoute>} />
        <Route path="/judge/scores"    element={<RoleRoute roles={[AppRole.JUDGE]}><JudgeScoresPage /></RoleRoute>} />
        <Route path="/judge/schedule"  element={<RoleRoute roles={[AppRole.JUDGE]}><JudgeSchedulePage /></RoleRoute>} />

        {/* ── Volunteer Portal ── */}
        <Route path="/volunteer-dashboard" element={<RoleRoute roles={[AppRole.VOLUNTEER]}><VolunteerDashboard /></RoleRoute>} />
        <Route path="/volunteer/event"     element={<RoleRoute roles={[AppRole.VOLUNTEER]}><VolunteerEventPage /></RoleRoute>} />
        <Route path="/volunteer/checkin"   element={<RoleRoute roles={[AppRole.VOLUNTEER]}><VolunteerCheckInPage /></RoleRoute>} />
        <Route path="/volunteer/schedule"  element={<RoleRoute roles={[AppRole.VOLUNTEER]}><VolunteerSchedulePage /></RoleRoute>} />

        {/* ── Authenticated 404 (shows sidebar) ── */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-6">
              <p className="text-5xl font-bold text-white/10">404</p>
              <h2 className="text-xl font-semibold text-white">Page not found</h2>
              <p className="text-neutral-500 text-sm max-w-xs">
                The page you're looking for doesn't exist or you don't have permission to view it.
              </p>
            </div>
          }
        />
      </Route>

      {/* ── Public 404 (not authenticated) ── */}
      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center bg-gray-950 text-white text-xl">
            Page not found.
          </div>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
