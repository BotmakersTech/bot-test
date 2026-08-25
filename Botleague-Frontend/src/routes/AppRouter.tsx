import { Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";

// ============================
// LAYOUT
// ============================
import Layout from "../feature/Navigation/pages/Layout";
import AppFooter from "../shared/components/AppFooter";
import PublicNavbar from "../shared/components/PublicNavbar";
import PublicBottomNav from "../shared/components/PublicBottomNav";

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
import AdminSportRankingPage from "../feature/Admin/pages/AdminSportRankingPage";
import AdminUpdateScorePage from "../feature/Admin/pages/AdminUpdateScorePage";
import AdminAllSportsPage from "../feature/Admin/pages/AdminAllSportsPage";
import AdminCatalogPage from "../feature/Admin/pages/AdminCatalogPage";
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

// TEMP — visual QA harness, see DevPreviewMRM below.
import MobileRobotManagement from "../feature/Admin/components/MobileRobotManagement";
import "../styles/organizerTheme.css";
import "../styles/responsiveView.css";
import "../styles/adminMobileList.css";

// TEMP — visual QA harness, see DevPreviewMMT below.
import MobileMyTeam from "../feature/Team/components/MobileMyTeam";
import eventBgPreview from "../assets/Auth/drone.svg";
import fallbackRobotPreview from "../assets/robot.png";
import "../styles/teamDashboard.css";

// TEMP — visual QA harness, see DevPreviewMTM / DevPreviewMUM below.
import MobileTeamManagement from "../feature/SuperAdmin/components/MobileTeamManagement";
import MobileUserManagement from "../feature/SuperAdmin/components/MobileUserManagement";

// TEMP — visual QA harness, see DevPreviewEVT below.
import { EventCard } from "../feature/Event/pages/UserEventPage";
import "../styles/eventsUser.css";

// TEMP — visual QA harness, see DevPreviewRANK below.
import RankingRow from "../feature/Rankings/components/RankingRow";
import "../styles/rankings.css";

// TEMP — visual QA harness, see DevPreviewMMM below.
import MobileMemberManagement from "../feature/Team/TeamMembership/components/MobileMemberManagement";
import "../styles/teamDashboard.css";
import "../styles/memberManagement.css";


// TEMP — visual QA harness, see DevPreviewMJG below.
import MobileJudgeEcosystem from "../feature/Admin/components/MobileJudgeEcosystem";

// TEMP — visual QA harness, see DevPreviewROBOTS below.
import MobileRobotBuild from "../feature/Robots/components/MobileRobotBuild";
import MobileRobotEmptyState from "../feature/Robots/components/MobileRobotEmptyState";
import { toLabel as robotToLabel, getRobotImage as getRobotPreviewImage, getWeight as getRobotPreviewWeight } from "../feature/Robots/pages/RobotsPages";
import "../styles/robots.css";

// TEMP — visual QA harness, see DevPreviewAPM below.
import AvatarPickerModal from "../feature/Profile/components/AvatarPickerModal";

// TEMP — visual QA harness, see DevPreviewCRF below.
import CreateRobotForm from "../feature/Robots/components/CreateRobotFrom";

function FooterShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AppFooter />
      <PublicBottomNav />
    </>
  );
}

// TEMP — visual QA harness for MobileRobotManagement, no auth/backend needed.
// Remove once the styling review is done.
function DevPreviewMRM() {
  const robots = [
    { id: "1", robotCode: "BLU0356648", robotName: "Thunderstrike Mk-II", robotIMG: undefined, robotType: "SOCCER_ROBOT", sport: "ROBO_SOCCER", weightClass: undefined, weightKg: 1.5, controlType: "MANUAL", status: "ACTIVE", teamId: "t1", teamName: "Circuit Breakers", teamCode: "BLT001" },
    { id: "2", robotCode: "BLU0221190", robotName: "Iron Fury", robotIMG: undefined, robotType: "COMBAT_ROBOT", sport: "ROBOWAR_8KG", weightClass: undefined, weightKg: 8, controlType: "MANUAL", status: "ACTIVE", teamId: "t2", teamName: "Steel Titans", teamCode: "BLT002" },
    { id: "3", robotCode: "BLU0987654", robotName: "Falcon", robotIMG: undefined, robotType: "SOCCER_ROBOT", sport: "ROBO_SOCCER", weightClass: undefined, weightKg: 1.5, controlType: "AUTONOMOUS", status: "MAINTENANCE", teamId: "t3", teamName: "Nova Robotics", teamCode: "BLT003" },
    { id: "4", robotCode: "BLU0112233", robotName: "Widowmaker", robotIMG: undefined, robotType: "COMBAT_ROBOT", sport: "ROBOWAR_1_5KG", weightClass: undefined, weightKg: 1.5, controlType: "MANUAL", status: "INACTIVE", teamId: "t4", teamName: "Apex Builders", teamCode: "BLT004" },
  ] as import("../feature/SuperAdmin/api/robotManagement.api").AdminRobotSummary[];

  return (
    <Layout>
      <div className="org-page-bg p-8 view-desktop-only">
        <div style={{ position: "relative", zIndex: 1 }}>DESKTOP TABLE PLACEHOLDER</div>
      </div>
      <div className="view-mobile-only">
        <MobileRobotManagement
          robots={robots}
          loading={false}
          error={null}
          totalElements={robots.length}
          search=""
          onSearchChange={() => {}}
          onSearchSubmit={() => {}}
          statusFilter="ALL"
          onStatusFilterChange={() => {}}
          typeFilter="ALL"
          onTypeFilterChange={() => {}}
          page={0}
          totalPages={3}
          pageNumbers={[0, 1, 2]}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          onPageSelect={() => {}}
          onRowClick={() => {}}
          onCreateRobot={() => {}}
        />
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for MobileMyTeam, no auth/backend needed.
// Remove once the styling review is done.
function DevPreviewMMT() {
  return (
    <Layout>
      <div className="teamdash-page teamdash-desktop-only">
        <div style={{ position: "relative", zIndex: 1, padding: 24 }}>DESKTOP PLACEHOLDER (unchanged)</div>
      </div>
      <div className="teamdash-mobile-only">
        <MobileMyTeam
          currentTeamName="Circuit Breakers"
          currentTeamCode="BLT001"
          teamLogo={undefined}
          isActive={true}
          statusLabel="Active"
          rankLabel={4}
          winRatePct={68}
          sinceYear="2024"
          sinceLine="Sponsored By Nova Robotics"
          sinceLineHref="#team-info"
          canEditTeam={true}
          onEditTeam={() => {}}
          error={null}
          onRetry={() => {}}
          onOpenChats={() => {}}
          featuredImage={eventBgPreview}
          hasEvent={true}
          eventName="Robowars Nationals 2026"
          eventLocationLabel="Pragati Maidan, New Delhi"
          eventDateLabel="12 March 2026"
          eventCtaLabel="View Details"
          onViewEvent={() => {}}
          countdown={{ days: 12, hours: 5, mins: 30 }}
          activeSquadCount={3}
          squadPreview={[
            { key: "1", name: "Aditi Sharma", roleLabel: "Captain", photoSrc: undefined, initials: "AS", isActive: true },
            { key: "2", name: "Rohan Mehta", roleLabel: "Vice Captain", photoSrc: undefined, initials: "RM", isActive: true },
            { key: "3", name: "Jai Ho", roleLabel: "Member", photoSrc: undefined, initials: "JH", isActive: false },
          ]}
          onManageMembers={() => {}}
          robots={[
            { id: "r1", image: fallbackRobotPreview, name: "Thunderstrike Mk-II", category: "Combat Robot", statusLabel: "Active", weightClassLabel: "8kg" },
            { id: "r2", image: fallbackRobotPreview, name: "Iron Fury", category: "Combat Robot", statusLabel: "Active", weightClassLabel: "8kg" },
            { id: "r3", image: fallbackRobotPreview, name: "Falcon", category: "Soccer Robot", statusLabel: "Maintenance", weightClassLabel: "1.5kg" },
          ]}
          wins={14}
          onViewAllRobots={() => {}}
          onAddRobot={() => {}}
        />
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for MobileTeamManagement, no auth/backend needed.
// Remove once the styling review is done.
function DevPreviewMTM() {
  const teams = [
    { id: "1", teamCode: "BLT001", teamName: "Circuit Breakers", logoUrl: undefined, institutionName: "IIT Bombay", city: "Mumbai", state: "MH", country: "India", status: "ACTIVE", memberCount: 5, createdAt: "2024-03-01" },
    { id: "2", teamCode: "BLT002", teamName: "Steel Titans", logoUrl: undefined, institutionName: "NIT Trichy", city: "Trichy", state: "TN", country: "India", status: "PENDING", memberCount: 3, createdAt: "2024-06-14" },
    { id: "3", teamCode: "BLT003", teamName: "Nova Robotics", logoUrl: undefined, institutionName: "BITS Pilani", city: "Pilani", state: "RJ", country: "India", status: "ACTIVE", memberCount: 6, createdAt: "2025-01-20" },
    { id: "4", teamCode: "BLT004", teamName: "Apex Builders", logoUrl: undefined, institutionName: "VJTI", city: "Mumbai", state: "MH", country: "India", status: "REJECTED", memberCount: 2, createdAt: "2025-05-11" },
  ] as import("../feature/SuperAdmin/api/teamManagement.api").AdminTeamSummary[];

  return (
    <Layout>
      <div className="org-page-bg p-8 view-desktop-only">
        <div style={{ position: "relative", zIndex: 1 }}>DESKTOP TABLE PLACEHOLDER</div>
      </div>
      <div className="view-mobile-only">
        <MobileTeamManagement
          teams={teams}
          loading={false}
          error={null}
          totalElements={teams.length}
          search=""
          onSearchChange={() => {}}
          onSearchSubmit={() => {}}
          statusFilter="ALL"
          onStatusFilterChange={() => {}}
          page={0}
          totalPages={3}
          pageNumbers={[0, 1, 2]}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          onPageSelect={() => {}}
          onRowClick={() => {}}
          onCreateTeam={() => {}}
        />
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for MobileUserManagement, no auth/backend needed.
// Remove once the styling review is done.
function DevPreviewMUM() {
  const users = [
    { id: "1", botleagueId: "BLU2612345", username: "aditi.s", firstName: "Aditi", lastName: "Sharma", email: "aditi@example.com", phone: "9812345670", accountStatus: "ACTIVE", primaryRole: "COMPETITOR", allRoles: ["COMPETITOR"], createdAt: "2024-03-01", lastLoginAt: null },
    { id: "2", botleagueId: "BLU2600004", username: "rohan.m", firstName: "Rohan", lastName: "Mehta", email: "rohan@example.com", phone: "9812345671", accountStatus: "PENDING", primaryRole: "SPORT_HEAD", allRoles: ["SPORT_HEAD"], createdAt: "2024-06-14", lastLoginAt: null },
    { id: "3", botleagueId: "BLU2600123", username: "jai.ho", firstName: "Jai", lastName: "Ho", email: "jai@example.com", phone: "9812345672", accountStatus: "ACTIVE", primaryRole: "ADMIN", allRoles: ["ADMIN"], createdAt: "2025-01-20", lastLoginAt: null },
    { id: "4", botleagueId: "BLU2600999", username: "nova.r", firstName: "Nova", lastName: "Robotics", email: "nova@example.com", phone: "9812345673", accountStatus: "INACTIVE", primaryRole: "COMPETITOR", allRoles: ["COMPETITOR"], createdAt: "2025-05-11", lastLoginAt: null },
  ] as import("../feature/SuperAdmin/api/userManagement.api").UserSummary[];

  return (
    <Layout>
      <div className="org-page-bg p-8 view-desktop-only">
        <div style={{ position: "relative", zIndex: 1 }}>DESKTOP TABLE PLACEHOLDER</div>
      </div>
      <div className="view-mobile-only">
        <MobileUserManagement
          users={users}
          loading={false}
          error={null}
          totalElements={users.length}
          search=""
          onSearchChange={() => {}}
          onSearchSubmit={() => {}}
          page={0}
          totalPages={3}
          pageNumbers={[0, 1, 2]}
          onPrevPage={() => {}}
          onNextPage={() => {}}
          onPageSelect={() => {}}
          onRowClick={() => {}}
          onCreateUser={() => {}}
        />
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for MobileJudgeEcosystem, no auth/backend needed.
// Remove once the styling review is done.
function DevPreviewMJG() {
  const judges = [
    { id: "1", botleagueId: "BLU2612345", username: "aditi.s", firstName: "Aditi", lastName: "Sharma", email: "aditi@example.com", phone: "9812345670", accountStatus: "ACTIVE", primaryRole: "JUDGE", allRoles: ["JUDGE"], createdAt: "2024-03-01", lastLoginAt: null },
    { id: "2", botleagueId: "BLU2600004", username: "rohan.m", firstName: "Rohan", lastName: "Mehta", email: "rohan@example.com", phone: "9812345671", accountStatus: "PENDING", primaryRole: "JUDGE", allRoles: ["JUDGE"], createdAt: "2024-06-14", lastLoginAt: null },
    { id: "3", botleagueId: "BLU2600123", username: "jai.ho", firstName: "Jai", lastName: "Ho", email: "jai@example.com", phone: "9812345672", accountStatus: "ACTIVE", primaryRole: "JUDGE", allRoles: ["JUDGE"], createdAt: "2025-01-20", lastLoginAt: null },
  ] as import("../feature/SuperAdmin/api/userManagement.api").UserSummary[];

  return (
    <Layout>
      <div className="org-page-bg p-8 view-desktop-only">
        <div style={{ position: "relative", zIndex: 1 }}>DESKTOP TABLE PLACEHOLDER</div>
      </div>
      <div className="view-mobile-only">
        <MobileJudgeEcosystem
          judges={judges}
          loading={false}
          error={null}
          search=""
          onSearchChange={() => {}}
          onSearchSubmit={() => {}}
          onRowClick={() => {}}
          onManageRoles={() => {}}
        />
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for the Browse Events card, no auth/backend
// needed. Remove once the styling review is done.
function DevPreviewEVT() {
  const events = [
    { id: "1", eventCode: "EVT-001", eventName: "Robowars Nationals 2026", eventDescription: "The biggest combat robotics championship of the year, featuring 8kg and 15kg weight classes across three arenas.", eventLogoUrl: undefined, venueName: "Pragati Maidan", city: "New Delhi", state: "Delhi", startDate: "2026-03-12", endDate: "2026-03-14", status: "REGISTRATION_OPEN", createdAt: "2025-01-01" },
    { id: "2", eventCode: "EVT-002", eventName: "Soccer Bots Invitational", eventDescription: "Autonomous soccer robots compete for the regional title.", eventLogoUrl: undefined, venueName: "IIT Bombay Grounds", city: "Mumbai", state: "MH", startDate: "2026-04-05", endDate: "2026-04-05", status: "PUBLISHED", createdAt: "2025-01-01" },
    { id: "3", eventCode: "EVT-003", eventName: "Line Follower Sprint", eventDescription: undefined, eventLogoUrl: undefined, venueName: "NIT Trichy Arena", city: "Trichy", state: "TN", startDate: "2026-02-20", endDate: "2026-02-20", status: "LIVE", createdAt: "2025-01-01" },
  ] as import("../feature/Event/api/event.api").EventResponse[];

  return (
    <Layout>
      <div className="evt-page min-h-screen p-4">
        <div className="flex flex-col gap-3">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onClick={() => {}} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for the full UserEventPage (header/search/
// heading), not just the card. Uses the real component/hook, so it needs
// the backend up but not auth. Remove once the styling review is done.
function DevPreviewEVTPage() {
  return (
    <Layout>
      <UserEventPage />
    </Layout>
  );
}

// TEMP — visual QA harness for the Rankings mobile card, no auth/backend
// needed. Remove once the styling review is done.
function DevPreviewRANK() {
  const entries = [
    { rank: 1, previousRank: 2, rankDelta: 1, robotId: "r1", robotName: "Thunderstrike Mk-II", teamId: "t1", teamName: "Circuit Breakers", avatarUrl: undefined, state: "MH", city: "Mumbai", sport: "ROBO_WAR", ageGroup: "JUNIOR", ageGroupLabel: "Junior", weightClass: "8kg", totalPoints: 980, eventsPlayed: 6, matchesPlayed: 14 },
    { rank: 2, previousRank: 1, rankDelta: -1, robotId: "r2", robotName: "Iron Fury", teamId: "t2", teamName: "Steel Titans", avatarUrl: undefined, state: "TN", city: "Chennai", sport: "ROBO_WAR", ageGroup: "JUNIOR", ageGroupLabel: "Junior", weightClass: "8kg", totalPoints: 910, eventsPlayed: 5, matchesPlayed: 12 },
    { rank: 4, previousRank: 4, rankDelta: 0, robotId: "r4", robotName: "Widowmaker", teamId: "t4", teamName: "Apex Builders", avatarUrl: undefined, state: "RJ", city: "Jaipur", sport: "ROBO_WAR", ageGroup: "JUNIOR", ageGroupLabel: "Junior", weightClass: "8kg", totalPoints: 640, eventsPlayed: 3, matchesPlayed: 7 },
  ] as import("../feature/Rankings/api/rankings.api").GlobalRankingEntry[];

  return (
    <Layout>
      <div className="rank-page min-h-screen p-4">
        <div className="flex flex-col gap-[10px]">
          {entries.map((e) => (
            <RankingRow key={e.robotId ?? e.teamId} entry={e} onOpen={() => {}} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for the Notifications page, renders the real
// component (uses its demoNotifications fallback when the store is empty).
// Remove once the styling review is done.
function DevPreviewNOTIF() {
  return (
    <Layout>
      <NotificationsPage />
    </Layout>
  );
}

// TEMP — visual QA harness for MobileMemberManagement, no auth/backend
// needed. Remove once the styling review is done.
function DevPreviewMMM() {
  const baseRow = {
    actionLoading: false,
    onChangeRole: () => {},
    confirmingRoleChange: false,
    pendingRoleLabel: "",
    onConfirmRoleChange: () => {},
    onCancelRoleChange: () => {},
    confirmingCaptain: false,
    onStartMakeCaptain: () => {},
    onConfirmMakeCaptain: () => {},
    onCancelMakeCaptain: () => {},
    isRemoving: false,
    confirmingRemove: false,
    onStartRemove: () => {},
    onConfirmRemove: () => {},
    onCancelRemove: () => {},
  };
  const rows = [
    { ...baseRow, userId: "1", name: "Aditi Sharma", initials: "AS", photoSrc: null, roleLabel: "Captain", roleClass: "captain", featured: true, showActions: false, roleOptions: [], canMakeCaptain: false },
    { ...baseRow, userId: "2", name: "Rohan Mehta", initials: "RM", photoSrc: null, roleLabel: "Vice Captain", roleClass: "vice_captain", featured: false, showActions: true, roleOptions: [{ value: "MEMBER", label: "Member" }, { value: "MENTOR", label: "Mentor" }], canMakeCaptain: true },
    { ...baseRow, userId: "3", name: "Jai Ho", initials: "JH", photoSrc: null, roleLabel: "Member", roleClass: "member", featured: false, showActions: true, roleOptions: [{ value: "VICE_CAPTAIN", label: "Vice Captain" }, { value: "MENTOR", label: "Mentor" }], canMakeCaptain: true },
  ];

  return (
    <Layout>
      <div className="teamdash-page teamdash-desktop-only">
        <div style={{ position: "relative", zIndex: 1, padding: 24 }}>DESKTOP PLACEHOLDER (unchanged)</div>
      </div>
      <div className="teamdash-mobile-only">
        <MobileMemberManagement
          onBack={() => {}}
          error={null}
          onRetry={() => {}}
          loading={false}
          isAdmin={true}
          botleagueId=""
          onBotleagueIdChange={() => {}}
          inviteRole="MEMBER"
          onInviteRoleChange={() => {}}
          inviteRoleOptions={[{ value: "MEMBER", label: "Member" }, { value: "VICE_CAPTAIN", label: "Vice Captain" }, { value: "MENTOR", label: "Mentor" }]}
          inviteLoading={false}
          inviteMessage={null}
          onInvite={() => {}}
          searchQuery=""
          onSearchQueryChange={() => {}}
          totalMemberCount={rows.length}
          rows={rows}
          onLeaveTeam={() => {}}
          confirmingLeaveTeam={false}
          onStartLeaveTeam={() => {}}
          onCancelLeaveTeam={() => {}}
          leaveTeamLoading={false}
        />
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for MobileRobotBuild, no auth/backend needed.
// Remove once the styling review is done.
function DevPreviewROBOTS() {
  const robots = [
    { id: "r1", robotCode: "BLR2600001", robotName: "Vortex R1", robotType: "SUMO_ROBOT", sport: "ROBO_SUMO", eligibleCategories: [], weightKg: 5, controlType: "MANUAL", description: "", status: "ACTIVE", teamId: "t1", createdAt: "", robotIMG: fallbackRobotPreview },
    { id: "r2", robotCode: "BLR2600002", robotName: "Ironclaw", robotType: "COMBAT_ROBOT", sport: "ROBOWAR_8KG", eligibleCategories: [], weightKg: 2, controlType: "MANUAL", description: "", status: "ACTIVE", teamId: "t1", createdAt: "", robotIMG: fallbackRobotPreview },
    { id: "r3", robotCode: "BLR2600003", robotName: "Falcon", robotType: "DRONE", sport: "DRONE_SOCCER", eligibleCategories: [], weightKg: 1.5, controlType: "AUTONOMOUS", description: "", status: "MAINTENANCE", teamId: "t1", createdAt: "", robotIMG: fallbackRobotPreview },
  ] as unknown as Parameters<typeof MobileRobotBuild>[0]["robots"];

  return (
    <Layout>
      <div className="robot-build-page">
        <div className="max-[950px]:hidden" style={{ position: "relative", zIndex: 1, padding: 24 }}>DESKTOP PLACEHOLDER (unchanged)</div>
        <div className="hidden max-[950px]:block">
          <MobileRobotBuild
            robots={robots}
            visibleRobots={robots}
            filter="ALL"
            onFilterChange={() => {}}
            canManageRobots={true}
            onAddRobot={() => {}}
            onOpenRobot={() => {}}
            getRobotImage={getRobotPreviewImage}
            getWeight={getRobotPreviewWeight}
            toLabel={robotToLabel}
          />
        </div>
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for AvatarPickerModal's mobile tile-grid, no
// auth/backend needed. Remove once the styling review is done.
function DevPreviewAPM() {
  return (
    <Layout>
      <AvatarPickerModal
        currentValue="avatar:nova"
        onClose={() => {}}
        onSelectAvatar={async () => {}}
        onUploadFile={async () => {}}
      />
    </Layout>
  );
}

// TEMP — visual QA harness for the catalog-driven CreateRobotForm, no
// auth/backend team-membership needed. Remove once the styling review is done.
function DevPreviewCRF() {
  return (
    <Layout>
      <div className="robot-build-page">
        <div className="robot-build-shell robot-create-shell">
          <CreateRobotForm onSuccess={() => {}} onCancel={() => {}} />
        </div>
      </div>
    </Layout>
  );
}

// TEMP — visual QA harness for MobileRobotEmptyState (no-robots / no-team),
// no auth/backend needed. Remove once the styling review is done.
function DevPreviewROBOTSEMPTY() {
  return (
    <Layout>
      <div className="robot-build-page">
        <div className="max-[950px]:hidden" style={{ position: "relative", zIndex: 1, padding: 24 }}>DESKTOP PLACEHOLDER (unchanged)</div>
        <div className="hidden max-[950px]:block">
          <MobileRobotEmptyState mode="no-robots" canManageRobots={true} onCreateRobot={() => {}} />
        </div>
      </div>
    </Layout>
  );
}

function DevPreviewROBOTSNOTEAM() {
  return (
    <Layout>
      <div className="robot-build-page">
        <div className="max-[950px]:hidden" style={{ position: "relative", zIndex: 1, padding: 24 }}>DESKTOP PLACEHOLDER (unchanged)</div>
        <div className="hidden max-[950px]:block">
          <MobileRobotEmptyState mode="no-team" onCreateTeam={() => {}} />
        </div>
      </div>
    </Layout>
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
      <Route path="/dev-preview/mrm" element={<DevPreviewMRM />} />
      <Route path="/dev-preview/mmt" element={<DevPreviewMMT />} />
      <Route path="/dev-preview/mtm" element={<DevPreviewMTM />} />
      <Route path="/dev-preview/mum" element={<DevPreviewMUM />} />
      <Route path="/dev-preview/mjg" element={<DevPreviewMJG />} />
      <Route path="/dev-preview/evt" element={<DevPreviewEVT />} />
      <Route path="/dev-preview/evtpage" element={<DevPreviewEVTPage />} />
      <Route path="/dev-preview/rank" element={<DevPreviewRANK />} />
      <Route path="/dev-preview/mmm" element={<DevPreviewMMM />} />
      <Route path="/dev-preview/notif" element={<DevPreviewNOTIF />} />
      <Route path="/dev-preview/robots" element={<DevPreviewROBOTS />} />
      <Route path="/dev-preview/apm" element={<DevPreviewAPM />} />
      <Route path="/dev-preview/crf" element={<DevPreviewCRF />} />
      <Route path="/dev-preview/certs" element={<Layout><CertificatesPage /></Layout>} />
      <Route path="/dev-preview/robots-empty" element={<DevPreviewROBOTSEMPTY />} />
      <Route path="/dev-preview/robots-noteam" element={<DevPreviewROBOTSNOTEAM />} />
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
        <Route path="/admin/catalog"        element={<RoleRoute roles={ADMIN_AND_UP}><AdminCatalogPage /></RoleRoute>} />
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
          path="/admin/events/:eventId/sports/:sportId/ranking"
          element={<RoleRoute roles={SPORT_HEAD_AND_UP}><AdminSportRankingPage /></RoleRoute>}
        />
        <Route
          path="/admin/events/:eventId/sports/:sportId/update-score"
          element={<RoleRoute roles={SPORT_HEAD_AND_UP}><AdminUpdateScorePage /></RoleRoute>}
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
            <PublicNavbar />
            <div className="flex min-h-[70vh] items-center justify-center bg-gray-950 text-white text-xl">
              Page not found.
            </div>
          </FooterShell>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
