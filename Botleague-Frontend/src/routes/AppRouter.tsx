import { Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";

// ============================
// LAYOUT
// ============================
import Layout from "../feature/Navigation/pages/Layout";
import AppFooter from "../shared/components/AppFooter";

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
import EventsLandingPage from "../temp/pages/EventsLandingPage";
import LeagueDetailPage from "../temp/pages/leagues/LeagueDetailPage";

// ============================
// TEAM PAGES
// ============================
import MyTeams from "../feature/Team/pages/MyTeam";
import EditTeamPage from "../feature/Team/pages/EditTeamPage";
import MemberManagementPage from "../feature/Team/TeamMembership/pages/MemberManagementPage";
import CreateTeam from "../feature/Team/CreateTeam/pages/CreateTeamPage";

// ============================
// FEATURE PAGES
// ============================
import UserDashboard from "../feature/UserDashboard/pages/userDashboard";
import RobotsPage from "../feature/Robots/pages/RobotsPages";
import RobotProfilePage from "../feature/Robots/pages/RobotProfilePage";
import UserEventPage from "../feature/Event/pages/UserEventPage";
import UserEventDetail from "../feature/Event/pages/UserEventDetail";
import UserSportDetail from "../feature/Event/pages/UserSportDetail";
import MatchesPage from "../feature/Matches/Pages/Matches";
import RankingsRoute from "../feature/Rankings/pages/RankingsRoute";
import AchievementsPage from "../feature/Achievement/pages/AchievementsPage";
import CertificatesPage from "../feature/Achievement/pages/CertificatesPage";
import VerifyCertificatePage from "../feature/Certificates/pages/VerifyCertificatePage";
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
import AdminJudgeAssignmentPage from "../feature/Admin/pages/AdminJudgeAssignmentPage";
import AdminSponsorsPage from "../feature/Admin/pages/AdminSponsorsPage";
import AdminSupportTicketsPage from "../feature/Admin/pages/AdminSupportTicketsPage";
import AdminCertificatesPage from "../feature/Admin/pages/AdminCertificatesPage";
import CreateEvent from "../feature/Admin/components/CreateEvent";
import CreateMatch from "../feature/Admin/components/Creatematch";

// ============================
// NOTIFICATION PAGES
// ============================
import NotificationsPage from "../feature/Notifications/pages/NotificationsPage"
import SystemNotificationsPage from "../feature/Admin/pages/SystemNotificationsPage"

// ============================
// NEWS
// ============================
import AdminNewsPage from "../feature/News/pages/AdminNewsPage"
import NewsFeedPage from "../feature/News/pages/NewsFeedPage"
import NewsDetailPage from "../feature/News/pages/NewsDetailPage"

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
import OrganizerCreateEventPage   from "../feature/Organizer/pages/OrganizerCreateEventPage";
import OrganizerIncidentsPage     from "../feature/Organizer/pages/OrganizerIncidentsPage";
import OrganizerEventDetailPage   from "../feature/Organizer/pages/OrganizerEventDetailPage";
import OrganizerSportDetailPage   from "../feature/Organizer/pages/OrganizerSportDetailPage";
import OrganizerBracketPage       from "../feature/Organizer/pages/OrganizerBracketPage";
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

// ============================
// VOLUNTEER PAGES
// ============================
import VolunteerDashboard    from "../feature/Volunteer/pages/VolunteerDashboard";
import VolunteerEventPage    from "../feature/Volunteer/pages/VolunteerEventPage";

import TeamPublicPage  from "../feature/Team/pages/TeamPublicPage";
import RobotPublicPage from "../feature/Robots/pages/RobotPublicPage";
import UserPublicPage  from "../feature/Profile/pages/UserPublicPage";

// ============================
// ROUTE GUARDS
// ============================
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";
import { AppRole, ADMIN_AND_UP, EVENT_HEAD_AND_UP, SPORT_HEAD_AND_UP } from "../shared/constants/roles";

function FooterShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AppFooter />
    </>
  );
}

// ======================================================
// APP ROUTES
// ======================================================

function AppRoutes() {
  return (
    <Routes>
      {/* ========================================= */}
      {/* PUBLIC ROUTES */}
      {/* ========================================= */}
      <Route path="/" element={<FooterShell><Home /></FooterShell>} />
      {/* Public profiles — accepts both UUID and BL-code (BLT.../BLR.../BLU...) */}
      <Route path="/team/:teamId"    element={<FooterShell><TeamPublicPage /></FooterShell>} />
      <Route path="/robot/:robotId"  element={<FooterShell><RobotPublicPage /></FooterShell>} />
      <Route path="/user/:code"      element={<FooterShell><UserPublicPage /></FooterShell>} />
      <Route path="/about-us" element={<FooterShell><AboutUs /></FooterShell>} />
      <Route path="/contact-us" element={<FooterShell><ContactUs /></FooterShell>} />
      <Route path="/events" element={<FooterShell><EventsLandingPage /></FooterShell>} />
      <Route path="/leagues/:slug" element={<FooterShell><LeagueDetailPage /></FooterShell>} />
      {/* Viewable without an account — RankingsRoute picks its own chrome
          (public navbar vs. the authenticated Navbar+Sidebar shell)
          internally based on auth state, so it isn't wrapped in FooterShell
          like the rest of this block. */}
      <Route path="/rankings" element={<RankingsRoute />} />
      {/* Event/sport browsing is fully public — registration/lineup actions
          inside these pages prompt login only when actually used. */}
      <Route path="/events/:eventId" element={<FooterShell><UserEventDetail /></FooterShell>} />
      <Route path="/events/:eventId/sports/:sportId" element={<FooterShell><UserSportDetail /></FooterShell>} />
      <Route path="/verify-email" element={<FooterShell><VerifyEmail /></FooterShell>} />
      {/* Public certificate verification — reached via QR scan or a shared link, no account needed */}
      <Route path="/verify" element={<FooterShell><VerifyCertificatePage /></FooterShell>} />
      <Route path="/verify/:certificateNumber" element={<FooterShell><VerifyCertificatePage /></FooterShell>} />

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
        <Route path="/my-team/edit" element={<EditTeamPage />} />
        <Route path="/my-team/members" element={<MemberManagementPage />} />
        <Route path="/create-team" element={<CreateTeam />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/robots" element={<RobotsPage />} />
        <Route path="/robots/:robotId" element={<RobotProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/news" element={<NewsFeedPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/messages" element={<MessagesPage />} />

        {/* ── Competitor pages ── */}
        {/* NOTE: /events (no id) is the public marketing/events page above —
            this is the logged-in "browse & search events" dashboard view.
            /events/:eventId and /events/:eventId/sports/:sportId moved to the
            public routes section — they're unprotected so anyone can browse
            an event/sport without an account; registration/lineup actions
            inside those pages still prompt login when actually used. */}
        <Route path="/browse-events" element={<UserEventPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* ── System Notifications (ADMIN minimum) ── */}
        <Route path="/admin/system-notifications" element={<RoleRoute roles={[AppRole.ADMIN]}><SystemNotificationsPage /></RoleRoute>} />

        {/* ── News (platform-wide, Admin-only) ── */}
        <Route path="/admin/news" element={<RoleRoute roles={ADMIN_AND_UP}><AdminNewsPage /></RoleRoute>} />

        {/* ── Admin routes (ADMIN+) ── */}
        <Route path="/admin/sports"         element={<RoleRoute roles={ADMIN_AND_UP}><AdminAllSportsPage /></RoleRoute>} />
        <Route path="/admin/matches"        element={<RoleRoute roles={ADMIN_AND_UP}><AdminMatches /></RoleRoute>} />
        <Route path="/admin/registrations"  element={<RoleRoute roles={ADMIN_AND_UP}><AdminRegistrations /></RoleRoute>} />
        <Route path="/admin/reports"        element={<RoleRoute roles={ADMIN_AND_UP}><AdminReportsPage /></RoleRoute>} />

        {/* ── Event management (ADMIN + SUPER_ADMIN only) ── */}
        <Route path="/admin/user"           element={<RoleRoute roles={ADMIN_AND_UP}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/events/create"  element={<RoleRoute roles={ADMIN_AND_UP}><CreateEvent /></RoleRoute>} />
        <Route path="/admin/event/:eventId" element={<RoleRoute roles={ADMIN_AND_UP}><AdminEventPage /></RoleRoute>} />

        {/* ── Admin routes (ADMIN + SUPER_ADMIN) ── */}
        <Route path="/admin/analytics"       element={<RoleRoute roles={ADMIN_AND_UP}><AdminAnalyticsPage /></RoleRoute>} />
        <Route path="/admin/audit-logs"      element={<RoleRoute roles={ADMIN_AND_UP}><AdminAuditLogsPage /></RoleRoute>} />
        <Route path="/admin/judges"          element={<RoleRoute roles={ADMIN_AND_UP}><AdminJudgesPage /></RoleRoute>} />
        <Route path="/admin/judges/:userId"  element={<RoleRoute roles={ADMIN_AND_UP}><AdminJudgeAssignmentPage /></RoleRoute>} />
        <Route path="/admin/sponsors"        element={<RoleRoute roles={ADMIN_AND_UP}><AdminSponsorsPage /></RoleRoute>} />
        <Route path="/admin/support-tickets" element={<RoleRoute roles={ADMIN_AND_UP}><AdminSupportTicketsPage /></RoleRoute>} />
        <Route
          path="/admin/events/:eventId/sports/:sportId"
          element={<RoleRoute roles={SPORT_HEAD_AND_UP}><AdminSport /></RoleRoute>}
        />
        <Route
          path="/admin/events/:eventId/sports/:sportId/create-match"
          element={<RoleRoute roles={SPORT_HEAD_AND_UP}><CreateMatch /></RoleRoute>}
        />

        {/* ── User Management (SUPER_ADMIN only) ── */}
        <Route path="/admin/users"       element={<RoleRoute roles={ADMIN_AND_UP}><UserManagementPage /></RoleRoute>} />
        <Route path="/admin/users/:userId" element={<RoleRoute roles={ADMIN_AND_UP}><UserDetailPage /></RoleRoute>} />

        {/* ── Team Management (ADMIN+) ── */}
        <Route path="/admin/teams"          element={<RoleRoute roles={ADMIN_AND_UP}><TeamManagementPage /></RoleRoute>} />
        <Route path="/admin/teams/:teamId"  element={<RoleRoute roles={ADMIN_AND_UP}><TeamDetailPage /></RoleRoute>} />

        {/* ── Robot Management (ADMIN+) ── */}
        <Route path="/admin/robots"           element={<RoleRoute roles={ADMIN_AND_UP}><AdminRobotsPage /></RoleRoute>} />
        <Route path="/admin/robots/:robotId"  element={<RoleRoute roles={ADMIN_AND_UP}><AdminRobotDetailPage /></RoleRoute>} />

        {/* ── Certificate Management (ADMIN+) ── */}
        <Route path="/admin/certificates"     element={<RoleRoute roles={ADMIN_AND_UP}><AdminCertificatesPage /></RoleRoute>} />

        {/* ── Role-specific dashboards ── */}
        <Route path="/organizer-dashboard"   element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerDashboard /></RoleRoute>} />
        <Route path="/admin-dashboard"       element={<RoleRoute roles={ADMIN_AND_UP}><AdminRoleDashboard /></RoleRoute>} />
        <Route path="/super-admin-dashboard" element={<RoleRoute roles={[AppRole.SUPER_ADMIN]}><SuperAdminDashboard /></RoleRoute>} />

        {/* ── Organizer Portal ── */}
        <Route path="/organizer/events"          element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerEventsPage /></RoleRoute>} />
        <Route path="/organizer/events/create"   element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerCreateEventPage /></RoleRoute>} />
        <Route path="/organizer/events/:eventId" element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerEventDetailPage /></RoleRoute>} />
        <Route
          path="/organizer/events/:eventId/sports/:sportId"
          element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerSportDetailPage /></RoleRoute>}
        />
        <Route
          path="/organizer/events/:eventId/sports/:sportId/create-match"
          element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerBracketPage /></RoleRoute>}
        />
        <Route path="/organizer/sports"          element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerSportsPage /></RoleRoute>} />
        <Route path="/organizer/matches"         element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerMatchesPage /></RoleRoute>} />
        <Route path="/organizer/registrations"   element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerRegistrationsPage /></RoleRoute>} />
        <Route path="/organizer/communication"   element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerCommunicationPage /></RoleRoute>} />
        <Route path="/organizer/schedule"        element={<RoleRoute roles={SPORT_HEAD_AND_UP}><OrganizerSchedulePage /></RoleRoute>} />
        <Route path="/organizer/monitoring"      element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerMonitoringPage /></RoleRoute>} />
        <Route path="/organizer/incidents"       element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerIncidentsPage /></RoleRoute>} />
        <Route path="/organizer/reports"         element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerReportsPage /></RoleRoute>} />
        <Route path="/organizer/closure"         element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerClosurePage /></RoleRoute>} />
        <Route path="/organizer/volunteers"      element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerVolunteersPage /></RoleRoute>} />
        <Route path="/organizer/judges"          element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerJudgesPage /></RoleRoute>} />
        <Route path="/organizer/staff"           element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerStaffPage /></RoleRoute>} />
        <Route path="/organizer/venue"           element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerVenuePage /></RoleRoute>} />
        <Route path="/organizer/certificates"    element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerCertificatesPage /></RoleRoute>} />
        <Route path="/organizer/analytics"       element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerAnalyticsPage /></RoleRoute>} />
        <Route path="/organizer/settings"        element={<RoleRoute roles={EVENT_HEAD_AND_UP}><OrganizerSettingsPage /></RoleRoute>} />

        {/* ── Sub-Organizer Portal ── */}
        <Route path="/organizer/my-sports"      element={<RoleRoute roles={SPORT_HEAD_AND_UP}><SubOrganizerSportsPage /></RoleRoute>} />
        <Route path="/organizer/scores"         element={<RoleRoute roles={SPORT_HEAD_AND_UP}><SubOrganizerScoresPage /></RoleRoute>} />
        <Route path="/organizer/announcements"  element={<RoleRoute roles={SPORT_HEAD_AND_UP}><SubOrganizerAnnouncementsPage /></RoleRoute>} />

        {/* ── Judge Portal ── */}
        <Route path="/judge-dashboard" element={<RoleRoute roles={[AppRole.JUDGE]}><JudgeDashboard /></RoleRoute>} />
        <Route path="/judge/matches"   element={<RoleRoute roles={[AppRole.JUDGE]}><JudgeMatchesPage /></RoleRoute>} />
        <Route path="/judge/scores"    element={<RoleRoute roles={[AppRole.JUDGE]}><JudgeScoresPage /></RoleRoute>} />

        {/* ── Volunteer Portal ── */}
        <Route path="/volunteer-dashboard" element={<RoleRoute roles={[AppRole.VOLUNTEER]}><VolunteerDashboard /></RoleRoute>} />
        <Route path="/volunteer/event"     element={<RoleRoute roles={[AppRole.VOLUNTEER]}><VolunteerEventPage /></RoleRoute>} />

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
          <FooterShell>
            <div className="flex h-screen items-center justify-center bg-gray-950 text-white text-xl">
              Page not found.
            </div>
          </FooterShell>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
